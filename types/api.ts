// API Response Types

export interface User {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PushToken {
  id: string;
  token: string;
  platform: 'ios' | 'android';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface UserWithTokens extends User {
  pushTokens: PushToken[];
}

// API Responses
export interface UserResponse {
  user: User;
}

export interface UserWithTokensResponse {
  user: UserWithTokens;
}

export interface PushTokenResponse {
  pushToken: PushToken;
}

export interface SuccessResponse {
  success: boolean;
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}

// Request Bodies
export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'ios' | 'android';
}

export interface SyncUserRequest {
  email?: string;
  name?: string;
}

