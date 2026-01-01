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
import type { Exercise } from '@/types/workout';

const COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4',
];

interface TemplateExercise {
  exercise: Exercise;
  targetSets: number;
  targetReps: string;
}

export default function NewTemplate() {
  const router = useRouter();
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
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Add Exercise',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#F8FAFC',
          }}
        />
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#64748B"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView>
          {filteredExercises.map(exercise => {
            const muscleInfo = getMuscleGroupInfo(exercise.muscleGroup);
            const isAdded = exercises.some(e => e.exercise.id === exercise.id);
            
            return (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.exerciseRow, isAdded && styles.exerciseRowDisabled]}
                onPress={() => !isAdded && handleAddExercise(exercise)}
                disabled={isAdded}
              >
                <View style={[styles.muscleIndicator, { backgroundColor: muscleInfo.color }]} />
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseRowName}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {muscleInfo.name} • {exercise.equipment}
                  </Text>
                </View>
                {isAdded ? (
                  <Ionicons name="checkmark-circle" size={24} color="#22D3EE" />
                ) : (
                  <Ionicons name="add-circle-outline" size={24} color="#22D3EE" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'New Routine',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#F8FAFC',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={createTemplate.isPending}>
              <Text style={styles.saveButton}>
                {createTemplate.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Routine Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Push Day, Leg Day"
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={styles.label}>Color</Text>
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
          <Text style={styles.label}>Exercises</Text>
          
          {exercises.map((item, index) => {
            const muscleInfo = getMuscleGroupInfo(item.exercise.muscleGroup);
            
            return (
              <View key={`${item.exercise.id}-${index}`} style={styles.exerciseCard}>
                <View style={styles.exerciseCardHeader}>
                  <View style={[styles.muscleIndicator, { backgroundColor: muscleInfo.color }]} />
                  <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                  <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.setsControl}>
                  <Text style={styles.setsLabel}>Sets:</Text>
                  <TouchableOpacity
                    style={styles.setsButton}
                    onPress={() => handleUpdateSets(index, Math.max(1, item.targetSets - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#F8FAFC" />
                  </TouchableOpacity>
                  <Text style={styles.setsValue}>{item.targetSets}</Text>
                  <TouchableOpacity
                    style={styles.setsButton}
                    onPress={() => handleUpdateSets(index, Math.min(10, item.targetSets + 1))}
                  >
                    <Ionicons name="add" size={18} color="#F8FAFC" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={styles.addExerciseButton}
            onPress={() => setShowExercisePicker(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#22D3EE" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
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
    borderColor: '#F8FAFC',
  },
  exerciseCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  exerciseName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  setsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setsLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  setsButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    minWidth: 24,
    textAlign: 'center',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22D3EE',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22D3EE',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    margin: 16,
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
  cancelText: {
    fontSize: 14,
    color: '#22D3EE',
    fontWeight: '500',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  exerciseRowDisabled: {
    opacity: 0.5,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseRowName: {
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
});

