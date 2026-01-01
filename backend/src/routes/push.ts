import { Router } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

export const pushRouter = Router();

const registerTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

// Register push notification token
pushRouter.post('/register', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token, platform } = registerTokenSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Upsert push token
    const pushToken = await prisma.pushToken.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
      update: { token },
      create: {
        token,
        platform,
        userId: user.id,
      },
    });

    return res.json({ pushToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error registering push token:', error);
    return res.status(500).json({ error: 'Failed to register push token' });
  }
});

// Unregister push notification token
pushRouter.delete('/unregister', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { platform } = z.object({ platform: z.enum(['ios', 'android']) }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.pushToken.delete({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
    });

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error unregistering push token:', error);
    return res.status(500).json({ error: 'Failed to unregister push token' });
  }
});

// Send test notification (for development)
pushRouter.post('/test', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { pushTokens: true },
    });

    if (!user || user.pushTokens.length === 0) {
      return res.status(404).json({ error: 'No push tokens found' });
    }

    // In production, you would send actual push notifications here
    // using expo-server-sdk or similar
    const tokens = user.pushTokens.map(t => t.token);
    
    return res.json({ 
      message: 'Test notification would be sent to tokens',
      tokens,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return res.status(500).json({ error: 'Failed to send test notification' });
  }
});

