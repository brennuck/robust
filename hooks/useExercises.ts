import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Exercise, ExercisesResponse, PersonalRecord } from '@/types/workout';

// Fetch exercises with optional filters
export function useExercises(filters?: {
  search?: string;
  muscleGroup?: string;
  equipment?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.muscleGroup) params.set('muscleGroup', filters.muscleGroup);
  if (filters?.equipment) params.set('equipment', filters.equipment);

  const queryString = params.toString();
  
  return useQuery({
    queryKey: ['exercises', filters],
    queryFn: () => api.get<ExercisesResponse>(`/exercises${queryString ? `?${queryString}` : ''}`),
  });
}

// Fetch exercise history
export function useExerciseHistory(exerciseId: string | null) {
  return useQuery({
    queryKey: ['exercise-history', exerciseId],
    queryFn: () => api.get<{ history: unknown[] }>(`/exercises/${exerciseId}/history`),
    enabled: !!exerciseId,
  });
}

// Fetch personal records
export function usePersonalRecords(exerciseId: string | null) {
  return useQuery({
    queryKey: ['personal-records', exerciseId],
    queryFn: () => api.get<{ records: PersonalRecord[] }>(`/exercises/${exerciseId}/records`),
    enabled: !!exerciseId,
  });
}

// Create custom exercise
export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      muscleGroup: string;
      equipment: string;
      instructions?: string;
    }) => api.post<{ exercise: Exercise }>('/exercises', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

// Get muscle group info
export function getMuscleGroupInfo(muscleGroup: string) {
  const info: Record<string, { name: string; color: string; icon: string }> = {
    chest: { name: 'Chest', color: '#EF4444', icon: '🫁' },
    back: { name: 'Back', color: '#3B82F6', icon: '🔙' },
    shoulders: { name: 'Shoulders', color: '#8B5CF6', icon: '💪' },
    arms: { name: 'Arms', color: '#F59E0B', icon: '💪' },
    legs: { name: 'Legs', color: '#10B981', icon: '🦵' },
    core: { name: 'Core', color: '#EC4899', icon: '🎯' },
    cardio: { name: 'Cardio', color: '#06B6D4', icon: '❤️' },
  };
  return info[muscleGroup] || { name: muscleGroup, color: '#6B7280', icon: '🏋️' };
}

// Get equipment info
export function getEquipmentInfo(equipment: string) {
  const info: Record<string, { name: string; icon: string }> = {
    barbell: { name: 'Barbell', icon: '🏋️' },
    dumbbell: { name: 'Dumbbell', icon: '🏋️' },
    machine: { name: 'Machine', icon: '⚙️' },
    cable: { name: 'Cable', icon: '🔗' },
    bodyweight: { name: 'Bodyweight', icon: '🤸' },
    other: { name: 'Other', icon: '📦' },
  };
  return info[equipment] || { name: equipment, icon: '🏋️' };
}

