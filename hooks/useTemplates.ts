import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WorkoutTemplate, TemplatesResponse, TemplateResponse, FoldersResponse } from '@/types/workout';

// Fetch all templates
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<TemplatesResponse>('/templates'),
  });
}

// Fetch single template
export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => api.get<TemplateResponse>(`/templates/${id}`),
    enabled: !!id,
  });
}

// Create template with optimistic update
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      notes?: string;
      color?: string;
      folderId?: string;
      dayOfWeek?: number;
      exercises?: Array<{
        exerciseId: string;
        targetSets?: number;
        targetReps?: string;
        restTime?: number;
        notes?: string;
      }>;
    }) => api.post<TemplateResponse>('/templates', data),
    onMutate: async (newTemplate) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['folders'] });
      await queryClient.cancelQueries({ queryKey: ['templates'] });

      // Snapshot the previous value
      const previousFolders = queryClient.getQueryData<FoldersResponse>(['folders']);
      const previousTemplates = queryClient.getQueryData<TemplatesResponse>(['templates']);

      // Create optimistic template
      const optimisticTemplate: WorkoutTemplate = {
        id: `temp-${Date.now()}`,
        name: newTemplate.name,
        notes: newTemplate.notes,
        color: newTemplate.color,
        folderId: newTemplate.folderId,
        dayOfWeek: newTemplate.dayOfWeek,
        exercises: [],
      };

      // Optimistically update folders data
      queryClient.setQueryData<FoldersResponse>(['folders'], (old) => {
        if (!old) return old;

        if (newTemplate.folderId) {
          // Add to a folder
          return {
            ...old,
            folders: old.folders.map((f) =>
              f.id === newTemplate.folderId
                ? { ...f, templates: [...f.templates, optimisticTemplate] }
                : f
            ),
          };
        } else {
          // Add to unfoldered templates
          return {
            ...old,
            unfolderedTemplates: [...old.unfolderedTemplates, optimisticTemplate],
          };
        }
      });

      // Also update templates list
      queryClient.setQueryData<TemplatesResponse>(['templates'], (old) => {
        if (!old) return { templates: [optimisticTemplate] };
        return { templates: [...old.templates, optimisticTemplate] };
      });

      return { previousFolders, previousTemplates };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders'], context.previousFolders);
      }
      if (context?.previousTemplates) {
        queryClient.setQueryData(['templates'], context.previousTemplates);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// Update template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        notes: string;
        color: string;
        exercises: Array<{
          exerciseId: string;
          targetSets?: number;
          targetReps?: string;
          restTime?: number;
          notes?: string;
        }>;
      }>;
    }) => api.patch<TemplateResponse>(`/templates/${id}`, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

// Delete template with optimistic update
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/templates/${id}`),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['folders'] });
      await queryClient.cancelQueries({ queryKey: ['templates'] });

      const previousFolders = queryClient.getQueryData<FoldersResponse>(['folders']);
      const previousTemplates = queryClient.getQueryData<TemplatesResponse>(['templates']);

      // Optimistically remove template
      queryClient.setQueryData<FoldersResponse>(['folders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          folders: old.folders.map((f) => ({
            ...f,
            templates: f.templates.filter((t) => t.id !== deletedId),
          })),
          unfolderedTemplates: old.unfolderedTemplates.filter((t) => t.id !== deletedId),
        };
      });

      queryClient.setQueryData<TemplatesResponse>(['templates'], (old) => {
        if (!old) return old;
        return { templates: old.templates.filter((t) => t.id !== deletedId) };
      });

      return { previousFolders, previousTemplates };
    },
    onError: (_err, _id, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(['folders'], context.previousFolders);
      }
      if (context?.previousTemplates) {
        queryClient.setQueryData(['templates'], context.previousTemplates);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}
