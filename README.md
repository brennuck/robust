# 🚀 Robust - React Native Starter

A production-ready React Native starter template with a full-stack setup. Clone, configure, and start building immediately.

## ✨ Features

### Frontend (React Native + Expo)
- **[Expo Router](https://expo.github.io/router/)** - File-based routing with TypeScript support
- **[Clerk](https://clerk.com/)** - Complete authentication (sign up, sign in, session management)
- **[TanStack Query](https://tanstack.com/query)** - Powerful data fetching, caching, and synchronization
- **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)** - Persistent local storage
- **[Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)** - Push notification support
- **[Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)** - Secure token storage

### Backend (Express + Prisma)
- **[Express](https://expressjs.com/)** - Fast, minimal Node.js web framework
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM with migrations
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database
- **[Neon](https://neon.tech/)** - Serverless PostgreSQL (recommended for deployment)
- **[Clerk Express](https://clerk.com/docs/references/express/overview)** - Backend authentication middleware
- **[Zod](https://zod.dev/)** - Runtime schema validation

## 📁 Project Structure

```
robust/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth screens (sign-in, sign-up)
│   ├── (app)/                    # Protected app screens
│   └── _layout.tsx               # Root layout with providers
├── backend/                      # Express API server
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── seed.ts               # Seed script
│   └── src/
│       ├── index.ts              # Server entry point
│       ├── lib/prisma.ts         # Prisma client
│       └── routes/               # API routes
├── components/                   # Reusable UI components
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Auth utilities
│   ├── constants.ts              # App constants
│   ├── push-notifications.ts     # Push notification helpers
│   ├── query-client.ts           # TanStack Query config
│   └── storage.ts                # AsyncStorage wrapper
└── providers/                    # React context providers
```

## 🛠️ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Clerk Account](https://clerk.com/) (free tier available)
- [Neon Account](https://neon.tech/) (free tier available)

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/robust.git
cd robust

# Install frontend dependencies
npm install

# Install backend dependencies
npm run backend:install
```

### 2. Set Up Clerk

1. Create a [Clerk application](https://dashboard.clerk.com/)
2. Get your **Publishable Key** and **Secret Key** from the Clerk dashboard
3. Enable **Email/Password** authentication in Clerk settings

### 3. Set Up Neon Database

1. Create a [Neon project](https://console.neon.tech/)
2. Copy your **Connection String** from the Neon dashboard
3. The connection string looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### 4. Configure Environment Variables

**Frontend** - Create `.env` in the root:

```bash
# Copy from example
cp .env.example .env

# Edit with your values
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

**Backend** - Create `.env` in the backend folder:

```bash
# Copy from example
cp backend/.env.example backend/.env

# Edit with your values
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
CLERK_SECRET_KEY="sk_test_xxxxx"
CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:8081"
```

### 5. Initialize Database

```bash
# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 6. Start Development Servers

```bash
# Terminal 1: Start backend
npm run backend

# Terminal 2: Start Expo
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan QR code with Expo Go.

## 📱 Using the App

### Authentication Flow

The app includes a complete auth flow:

1. **Sign Up** - Create account with email verification
2. **Sign In** - Email + password login
3. **Session Persistence** - Stay logged in with secure token storage
4. **Auto Redirect** - Unauthenticated users redirect to sign-in

### Push Notifications

Push notifications are automatically registered when users sign in:

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function MyComponent() {
  const { expoPushToken, isRegistered } = usePushNotifications();
  // Token is automatically synced with backend
}
```

To send a test notification:

```typescript
import { scheduleLocalNotification } from '@/lib/push-notifications';

await scheduleLocalNotification('Hello!', 'This is a test', 1);
```

### Data Fetching with TanStack Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['posts'],
  queryFn: () => api.get('/posts'),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (newPost) => api.post('/posts', newPost),
});
```

### Local Storage

```typescript
import { storage } from '@/lib/storage';

// Save data
await storage.set('user-preferences', { theme: 'dark' });

// Read data
const prefs = await storage.get('user-preferences');

// Remove data
await storage.remove('user-preferences');
```

## 🗄️ Database

### Prisma Schema

The starter includes a basic schema with User and PushToken models:

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String?  @unique
  name      String?
  pushTokens PushToken[]
}

model PushToken {
  id       String @id @default(cuid())
  token    String
  platform String
  user     User   @relation(fields: [userId], references: [id])
  userId   String
}
```

### Adding New Models

1. Edit `backend/prisma/schema.prisma`
2. Run `npm run db:push` (or `db:migrate` for production)
3. The Prisma client auto-updates

### Useful Commands

```bash
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create migration (production)
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Run seed script
```

## 🚀 Deployment

### Backend (Recommended: Railway, Render, Fly.io)

1. Set environment variables in your hosting platform
2. Build command: `npm run build`
3. Start command: `npm start`

### Mobile App (EAS Build)

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure: `eas build:configure`
3. Build: `eas build --platform all`
4. Submit: `eas submit`

### Environment Variables for Production

**Backend:**
```
DATABASE_URL=your-neon-production-url
CLERK_SECRET_KEY=sk_live_xxxxx
NODE_ENV=production
FRONTEND_URL=https://your-app-url
```

**Mobile (via app.json or EAS):**
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
EXPO_PUBLIC_API_URL=https://your-api-url/api
```

## 🔒 Security Considerations

- ✅ Tokens stored in Secure Store (not AsyncStorage)
- ✅ All API routes protected with Clerk middleware
- ✅ CORS configured for your frontend URL
- ✅ Input validation with Zod
- ✅ SQL injection protection via Prisma

## 📖 API Reference

### Authentication

All protected routes require a valid Clerk session token in the `Authorization` header.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/public` | Public endpoint |
| POST | `/api/auth/sync` | Sync user to database |
| GET | `/api/user/me` | Get current user |
| PATCH | `/api/user/me` | Update user profile |
| DELETE | `/api/user/me` | Delete account |
| POST | `/api/push/register` | Register push token |
| DELETE | `/api/push/unregister` | Unregister push token |

## 🧩 Customization

### Adding New Screens

Create a new file in `app/(app)/` for protected screens or `app/(auth)/` for auth screens:

```typescript
// app/(app)/settings.tsx
import { View, Text } from 'react-native';
import { Stack } from 'expo-router';

export default function Settings() {
  return (
    <View>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Text>Settings Screen</Text>
    </View>
  );
}
```

### Adding New API Routes

Create a new file in `backend/src/routes/`:

```typescript
// backend/src/routes/posts.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const postsRouter = Router();

postsRouter.get('/', async (req, res) => {
  const posts = await prisma.post.findMany();
  res.json({ posts });
});
```

Register in `backend/src/index.ts`:

```typescript
import { postsRouter } from './routes/posts.js';
app.use('/api/posts', requireAuth(), postsRouter);
```

### Theming

Update colors in the StyleSheet of each component. The starter uses a dark theme with these core colors:

- Background: `#0F172A` (Slate 900)
- Card: `#1E293B` (Slate 800)
- Border: `#334155` (Slate 700)
- Text: `#F8FAFC` (Slate 50)
- Accent: `#22D3EE` (Cyan 400)

## 🐛 Troubleshooting

### "Missing CLERK_PUBLISHABLE_KEY"

Make sure `.env` file exists with your Clerk key:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Database Connection Issues

- Verify `DATABASE_URL` is correct in `backend/.env`
- Ensure `?sslmode=require` is included for Neon
- Run `npm run db:push` to sync schema

### Push Notifications Not Working

- Push notifications only work on physical devices
- Ensure EAS project ID is set in `app.json`
- Check notification permissions in device settings

### Metro Bundler Issues

```bash
# Clear cache
npx expo start --clear
```

## 📄 License

MIT © Your Name

---

**Happy coding! 🎉**

Built with ❤️ using Expo, Express, Prisma, and Clerk.

