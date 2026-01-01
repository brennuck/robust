import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

export const exercisesRouter = Router();

// Get all exercises (system + user's custom)
exercisesRouter.get('/', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const search = (req.query.search as string)?.toLowerCase();
    const muscleGroup = req.query.muscleGroup as string;
    const equipment = req.query.equipment as string;

    const exercises = await prisma.exercise.findMany({
      where: {
        AND: [
          // System exercises OR user's custom exercises
          {
            OR: [
              { createdById: null },
              { createdById: user.id },
            ],
          },
          // Search filter
          search ? {
            name: { contains: search, mode: 'insensitive' },
          } : {},
          // Muscle group filter
          muscleGroup ? { muscleGroup } : {},
          // Equipment filter
          equipment ? { equipment } : {},
        ],
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Get exercise history (all sets for an exercise)
exercisesRouter.get('/:id/history', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = await prisma.workoutExercise.findMany({
      where: {
        exerciseId: req.params.id,
        workout: { userId: user.id, completedAt: { not: null } },
      },
      include: {
        workout: { select: { id: true, name: true, startedAt: true } },
        sets: {
          where: { completed: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { workout: { startedAt: 'desc' } },
      take: 20,
    });

    return res.json({ history });
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get personal records for an exercise
exercisesRouter.get('/:id/records', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const records = await prisma.personalRecord.findMany({
      where: {
        userId: user.id,
        exerciseId: req.params.id,
      },
      orderBy: { achievedAt: 'desc' },
      take: 10,
    });

    return res.json({ records });
  } catch (error) {
    console.error('Error fetching records:', error);
    return res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Create custom exercise
const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.enum(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio']),
  equipment: z.enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other']),
  instructions: z.string().optional(),
});

exercisesRouter.post('/', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data = createExerciseSchema.parse(req.body);

    const exercise = await prisma.exercise.create({
      data: {
        ...data,
        isCustom: true,
        createdById: user.id,
      },
    });

    return res.json({ exercise });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating exercise:', error);
    return res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// Get muscle groups for filtering
exercisesRouter.get('/meta/muscle-groups', async (_req, res) => {
  const muscleGroups = [
    { id: 'chest', name: 'Chest', icon: '🫁' },
    { id: 'back', name: 'Back', icon: '🔙' },
    { id: 'shoulders', name: 'Shoulders', icon: '💪' },
    { id: 'arms', name: 'Arms', icon: '💪' },
    { id: 'legs', name: 'Legs', icon: '🦵' },
    { id: 'core', name: 'Core', icon: '🎯' },
    { id: 'cardio', name: 'Cardio', icon: '❤️' },
  ];
  return res.json({ muscleGroups });
});

// Get equipment types for filtering
exercisesRouter.get('/meta/equipment', async (_req, res) => {
  const equipment = [
    { id: 'barbell', name: 'Barbell', icon: '🏋️' },
    { id: 'dumbbell', name: 'Dumbbell', icon: '🏋️' },
    { id: 'machine', name: 'Machine', icon: '⚙️' },
    { id: 'cable', name: 'Cable', icon: '🔗' },
    { id: 'bodyweight', name: 'Bodyweight', icon: '🤸' },
    { id: 'other', name: 'Other', icon: '📦' },
  ];
  return res.json({ equipment });
});

