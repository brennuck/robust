import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Vibration,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useWorkout,
  useUpdateSet,
  useAddSet,
  useDeleteSet,
  useCompleteWorkout,
  formatDuration,
} from '@/hooks/useWorkouts';
import { storage } from '@/lib/storage';
import { RestTimer } from '@/components/RestTimer';
import { useTheme } from '@/providers';
import { typography, spacing, radius, colors } from '@/lib/theme';
import type { WorkoutExercise, WorkoutSet } from '@/types/workout';

function SetRow({ set, index, workoutId }: { set: WorkoutSet; index: number; workoutId: string }) {
  const { theme } = useTheme();
  const updateSet = useUpdateSet();
  const deleteSet = useDeleteSet();

  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');

  const handleComplete = async () => {
    const weightNum = parseFloat(weight) || 0;
    const repsNum = parseInt(reps) || 0;

    if (repsNum === 0) {
      Alert.alert('Invalid', 'Please enter reps');
      return;
    }

    // Optimistic update handles the UI - no need to wait
    updateSet.mutate(
      {
        setId: set.id,
        workoutId,
        data: {
          weight: weightNum,
          reps: repsNum,
          completed: !set.completed,
        },
      },
      {
        onSuccess: (result) => {
          if (result.isPR) {
            Vibration.vibrate(Platform.OS === 'ios' ? [0, 100, 50, 100] : 200);
            Alert.alert('🏆 New PR!', `${weightNum} lbs × ${repsNum} reps`);
          }
        },
        onError: () => {
          Alert.alert('Error', 'Failed to update set');
        },
      }
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete Set', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // Optimistic update handles the UI immediately
          deleteSet.mutate(
            { setId: set.id, workoutId },
            {
              onError: () => {
                Alert.alert('Error', 'Failed to delete set');
              },
            }
          );
        },
      },
    ]);
  };

  return (
    <View style={[styles.setRow, set.completed && { backgroundColor: `${theme.primary}10` }]}>
      <View style={styles.setNumber}>
        <Text
          style={[
            styles.setNumberText,
            { color: set.isWarmup ? colors.gold : theme.textSecondary },
          ]}>
          {set.isWarmup ? 'W' : index + 1}
        </Text>
      </View>

      <View style={styles.setPrevious}>
        <Text style={[styles.previousText, { color: theme.textTertiary }]}>-</Text>
      </View>

      <TextInput
        style={[
          styles.setInput,
          {
            backgroundColor: set.completed ? 'transparent' : theme.inputBackground,
            color: set.completed ? theme.primary : theme.inputText,
            borderColor: theme.inputBorder,
          },
        ]}
        placeholder="0"
        placeholderTextColor={theme.inputPlaceholder}
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
        editable={!set.completed}
      />

      <TextInput
        style={[
          styles.setInput,
          {
            backgroundColor: set.completed ? 'transparent' : theme.inputBackground,
            color: set.completed ? theme.primary : theme.inputText,
            borderColor: theme.inputBorder,
          },
        ]}
        placeholder="0"
        placeholderTextColor={theme.inputPlaceholder}
        keyboardType="numeric"
        value={reps}
        onChangeText={setReps}
        editable={!set.completed}
      />

      <TouchableOpacity
        style={[
          styles.checkButton,
          { backgroundColor: set.completed ? theme.primary : theme.backgroundSecondary },
        ]}
        onPress={handleComplete}>
        <Ionicons
          name={set.completed ? 'checkmark' : 'checkmark-outline'}
          size={20}
          color={set.completed ? theme.textInverse : theme.textTertiary}
        />
      </TouchableOpacity>

      {set.isPR && (
        <View style={styles.prIndicator}>
          <Ionicons name="trophy" size={14} color={colors.gold} />
        </View>
      )}

      {!set.completed && (
        <TouchableOpacity style={styles.deleteSetButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={theme.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ExerciseCard({ exercise, workoutId }: { exercise: WorkoutExercise; workoutId: string }) {
  const { theme } = useTheme();
  const addSet = useAddSet();

  const handleAddSet = () => {
    // Optimistic update handles the UI immediately
    addSet.mutate(
      { exerciseId: exercise.id, workoutId },
      {
        onError: () => {
          Alert.alert('Error', 'Failed to add set');
        },
      }
    );
  };

  return (
    <View
      style={[styles.exerciseCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseName, { color: theme.primary }]}>
          {exercise.exercise.name}
        </Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.setHeader}>
        <Text style={[styles.setHeaderText, { color: theme.textTertiary }]}>SET</Text>
        <Text style={[styles.setHeaderText, { color: theme.textTertiary }]}>PREV</Text>
        <Text style={[styles.setHeaderText, { color: theme.textTertiary }]}>LBS</Text>
        <Text style={[styles.setHeaderText, { color: theme.textTertiary }]}>REPS</Text>
        <Text style={[styles.setHeaderText, { color: theme.textTertiary }]}>✓</Text>
      </View>

      {exercise.sets.map((set, index) => (
        <SetRow key={set.id} set={set} index={index} workoutId={workoutId} />
      ))}

      <TouchableOpacity
        style={[styles.addSetButton, { borderColor: theme.border }]}
        onPress={handleAddSet}>
        <Ionicons name="add" size={18} color={theme.primary} />
        <Text style={[styles.addSetText, { color: theme.primary }]}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ActiveWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data } = useWorkout(id);
  const completeWorkout = useCompleteWorkout();

  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const workout = data?.workout;

  useEffect(() => {
    if (workout?.startedAt && !workout.completedAt) {
      const start = new Date(workout.startedAt).getTime();

      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [workout?.startedAt, workout?.completedAt]);

  const handleFinish = () => {
    Alert.alert('Finish Workout', 'Are you sure you want to finish?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          try {
            await completeWorkout.mutateAsync(id);
            await storage.remove('activeWorkout');
            router.replace(`/workout/${id}/summary`);
          } catch {
            Alert.alert('Error', 'Failed to complete workout');
          }
        },
      },
    ]);
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'This will delete all progress. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await storage.remove('activeWorkout');
          router.back();
        },
      },
    ]);
  };

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.loadingText, { color: theme.textTertiary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.backgroundSecondary,
            borderBottomColor: theme.border,
            paddingTop: insets.top + spacing.base,
          },
        ]}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="close" size={28} color={theme.error} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.workoutName, { color: theme.text }]}>{workout.name}</Text>
          <Text style={[styles.timer, { color: theme.primary }]}>
            {formatDuration(elapsedTime)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.finishButton, { backgroundColor: theme.primary }]}
          onPress={handleFinish}>
          <Text style={[styles.finishText, { color: theme.textInverse }]}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {workout.exercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} workoutId={id} />
        ))}

        <TouchableOpacity
          style={[
            styles.addExerciseButton,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => router.push(`/workout/${id}/add-exercise`)}>
          <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
          <Text style={[styles.addExerciseText, { color: theme.primary }]}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Rest Timer */}
      <RestTimer defaultTime={90} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
  },
  headerCenter: {
    alignItems: 'center',
  },
  workoutName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  timer: {
    fontSize: typography.sizes.sm,
    fontVariant: ['tabular-nums'],
  },
  finishButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  finishText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  exerciseCard: {
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  exerciseName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  setHeaderText: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  setNumber: {
    width: 32,
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  setPrevious: {
    flex: 1,
    alignItems: 'center',
  },
  previousText: {
    fontSize: typography.sizes.sm,
  },
  setInput: {
    flex: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginHorizontal: 4,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  prIndicator: {
    position: 'absolute',
    right: 48,
    top: 8,
  },
  deleteSetButton: {
    padding: spacing.sm,
    marginLeft: 4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: 6,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  addExerciseText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});
