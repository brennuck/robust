import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateTemplate } from '@/hooks/useTemplates';
import { useFolders } from '@/hooks/useFolders';
import { useExercises, getMuscleGroupInfo } from '@/hooks/useExercises';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';
import type { Exercise } from '@/types/workout';
import { DAYS_OF_WEEK } from '@/types/workout';

const COLORS = [
  '#6B8E6B', '#86A789', '#C9A962', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899',
];

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

const EQUIPMENT_TYPES = [
  { id: 'all', name: 'All Equipment' },
  { id: 'barbell', name: 'Barbell' },
  { id: 'dumbbell', name: 'Dumbbell' },
  { id: 'machine', name: 'Machine' },
  { id: 'cable', name: 'Cable' },
  { id: 'bodyweight', name: 'Bodyweight' },
  { id: 'kettlebell', name: 'Kettlebell' },
];

interface TemplateExercise {
  exercise: Exercise;
  targetSets: number;
  targetReps: string;
}

export default function NewTemplate() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const createTemplate = useCreateTemplate();
  const { data: exercisesData } = useExercises();
  const { data: foldersData } = useFolders();

  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>(undefined);
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  const folders = foldersData?.folders || [];

  // Filter exercises based on search, muscle group, and equipment
  const filteredExercises = useMemo(() => {
    let result = exercisesData?.exercises || [];
    
    if (search) {
      result = result.filter(e => 
        e.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (selectedMuscle !== 'all') {
      result = result.filter(e => 
        e.muscleGroup.toLowerCase() === selectedMuscle.toLowerCase()
      );
    }
    
    if (selectedEquipment !== 'all') {
      result = result.filter(e => 
        e.equipment.toLowerCase() === selectedEquipment.toLowerCase()
      );
    }
    
    return result;
  }, [exercisesData?.exercises, search, selectedMuscle, selectedEquipment]);

  // Toggle exercise selection
  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  // Add all selected exercises
  const handleAddSelectedExercises = () => {
    const exercisesToAdd = exercisesData?.exercises.filter(e => 
      selectedExercises.has(e.id)
    ) || [];
    
    const newExercises = exercisesToAdd.map(exercise => ({
      exercise,
      targetSets: 3,
      targetReps: '8-12',
    }));
    
    setExercises([...exercises, ...newExercises]);
    setSelectedExercises(new Set());
    setShowExercisePicker(false);
    setSearch('');
    setSelectedMuscle('all');
    setSelectedEquipment('all');
  };

  const handleCancelPicker = () => {
    setSelectedExercises(new Set());
    setShowExercisePicker(false);
    setSearch('');
    setSelectedMuscle('all');
    setSelectedEquipment('all');
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

    // Navigate back immediately for instant feel
    router.back();
    
    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        color,
        folderId,
        dayOfWeek,
        exercises: exercises.map(e => ({
          exerciseId: e.exercise.id,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
        })),
      });
    } catch {
      Alert.alert('Error', 'Failed to create template. Please try again.');
    }
  };

  if (showExercisePicker) {
    const alreadyAddedIds = new Set(exercises.map(e => e.exercise.id));
    
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Add Exercises',
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
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Muscle Group Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.textTertiary }]}>Body Part</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {MUSCLE_GROUPS.map(group => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.backgroundSecondary },
                  selectedMuscle === group.id && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSelectedMuscle(group.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: theme.textSecondary },
                    selectedMuscle === group.id && { color: theme.textInverse },
                  ]}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Equipment Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.textTertiary }]}>Equipment</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
          >
            {EQUIPMENT_TYPES.map(equip => (
              <TouchableOpacity
                key={equip.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.backgroundSecondary },
                  selectedEquipment === equip.id && { backgroundColor: theme.primary },
                ]}
                onPress={() => setSelectedEquipment(equip.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: theme.textSecondary },
                    selectedEquipment === equip.id && { color: theme.textInverse },
                  ]}
                >
                  {equip.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exercise List */}
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exerciseList}
          renderItem={({ item: exercise }) => {
            const muscleInfo = getMuscleGroupInfo(exercise.muscleGroup);
            const isAlreadyAdded = alreadyAddedIds.has(exercise.id);
            const isSelected = selectedExercises.has(exercise.id);
            
            return (
              <TouchableOpacity
                style={[
                  styles.exerciseRow, 
                  { backgroundColor: theme.card, borderColor: theme.cardBorder },
                  isSelected && { backgroundColor: `${theme.primary}15`, borderColor: theme.primary },
                  isAlreadyAdded && styles.exerciseRowDisabled,
                ]}
                onPress={() => !isAlreadyAdded && toggleExerciseSelection(exercise.id)}
                disabled={isAlreadyAdded}
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
                {isAlreadyAdded ? (
                  <View style={[styles.addedBadge, { backgroundColor: theme.backgroundSecondary }]}>
                    <Text style={[styles.addedBadgeText, { color: theme.textTertiary }]}>Added</Text>
                  </View>
                ) : isSelected ? (
                  <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                ) : (
                  <View style={[styles.emptyCircle, { borderColor: theme.border }]} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                No exercises found
              </Text>
            </View>
          }
        />

        {/* Footer with selection count and actions */}
        <View style={[styles.pickerFooter, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom + spacing.base }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={handleCancelPicker}
          >
            <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.addSelectedButton, 
              { backgroundColor: theme.primary },
              selectedExercises.size === 0 && styles.buttonDisabled,
            ]}
            onPress={handleAddSelectedExercises}
            disabled={selectedExercises.size === 0}
          >
            <Text style={[styles.addSelectedButtonText, { color: theme.textInverse }]}>
              {selectedExercises.size === 0 
                ? 'Select Exercises' 
                : `Add ${selectedExercises.size} Exercise${selectedExercises.size > 1 ? 's' : ''}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Routine',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
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

        {/* Folder */}
        {folders.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textTertiary }]}>Folder (Optional)</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.folderPicker}
            >
              <TouchableOpacity
                style={[
                  styles.folderOption,
                  { backgroundColor: theme.backgroundSecondary },
                  !folderId && { backgroundColor: theme.primary },
                ]}
                onPress={() => setFolderId(undefined)}
              >
                <Text style={[
                  styles.folderOptionText,
                  { color: theme.textSecondary },
                  !folderId && { color: theme.textInverse },
                ]}>
                  None
                </Text>
              </TouchableOpacity>
              {folders.map(folder => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderOption,
                    { backgroundColor: theme.backgroundSecondary },
                    folderId === folder.id && { backgroundColor: folder.color || theme.primary },
                  ]}
                  onPress={() => setFolderId(folder.id)}
                >
                  <Ionicons 
                    name="folder" 
                    size={14} 
                    color={folderId === folder.id ? '#FFF' : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.folderOptionText,
                    { color: theme.textSecondary },
                    folderId === folder.id && { color: '#FFF' },
                  ]}>
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Day of Week */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textTertiary }]}>Day (Optional)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayPicker}
          >
            <TouchableOpacity
              style={[
                styles.dayOption,
                { backgroundColor: theme.backgroundSecondary },
                dayOfWeek === undefined && { backgroundColor: theme.primary },
              ]}
              onPress={() => setDayOfWeek(undefined)}
            >
              <Text style={[
                styles.dayOptionText,
                { color: theme.textSecondary },
                dayOfWeek === undefined && { color: theme.textInverse },
              ]}>
                Any
              </Text>
            </TouchableOpacity>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayOption,
                  { backgroundColor: theme.backgroundSecondary },
                  dayOfWeek === day.value && { backgroundColor: theme.primary },
                ]}
                onPress={() => setDayOfWeek(day.value)}
              >
                <Text style={[
                  styles.dayOptionText,
                  { color: theme.textSecondary },
                  dayOfWeek === day.value && { color: theme.textInverse },
                ]}>
                  {day.short}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

      {/* Footer Actions */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom + spacing.base }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButtonFooter, 
            { backgroundColor: theme.primary },
            createTemplate.isPending && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={createTemplate.isPending}
        >
          <Text style={[styles.saveButtonFooterText, { color: theme.textInverse }]}>
            {createTemplate.isPending ? 'Saving...' : 'Save Routine'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.base,
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
  folderPicker: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  folderOptionText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  dayPicker: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  dayOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 44,
    alignItems: 'center',
  },
  dayOptionText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
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
  filterSection: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  filterList: {
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  exerciseList: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  exerciseRowDisabled: {
    opacity: 0.4,
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
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
  },
  addedBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  addedBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
  pickerFooter: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  addSelectedButton: {
    flex: 2,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  addSelectedButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  saveButtonFooter: {
    flex: 2,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  saveButtonFooterText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
