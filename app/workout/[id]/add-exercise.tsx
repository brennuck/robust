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
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';
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
  const { theme } = useTheme();
  const muscleInfo = getMuscleGroupInfo(exercise.muscleGroup);

  return (
    <TouchableOpacity 
      style={[styles.exerciseRow, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} 
      onPress={onSelect}
    >
      <View style={[styles.muscleIndicator, { backgroundColor: muscleInfo.color }]} />
      <View style={styles.exerciseInfo}>
        <Text style={[styles.exerciseName, { color: theme.text }]}>{exercise.name}</Text>
        <Text style={[styles.exerciseMeta, { color: theme.textTertiary }]}>
          {muscleInfo.name} • {exercise.equipment}
        </Text>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
    </TouchableOpacity>
  );
}

export default function AddExercise() {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
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

  const handleSelect = (exercise: Exercise) => {
    // Navigate back immediately for instant feel
    router.back();
    
    // Add exercise in background
    addExercise.mutate({
      workoutId,
      exerciseId: exercise.id,
    }, {
      onError: () => {
        Alert.alert('Error', 'Failed to add exercise');
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Add Exercise',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
        }}
      />

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground }]}>
        <Ionicons name="search" size={20} color={theme.inputPlaceholder} />
        <TextInput
          style={[styles.searchInput, { color: theme.inputText }]}
          placeholder="Search exercises..."
          placeholderTextColor={theme.inputPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
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
              { backgroundColor: theme.backgroundSecondary },
              selectedMuscle === item.id && { backgroundColor: theme.primary },
            ]}
            onPress={() => setSelectedMuscle(item.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: theme.textSecondary },
                selectedMuscle === item.id && { color: theme.textInverse },
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
              <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                No exercises found
              </Text>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
  },
  filterList: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  exerciseList: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  muscleIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: typography.sizes.sm,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
});
