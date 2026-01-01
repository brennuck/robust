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

export default function WorkoutsHome() {
  const router = useRouter();
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
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22D3EE" />
        }
      >
        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK START</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setShowNewWorkout(true)}
          >
            <Ionicons name="add-circle" size={24} color="#0F172A" />
            <Text style={styles.startButtonText}>Start Empty Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ROUTINES</Text>
            <TouchableOpacity onPress={() => router.push('/templates/new')}>
              <Text style={styles.sectionAction}>+ New</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : templates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>No Routines Yet</Text>
              <Text style={styles.emptyText}>
                Create a routine to quickly start your favorite workouts
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/templates/new')}
              >
                <Text style={styles.emptyButtonText}>Create Routine</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.templateGrid}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    template.color ? { borderLeftColor: template.color } : {},
                  ]}
                  onPress={() => handleStartFromTemplate(template.id, template.name)}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateMeta}>
                    {template.exercises.length} exercises
                  </Text>
                  <View style={styles.templateExercises}>
                    {template.exercises.slice(0, 3).map((ex) => (
                      <Text key={ex.id} style={styles.templateExercise} numberOfLines={1}>
                        • {ex.exercise.name}
                      </Text>
                    ))}
                    {template.exercises.length > 3 && (
                      <Text style={styles.templateMore}>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Workout</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Workout name (optional)"
              placeholderTextColor="#64748B"
              value={workoutName}
              onChangeText={setWorkoutName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowNewWorkout(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={handleStartEmpty}
                disabled={startWorkout.isPending}
              >
                <Text style={styles.modalConfirmText}>
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
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22D3EE',
  },
  startButton: {
    backgroundColor: '#22D3EE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  templateGrid: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22D3EE',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  templateExercises: {
    gap: 2,
  },
  templateExercise: {
    fontSize: 13,
    color: '#94A3B8',
  },
  templateMore: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#22D3EE',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
});
