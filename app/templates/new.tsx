import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateTemplate } from '@/hooks/useTemplates';
import { useExercises, getMuscleGroupInfo } from '@/hooks/useExercises';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';
import type { Exercise } from '@/types/workout';

const COLORS = [
  '#6B8E6B', '#86A789', '#C9A962', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899',
];

interface TemplateExercise {
  exercise: Exercise;
  targetSets: number;
  targetReps: string;
}

export default function NewTemplate() {
  const router = useRouter();
  const { theme } = useTheme();
  const createTemplate = useCreateTemplate();
  const { data: exercisesData } = useExercises();

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [search, setSearch] = useState('');

  const filteredExercises = exercisesData?.exercises.filter(
    e => e.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleAddExercise = (exercise: Exercise) => {
    setExercises([...exercises, { exercise, targetSets: 3, targetReps: '8-12' }]);
    setShowExercisePicker(false);
    setSearch('');
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateSets = (index: number, sets: number) => {
    setExercises(exercises.map((e, i) => 
      i === index ? { ...e, targetSets: sets } : e
    ));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        color,
        exercises: exercises.map(e => ({
          exerciseId: e.exercise.id,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
        })),
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create template');
    }
  };

  if (showExercisePicker) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Add Exercise',
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
          }}
        />
        
        <View style={[styles.searchContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="search" size={20} color={theme.inputPlaceholder} />
          <TextInput
            style={[styles.searchInput, { color: theme.inputText }]}
            placeholder="Search exercises..."
            placeholderTextColor={theme.inputPlaceholder}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
            <Text style={[styles.cancelText, { color: theme.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView>
          {filteredExercises.map(exercise => {
            const muscleInfo = getMuscleGroupInfo(exercise.muscleGroup);
            const isAdded = exercises.some(e => e.exercise.id === exercise.id);
            
            return (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseRow, 
                  { borderBottomColor: theme.border },
                  isAdded && styles.exerciseRowDisabled,
                ]}
                onPress={() => !isAdded && handleAddExercise(exercise)}
                disabled={isAdded}
              >
                <View style={[styles.muscleIndicator, { backgroundColor: muscleInfo.color }]} />
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseRowName, { color: theme.text }]}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseMeta, { color: theme.textTertiary }]}>
                    {muscleInfo.name} • {exercise.equipment}
                  </Text>
                </View>
                {isAdded ? (
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                ) : (
                  <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'New Routine',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={createTemplate.isPending}>
              <Text style={[styles.saveButton, { color: theme.primary }]}>
                {createTemplate.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textTertiary }]}>Routine Name</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            placeholder="e.g., Push Day, Leg Day"
            placeholderTextColor={theme.inputPlaceholder}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textTertiary }]}>Color</Text>
          <View style={styles.colorPicker}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorSelected,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textTertiary }]}>Exercises</Text>
          
          {exercises.map((item, index) => {
            const muscleInfo = getMuscleGroupInfo(item.exercise.muscleGroup);
            
            return (
              <View 
                key={`${item.exercise.id}-${index}`} 
                style={[styles.exerciseCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
                <View style={styles.exerciseCardHeader}>
                  <View style={[styles.muscleIndicator, { backgroundColor: muscleInfo.color }]} />
                  <Text style={[styles.exerciseName, { color: theme.text }]}>
                    {item.exercise.name}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                    <Ionicons name="close-circle" size={24} color={theme.error} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.setsControl}>
                  <Text style={[styles.setsLabel, { color: theme.textSecondary }]}>Sets:</Text>
                  <TouchableOpacity
                    style={[styles.setsButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => handleUpdateSets(index, Math.max(1, item.targetSets - 1))}
                  >
                    <Ionicons name="remove" size={18} color={theme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.setsValue, { color: theme.text }]}>{item.targetSets}</Text>
                  <TouchableOpacity
                    style={[styles.setsButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => handleUpdateSets(index, Math.min(10, item.targetSets + 1))}
                  >
                    <Ionicons name="add" size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.addExerciseButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setShowExercisePicker(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
            <Text style={[styles.addExerciseText, { color: theme.primary }]}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    borderWidth: 1,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  exerciseCard: {
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  muscleIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  exerciseName: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  setsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  setsLabel: {
    fontSize: typography.sizes.sm,
  },
  setsButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setsValue: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addExerciseText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
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
  cancelText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
  },
  exerciseRowDisabled: {
    opacity: 0.5,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseRowName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: typography.sizes.sm,
    textTransform: 'capitalize',
  },
});
