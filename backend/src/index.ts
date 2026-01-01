import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { prisma } from './lib/prisma.js';
import { userRouter } from './routes/user.js';
import { pushRouter } from './routes/push.js';
import { workoutsRouter } from './routes/workouts.js';
import { exercisesRouter } from './routes/exercises.js';
import { templatesRouter } from './routes/templates.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(clerkMiddleware());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.get('/api/public', (_req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Protected routes
app.use('/api/user', requireAuth(), userRouter);
app.use('/api/push', requireAuth(), pushRouter);
app.use('/api/workouts', requireAuth(), workoutsRouter);
app.use('/api/exercises', requireAuth(), exercisesRouter);
app.use('/api/templates', requireAuth(), templatesRouter);

// Sync user from Clerk to database
app.post('/api/auth/sync', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { updatedAt: new Date() },
      create: {
        clerkId: userId,
        email: req.body.email,
        name: req.body.name,
      },
    });

    return res.json({ user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({ error: 'Failed to sync user' });
  }
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
