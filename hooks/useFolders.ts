import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FoldersResponse, FolderResponse, RoutineFolder } from '@/types/workout';

// Fetch all folders with templates
export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await api.get<FoldersResponse>('/folders');
      return response;
    },
  });
}

// Create a folder with optimistic update
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const response = await api.post<FolderResponse>('/folders', data);
      return response;
    },
    onMutate: async (newFolder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['folders'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<FoldersResponse>(['folders']);

      // Optimistically update
      queryClient.setQueryData<FoldersResponse>(['folders'], (old) => {
        if (!old) return old;
        const optimisticFolder: RoutineFolder = {
          id: `temp-${Date.now()}`,
          name: newFolder.name,
          color: newFolder.color,
          order: old.folders.length,
          templates: [],
        };
        return {
          ...old,
          folders: [...old.folders, optimisticFolder],
        };
      });

      return { previousData };
    },
    onError: (_err, _newFolder, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['folders'], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// Update a folder
export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; color?: string; order?: number }) => {
      const response = await api.patch<FolderResponse>(`/folders/${id}`, data);
      return response;
    },
    onMutate: async ({ id, name, color }) => {
      await queryClient.cancelQueries({ queryKey: ['folders'] });
      const previousData = queryClient.getQueryData<FoldersResponse>(['folders']);

      queryClient.setQueryData<FoldersResponse>(['folders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          folders: old.folders.map((f) =>
            f.id === id ? { ...f, ...(name && { name }), ...(color && { color }) } : f
          ),
        };
      });

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['folders'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// Delete a folder with optimistic update
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/folders/${id}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['folders'] });
      const previousData = queryClient.getQueryData<FoldersResponse>(['folders']);

      queryClient.setQueryData<FoldersResponse>(['folders'], (old) => {
        if (!old) return old;
        const deletedFolder = old.folders.find((f) => f.id === deletedId);
        return {
          ...old,
          folders: old.folders.filter((f) => f.id !== deletedId),
          // Move templates from deleted folder to unfoldered
          unfolderedTemplates: [
            ...old.unfolderedTemplates,
            ...(deletedFolder?.templates || []),
          ],
        };
      });

      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['folders'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// Move a template to a folder
export function useMoveTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, folderId }: { templateId: string; folderId: string | null }) => {
      const response = await api.post(`/folders/${folderId ?? 'none'}/templates`, { templateId });
      return response;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
