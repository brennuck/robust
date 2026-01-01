import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma.js';

export const foldersRouter = Router();

// Get all folders with their templates
foldersRouter.get('/', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const folders = await prisma.routineFolder.findMany({
      where: { userId: user.id },
      include: {
        templates: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Also get templates without a folder
    const unfolderedTemplates = await prisma.workoutTemplate.findMany({
      where: {
        userId: user.id,
        folderId: null,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ folders, unfolderedTemplates });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create a folder
foldersRouter.post('/', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, color } = req.body;

    // Get the highest order value
    const lastFolder = await prisma.routineFolder.findFirst({
      where: { userId: user.id },
      orderBy: { order: 'desc' },
    });

    const folder = await prisma.routineFolder.create({
      data: {
        name,
        color,
        order: (lastFolder?.order ?? -1) + 1,
        userId: user.id,
      },
    });

    return res.status(201).json({ folder });
  } catch (error) {
    console.error('Error creating folder:', error);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update a folder
foldersRouter.patch('/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { id } = req.params;
    const { name, color, order } = req.body;

    const folder = await prisma.routineFolder.findFirst({
      where: { id, userId: user.id },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const updated = await prisma.routineFolder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order }),
      },
    });

    return res.json({ folder: updated });
  } catch (error) {
    console.error('Error updating folder:', error);
    return res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete a folder (templates inside will become unfoldered)
foldersRouter.delete('/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { id } = req.params;

    const folder = await prisma.routineFolder.findFirst({
      where: { id, userId: user.id },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    await prisma.routineFolder.delete({
      where: { id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Move a template to a folder (or remove from folder)
foldersRouter.post('/:id/templates', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { id } = req.params;
    const { templateId } = req.body;

    // Verify folder belongs to user (or id is 'none' to remove from folder)
    if (id !== 'none') {
      const folder = await prisma.routineFolder.findFirst({
        where: { id, userId: user.id },
      });

      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
    }

    // Verify template belongs to user
    const template = await prisma.workoutTemplate.findFirst({
      where: { id: templateId, userId: user.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const updated = await prisma.workoutTemplate.update({
      where: { id: templateId },
      data: {
        folderId: id === 'none' ? null : id,
      },
    });

    return res.json({ template: updated });
  } catch (error) {
    console.error('Error moving template:', error);
    return res.status(500).json({ error: 'Failed to move template' });
  }
});
