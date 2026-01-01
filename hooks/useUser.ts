import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface User {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserResponse {
  user: User;
}

// Fetch current user
export function useUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get<UserResponse>('/user/me'),
  });
}

// Update user profile
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) =>
      api.patch<UserResponse>('/user/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

// Delete user account
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.delete<{ success: boolean }>('/user/me'),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// Sync user with backend after Clerk auth
export function useSyncUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email?: string; name?: string }) =>
      api.post<UserResponse>('/auth/sync', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}

