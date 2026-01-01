import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTemplates } from '@/hooks/useTemplates';
import { useStartWorkout } from '@/hooks/useWorkouts';
import { storage } from '@/lib/storage';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';

export default function WorkoutsHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: templatesData, isLoading, refetch } = useTemplates();
  const startWorkout = useStartWorkout();

  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleStartEmpty = async () => {
    const name = workoutName.trim() || `Workout ${new Date().toLocaleDateString()}`;
    try {
      const result = await startWorkout.mutateAsync({ name });
      await storage.set('activeWorkout', result.workout.id);
      setShowNewWorkout(false);
      setWorkoutName('');
      router.push(`/workout/${result.workout.id}`);
    } catch {
      Alert.alert('Error', 'Failed to start workout');
    }
  };

  const handleStartFromTemplate = async (templateId: string, templateName: string) => {
    try {
      const result = await startWorkout.mutateAsync({ 
        name: templateName, 
        templateId 
      });
      await storage.set('activeWorkout', result.workout.id);
      router.push(`/workout/${result.workout.id}`);
    } catch {
      Alert.alert('Error', 'Failed to start workout');
    }
  };

  const templates = templatesData?.templates || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.primary} 
          />
        }
      >
        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
            Quick Start
          </Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowNewWorkout(true)}
          >
            <Ionicons name="add" size={22} color={theme.textInverse} />
            <Text style={[styles.startButtonText, { color: theme.textInverse }]}>
              Start Empty Workout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
              Routines
            </Text>
            <TouchableOpacity onPress={() => router.push('/templates/new')}>
              <Text style={[styles.sectionAction, { color: theme.primary }]}>
                + New
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                Loading...
              </Text>
            </View>
          ) : templates.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="clipboard-outline" size={28} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No Routines Yet
              </Text>
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                Create a routine to quickly start your favorite workouts
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => router.push('/templates/new')}
              >
                <Text style={[styles.emptyButtonText, { color: theme.text }]}>
                  Create Routine
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.templateGrid}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    { 
                      backgroundColor: theme.card,
                      borderColor: theme.cardBorder,
                      borderLeftColor: template.color || theme.primary,
                    },
                  ]}
                  onPress={() => handleStartFromTemplate(template.id, template.name)}
                >
                  <Text style={[styles.templateName, { color: theme.text }]}>
                    {template.name}
                  </Text>
                  <Text style={[styles.templateMeta, { color: theme.textTertiary }]}>
                    {template.exercises.length} exercises
                  </Text>
                  <View style={styles.templateExercises}>
                    {template.exercises.slice(0, 3).map((ex) => (
                      <Text 
                        key={ex.id} 
                        style={[styles.templateExercise, { color: theme.textSecondary }]} 
                        numberOfLines={1}
                      >
                        • {ex.exercise.name}
                      </Text>
                    ))}
                    {template.exercises.length > 3 && (
                      <Text style={[styles.templateMore, { color: theme.textTertiary }]}>
                        +{template.exercises.length - 3} more
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* New Workout Modal */}
      <Modal
        visible={showNewWorkout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewWorkout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              New Workout
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { 
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="Workout name (optional)"
              placeholderTextColor={theme.inputPlaceholder}
              value={workoutName}
              onChangeText={setWorkoutName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowNewWorkout(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: theme.primary }]}
                onPress={handleStartEmpty}
                disabled={startWorkout.isPending}
              >
                <Text style={[styles.modalConfirmText, { color: theme.textInverse }]}>
                  {startWorkout.isPending ? 'Starting...' : 'Start'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  sectionAction: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  startButton: {
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  templateGrid: {
    gap: spacing.md,
  },
  templateCard: {
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  templateName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  templateMeta: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.sm,
  },
  templateExercises: {
    gap: 2,
  },
  templateExercise: {
    fontSize: typography.sizes.sm,
  },
  templateMore: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  emptyState: {
    borderRadius: radius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  emptyButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancel: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});
