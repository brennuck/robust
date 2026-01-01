import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

export const workoutsRouter = Router();

// Get all workouts for user (with pagination)
workoutsRouter.get('/', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where: { userId: user.id },
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: { orderBy: { order: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workout.count({ where: { userId: user.id } }),
    ]);

    return res.json({ workouts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// Get single workout
workoutsRouter.get('/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: user.id },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!workout) return res.status(404).json({ error: 'Workout not found' });
    return res.json({ workout });
  } catch (error) {
    console.error('Error fetching workout:', error);
    return res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// Start a new workout
const startWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  templateId: z.string().optional(),
});

workoutsRouter.post('/start', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, templateId } = startWorkoutSchema.parse(req.body);

    // If starting from template, copy exercises
    let exercises: { exerciseId: string; order: number; restTime: number | null; sets: { order: number }[] }[] = [];
    
    if (templateId) {
      const template = await prisma.workoutTemplate.findFirst({
        where: { id: templateId, userId: user.id },
        include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
      });

      if (template) {
        exercises = template.exercises.map((te, index) => ({
          exerciseId: te.exerciseId,
          order: index,
          restTime: te.restTime,
          sets: Array.from({ length: te.targetSets }, (_, i) => ({ order: i })),
        }));
      }
    }

    const workout = await prisma.workout.create({
      data: {
        name,
        userId: user.id,
        exercises: {
          create: exercises.map((e) => ({
            exerciseId: e.exerciseId,
            order: e.order,
            restTime: e.restTime,
            sets: {
              create: e.sets.map((s) => ({
                order: s.order,
                completed: false,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return res.json({ workout });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error starting workout:', error);
    return res.status(500).json({ error: 'Failed to start workout' });
  }
});

// Add exercise to workout
const addExerciseSchema = z.object({
  exerciseId: z.string(),
});

workoutsRouter.post('/:id/exercises', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { exerciseId } = addExerciseSchema.parse(req.body);

    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: user.id },
      include: { exercises: true },
    });

    if (!workout) return res.status(404).json({ error: 'Workout not found' });

    const workoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutId: workout.id,
        exerciseId,
        order: workout.exercises.length,
        restTime: 90,
        sets: {
          create: [{ order: 0, completed: false }],
        },
      },
      include: {
        exercise: true,
        sets: { orderBy: { order: 'asc' } },
      },
    });

    return res.json({ exercise: workoutExercise });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error adding exercise:', error);
    return res.status(500).json({ error: 'Failed to add exercise' });
  }
});

// Update a set
const updateSetSchema = z.object({
  weight: z.number().optional(),
  reps: z.number().optional(),
  completed: z.boolean().optional(),
  isWarmup: z.boolean().optional(),
  isDropset: z.boolean().optional(),
  isFailure: z.boolean().optional(),
});

workoutsRouter.patch('/sets/:setId', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data = updateSetSchema.parse(req.body);

    // Verify ownership
    const set = await prisma.workoutSet.findFirst({
      where: { id: req.params.setId },
      include: {
        workoutExercise: {
          include: {
            workout: true,
            exercise: true,
          },
        },
      },
    });

    if (!set || set.workoutExercise.workout.userId !== user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // Check for PR if completing set with weight and reps
    let isPR = false;
    if (data.completed && data.weight && data.reps) {
      const existingPR = await prisma.personalRecord.findFirst({
        where: {
          userId: user.id,
          exerciseId: set.workoutExercise.exerciseId,
        },
        orderBy: { weight: 'desc' },
      });

      // Simple PR check: more weight at same or more reps
      if (!existingPR || (data.weight > existingPR.weight && data.reps >= existingPR.reps)) {
        isPR = true;
        
        // Calculate estimated 1RM using Brzycki formula
        const e1RM = data.weight * (36 / (37 - data.reps));
        
        await prisma.personalRecord.create({
          data: {
            userId: user.id,
            exerciseId: set.workoutExercise.exerciseId,
            weight: data.weight,
            reps: data.reps,
            estimated1RM: e1RM,
            achievedAt: new Date(),
          },
        });
      }
    }

    const updatedSet = await prisma.workoutSet.update({
      where: { id: req.params.setId },
      data: { ...data, isPR },
    });

    return res.json({ set: updatedSet, isPR });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating set:', error);
    return res.status(500).json({ error: 'Failed to update set' });
  }
});

// Add a set to exercise
workoutsRouter.post('/exercises/:exerciseId/sets', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify ownership
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: { id: req.params.exerciseId },
      include: { workout: true, sets: true },
    });

    if (!workoutExercise || workoutExercise.workout.userId !== user.id) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Copy previous set data if exists
    const lastSet = workoutExercise.sets[workoutExercise.sets.length - 1];

    const newSet = await prisma.workoutSet.create({
      data: {
        workoutExerciseId: workoutExercise.id,
        order: workoutExercise.sets.length,
        weight: lastSet?.weight,
        reps: lastSet?.reps,
        completed: false,
      },
    });

    return res.json({ set: newSet });
  } catch (error) {
    console.error('Error adding set:', error);
    return res.status(500).json({ error: 'Failed to add set' });
  }
});

// Delete a set
workoutsRouter.delete('/sets/:setId', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify ownership
    const set = await prisma.workoutSet.findFirst({
      where: { id: req.params.setId },
      include: { workoutExercise: { include: { workout: true } } },
    });

    if (!set || set.workoutExercise.workout.userId !== user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    await prisma.workoutSet.delete({ where: { id: req.params.setId } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting set:', error);
    return res.status(500).json({ error: 'Failed to delete set' });
  }
});

// Complete workout
workoutsRouter.post('/:id/complete', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: user.id },
    });

    if (!workout) return res.status(404).json({ error: 'Workout not found' });

    const completedAt = new Date();
    const duration = Math.floor((completedAt.getTime() - workout.startedAt.getTime()) / 1000);

    const updatedWorkout = await prisma.workout.update({
      where: { id: workout.id },
      data: { completedAt, duration },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return res.json({ workout: updatedWorkout });
  } catch (error) {
    console.error('Error completing workout:', error);
    return res.status(500).json({ error: 'Failed to complete workout' });
  }
});

// Delete workout
workoutsRouter.delete('/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const workout = await prisma.workout.findFirst({
      where: { id: req.params.id, userId: user.id },
    });

    if (!workout) return res.status(404).json({ error: 'Workout not found' });

    await prisma.workout.delete({ where: { id: workout.id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return res.status(500).json({ error: 'Failed to delete workout' });
  }
});

