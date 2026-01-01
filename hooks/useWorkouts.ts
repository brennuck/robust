import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Workout,
  WorkoutsResponse,
  WorkoutResponse,
  WorkoutExercise,
  WorkoutSet,
} from '@/types/workout';

// Fetch workout history
export function useWorkouts(page = 1) {
  return useQuery({
    queryKey: ['workouts', page],
    queryFn: () => api.get<WorkoutsResponse>(`/workouts?page=${page}`),
  });
}

// Fetch single workout
export function useWorkout(id: string | null) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => api.get<WorkoutResponse>(`/workouts/${id}`),
    enabled: !!id,
    // Keep showing stale data while revalidating
    staleTime: 0,
    refetchOnMount: true,
  });
}

// Start new workout
export function useStartWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; templateId?: string }) =>
      api.post<WorkoutResponse>('/workouts/start', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Add exercise to workout with optimistic update
export function useAddExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workoutId, exerciseId }: { workoutId: string; exerciseId: string }) =>
      api.post<{ exercise: WorkoutExercise }>(`/workouts/${workoutId}/exercises`, { exerciseId }),
    onSuccess: (_, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });
}

// Update set with optimistic update - THIS IS THE KEY ONE
export function useUpdateSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      setId,
      data,
    }: {
      setId: string;
      workoutId: string;
      data: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'completed' | 'isWarmup' | 'isDropset' | 'isFailure'>>;
    }) => api.patch<{ set: WorkoutSet; isPR: boolean }>(`/workouts/sets/${setId}`, data),
    onMutate: async ({ setId, workoutId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['workout', workoutId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<WorkoutResponse>(['workout', workoutId]);

      // Optimistically update the set
      queryClient.setQueryData<WorkoutResponse>(['workout', workoutId], (old) => {
        if (!old) return old;
        return {
          ...old,
          workout: {
            ...old.workout,
            exercises: old.workout.exercises.map((ex) => ({
              ...ex,
              sets: ex.sets.map((set) =>
                set.id === setId ? { ...set, ...data } : set
              ),
            })),
          },
        };
      });

      return { previousData };
    },
    onError: (_err, { workoutId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['workout', workoutId], context.previousData);
      }
    },
    onSettled: (_, __, { workoutId }) => {
      // Sync with server in background
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });
}

// Add set to exercise with optimistic update
export function useAddSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, workoutId }: { exerciseId: string; workoutId: string }) =>
      api.post<{ set: WorkoutSet }>(`/workouts/exercises/${exerciseId}/sets`),
    onMutate: async ({ exerciseId, workoutId }) => {
      await queryClient.cancelQueries({ queryKey: ['workout', workoutId] });
      const previousData = queryClient.getQueryData<WorkoutResponse>(['workout', workoutId]);

      // Optimistically add the set
      queryClient.setQueryData<WorkoutResponse>(['workout', workoutId], (old) => {
        if (!old) return old;
        return {
          ...old,
          workout: {
            ...old.workout,
            exercises: old.workout.exercises.map((ex) =>
              ex.id === exerciseId
                ? {
                    ...ex,
                    sets: [
                      ...ex.sets,
                      {
                        id: `temp-${Date.now()}`,
                        order: ex.sets.length,
                        weight: undefined,
                        reps: undefined,
                        isWarmup: false,
                        isDropset: false,
                        isFailure: false,
                        isPR: false,
                        completed: false,
                      } as WorkoutSet,
                    ],
                  }
                : ex
            ),
          },
        };
      });

      return { previousData };
    },
    onError: (_err, { workoutId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['workout', workoutId], context.previousData);
      }
    },
    onSettled: (_, __, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });
}

// Delete set with optimistic update
export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ setId, workoutId }: { setId: string; workoutId: string }) =>
      api.delete<{ success: boolean }>(`/workouts/sets/${setId}`),
    onMutate: async ({ setId, workoutId }) => {
      await queryClient.cancelQueries({ queryKey: ['workout', workoutId] });
      const previousData = queryClient.getQueryData<WorkoutResponse>(['workout', workoutId]);

      // Optimistically remove the set
      queryClient.setQueryData<WorkoutResponse>(['workout', workoutId], (old) => {
        if (!old) return old;
        return {
          ...old,
          workout: {
            ...old.workout,
            exercises: old.workout.exercises.map((ex) => ({
              ...ex,
              sets: ex.sets.filter((set) => set.id !== setId),
            })),
          },
        };
      });

      return { previousData };
    },
    onError: (_err, { workoutId }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['workout', workoutId], context.previousData);
      }
    },
    onSettled: (_, __, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });
}

// Complete workout
export function useCompleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutId: string) =>
      api.post<WorkoutResponse>(`/workouts/${workoutId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout'] });
    },
  });
}

// Delete workout
export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workoutId: string) =>
      api.delete<{ success: boolean }>(`/workouts/${workoutId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Calculate workout stats
export function calculateWorkoutStats(workout: Workout) {
  let totalSets = 0;
  let completedSets = 0;
  let totalVolume = 0;
  let prCount = 0;

  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      totalSets++;
      if (set.completed) {
        completedSets++;
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
        if (set.isPR) prCount++;
      }
    }
  }

  return { totalSets, completedSets, totalVolume, prCount };
}

// Format duration
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
