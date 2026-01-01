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
import type { WorkoutExercise, WorkoutSet } from '@/types/workout';

function SetRow({
  set,
  index,
  workoutId,
  onUpdate,
}: {
  set: WorkoutSet;
  index: number;
  workoutId: string;
  onUpdate: () => void;
}) {
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

    try {
      const result = await updateSet.mutateAsync({
        setId: set.id,
        workoutId,
        data: {
          weight: weightNum,
          reps: repsNum,
          completed: !set.completed,
        },
      });

      if (result.isPR) {
        Vibration.vibrate(Platform.OS === 'ios' ? [0, 100, 50, 100] : 200);
        Alert.alert('🏆 New PR!', `${weightNum} lbs × ${repsNum} reps`);
      }

      onUpdate();
    } catch {
      Alert.alert('Error', 'Failed to update set');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Set', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSet.mutateAsync({ setId: set.id, workoutId });
            onUpdate();
          } catch {
            Alert.alert('Error', 'Failed to delete set');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.setRow, set.completed && styles.setCompleted]}>
      <View style={styles.setNumber}>
        <Text style={[styles.setNumberText, set.isWarmup && styles.warmupText]}>
          {set.isWarmup ? 'W' : index + 1}
        </Text>
      </View>

      <View style={styles.setPrevious}>
        <Text style={styles.previousText}>-</Text>
      </View>

      <TextInput
        style={[styles.setInput, set.completed && styles.inputCompleted]}
        placeholder="0"
        placeholderTextColor="#475569"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
        editable={!set.completed}
      />

      <TextInput
        style={[styles.setInput, set.completed && styles.inputCompleted]}
        placeholder="0"
        placeholderTextColor="#475569"
        keyboardType="numeric"
        value={reps}
        onChangeText={setReps}
        editable={!set.completed}
      />

      <TouchableOpacity
        style={[styles.checkButton, set.completed && styles.checkCompleted]}
        onPress={handleComplete}
      >
        <Ionicons
          name={set.completed ? 'checkmark' : 'checkmark-outline'}
          size={20}
          color={set.completed ? '#0F172A' : '#64748B'}
        />
      </TouchableOpacity>

      {set.isPR && (
        <View style={styles.prIndicator}>
          <Ionicons name="trophy" size={14} color="#F59E0B" />
        </View>
      )}

      {!set.completed && (
        <TouchableOpacity style={styles.deleteSetButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ExerciseCard({
  exercise,
  workoutId,
  onUpdate,
}: {
  exercise: WorkoutExercise;
  workoutId: string;
  onUpdate: () => void;
}) {
  const addSet = useAddSet();

  const handleAddSet = async () => {
    try {
      await addSet.mutateAsync({ exerciseId: exercise.id, workoutId });
      onUpdate();
    } catch {
      Alert.alert('Error', 'Failed to add set');
    }
  };

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.setHeader}>
        <Text style={styles.setHeaderText}>SET</Text>
        <Text style={styles.setHeaderText}>PREV</Text>
        <Text style={styles.setHeaderText}>LBS</Text>
        <Text style={styles.setHeaderText}>REPS</Text>
        <Text style={styles.setHeaderText}>✓</Text>
      </View>

      {exercise.sets.map((set, index) => (
        <SetRow
          key={set.id}
          set={set}
          index={index}
          workoutId={workoutId}
          onUpdate={onUpdate}
        />
      ))}

      <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
        <Ionicons name="add" size={18} color="#22D3EE" />
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ActiveWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, refetch } = useWorkout(id);
  const completeWorkout = useCompleteWorkout();

  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

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
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleDiscard}>
          <Ionicons name="close" size={28} color="#EF4444" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.timer}>{formatDuration(elapsedTime)}</Text>
        </View>

        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            workoutId={id}
            onUpdate={() => refetch()}
          />
        ))}

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => router.push(`/workout/${id}/add-exercise`)}
        >
          <Ionicons name="add-circle" size={24} color="#22D3EE" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
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
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerCenter: {
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  timer: {
    fontSize: 14,
    color: '#22D3EE',
    fontVariant: ['tabular-nums'],
  },
  finishButton: {
    backgroundColor: '#22D3EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  exerciseCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22D3EE',
  },
  setHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  setCompleted: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  setNumber: {
    width: 32,
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  warmupText: {
    color: '#F59E0B',
  },
  setPrevious: {
    flex: 1,
    alignItems: 'center',
  },
  previousText: {
    fontSize: 13,
    color: '#64748B',
  },
  setInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  inputCompleted: {
    backgroundColor: 'transparent',
    color: '#22D3EE',
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  checkCompleted: {
    backgroundColor: '#22D3EE',
  },
  prIndicator: {
    position: 'absolute',
    right: 48,
    top: 8,
  },
  deleteSetButton: {
    padding: 8,
    marginLeft: 4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#22D3EE',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22D3EE',
  },
});

