import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExercises, getMuscleGroupInfo } from '@/hooks/useExercises';
import { useAddExercise } from '@/hooks/useWorkouts';
import type { Exercise } from '@/types/workout';

const MUSCLE_GROUPS = [
  { id: 'all', name: 'All' },
  { id: 'chest', name: 'Chest' },
  { id: 'back', name: 'Back' },
  { id: 'shoulders', name: 'Shoulders' },
  { id: 'arms', name: 'Arms' },
  { id: 'legs', name: 'Legs' },
  { id: 'core', name: 'Core' },
  { id: 'cardio', name: 'Cardio' },
];

function ExerciseRow({
  exercise,
  onSelect,
}: {
  exercise: Exercise;
  onSelect: () => void;
}) {
  const muscleInfo = getMuscleGroupInfo(exercise.muscleGroup);

  return (
    <TouchableOpacity style={styles.exerciseRow} onPress={onSelect}>
      <View style={[styles.muscleIndicator, { backgroundColor: muscleInfo.color }]} />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {muscleInfo.name} • {exercise.equipment}
        </Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color="#22D3EE" />
    </TouchableOpacity>
  );
}

export default function AddExercise() {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addExercise = useAddExercise();

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  const { data, isLoading } = useExercises({
    search: search.length > 0 ? search : undefined,
    muscleGroup: selectedMuscle !== 'all' ? selectedMuscle : undefined,
  });

  const exercises = useMemo(() => {
    return data?.exercises || [];
  }, [data]);

  const handleSelect = async (exercise: Exercise) => {
    try {
      await addExercise.mutateAsync({
        workoutId,
        exerciseId: exercise.id,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to add exercise');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Add Exercise',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#F8FAFC',
        }}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Muscle Group Filter */}
      <FlatList
        horizontal
        data={MUSCLE_GROUPS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedMuscle === item.id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedMuscle(item.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedMuscle === item.id && styles.filterChipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Exercise List */}
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseRow exercise={item} onSelect={() => handleSelect(item)} />
        )}
        contentContainerStyle={styles.exerciseList}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F8FAFC',
  },
  filterList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#22D3EE',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  filterChipTextActive: {
    color: '#0F172A',
  },
  exerciseList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  muscleIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 13,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
});

