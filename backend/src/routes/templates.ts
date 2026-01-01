import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

export const templatesRouter = Router();

// Get all templates
templatesRouter.get('/', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const templates = await prisma.workoutTemplate.findMany({
      where: { userId: user.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
templatesRouter.get('/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: req.params.id, userId: user.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });
    return res.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  notes: z.string().optional(),
  color: z.string().optional(),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    targetSets: z.number().min(1).max(20).default(3),
    targetReps: z.string().default('8-12'),
    restTime: z.number().optional(),
    notes: z.string().optional(),
  })).optional(),
});

templatesRouter.post('/', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, notes, color, exercises = [] } = createTemplateSchema.parse(req.body);

    const template = await prisma.workoutTemplate.create({
      data: {
        name,
        notes,
        color,
        userId: user.id,
        exercises: {
          create: exercises.map((e, index) => ({
            exerciseId: e.exerciseId,
            order: index,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            restTime: e.restTime,
            notes: e.notes,
          })),
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return res.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating template:', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
templatesRouter.patch('/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.workoutTemplate.findFirst({
      where: { id: req.params.id, userId: user.id },
    });

    if (!existing) return res.status(404).json({ error: 'Template not found' });

    const { name, notes, color, exercises } = createTemplateSchema.partial().parse(req.body);

    // If exercises provided, replace all
    if (exercises) {
      await prisma.templateExercise.deleteMany({ where: { templateId: existing.id } });
      await prisma.templateExercise.createMany({
        data: exercises.map((e, index) => ({
          templateId: existing.id,
          exerciseId: e.exerciseId,
          order: index,
          targetSets: e.targetSets || 3,
          targetReps: e.targetReps || '8-12',
          restTime: e.restTime,
          notes: e.notes,
        })),
      });
    }

    const template = await prisma.workoutTemplate.update({
      where: { id: existing.id },
      data: { name, notes, color },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return res.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating template:', error);
    return res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
templatesRouter.delete('/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const template = await prisma.workoutTemplate.findFirst({
      where: { id: req.params.id, userId: user.id },
    });

    if (!template) return res.status(404).json({ error: 'Template not found' });

    await prisma.workoutTemplate.delete({ where: { id: template.id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Failed to delete template' });
  }
});

