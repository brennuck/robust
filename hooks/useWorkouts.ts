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

// Add exercise to workout
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

// Update set
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
    onSuccess: (_, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });
}

// Add set to exercise
export function useAddSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ exerciseId, workoutId }: { exerciseId: string; workoutId: string }) =>
      api.post<{ set: WorkoutSet }>(`/workouts/exercises/${exerciseId}/sets`),
    onSuccess: (_, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', workoutId] });
    },
  });
}

// Delete set
export function useDeleteSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ setId, workoutId }: { setId: string; workoutId: string }) =>
      api.delete<{ success: boolean }>(`/workouts/sets/${setId}`),
    onSuccess: (_, { workoutId }) => {
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

