import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WorkoutTemplate, TemplatesResponse, TemplateResponse } from '@/types/workout';

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

// Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      notes?: string;
      color?: string;
      exercises?: Array<{
        exerciseId: string;
        targetSets?: number;
        targetReps?: string;
        restTime?: number;
        notes?: string;
      }>;
    }) => api.post<TemplateResponse>('/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: boolean }>(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

