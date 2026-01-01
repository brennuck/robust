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
import { useFolders, useCreateFolder, useDeleteFolder } from '@/hooks/useFolders';
import { useStartWorkout } from '@/hooks/useWorkouts';
import { storage } from '@/lib/storage';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';
import type { WorkoutTemplate, RoutineFolder } from '@/types/workout';
import { getDayLabel } from '@/types/workout';
import { WorkoutListSkeleton } from '@/components/Skeleton';

function TemplateCard({
  template,
  onPress,
  theme,
}: {
  template: WorkoutTemplate;
  onPress: () => void;
  theme: any;
}) {
  const dayLabel = getDayLabel(template.dayOfWeek);
  
  return (
    <TouchableOpacity
      style={[
        styles.templateCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          borderLeftColor: template.color || theme.primary,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.templateHeader}>
        <Text style={[styles.templateName, { color: theme.text }]}>{template.name}</Text>
        {dayLabel && (
          <View style={[styles.dayBadge, { backgroundColor: `${theme.primary}20` }]}>
            <Text style={[styles.dayBadgeText, { color: theme.primary }]}>{dayLabel}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.templateMeta, { color: theme.textTertiary }]}>
        {template.exercises.length} exercises
      </Text>
      <View style={styles.templateExercises}>
        {template.exercises.slice(0, 2).map((ex) => (
          <Text
            key={ex.id}
            style={[styles.templateExercise, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            • {ex.exercise.name}
          </Text>
        ))}
        {template.exercises.length > 2 && (
          <Text style={[styles.templateMore, { color: theme.textTertiary }]}>
            +{template.exercises.length - 2} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function FolderSection({
  folder,
  onStartTemplate,
  onDeleteFolder,
  theme,
  isExpanded,
  onToggle,
}: {
  folder: RoutineFolder;
  onStartTemplate: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  theme: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const handleLongPress = () => {
    Alert.alert(folder.name, 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Folder',
        style: 'destructive',
        onPress: () => onDeleteFolder(folder.id),
      },
    ]);
  };

  return (
    <View style={styles.folderSection}>
      <TouchableOpacity
        style={[styles.folderHeader, { backgroundColor: theme.backgroundSecondary }]}
        onPress={onToggle}
        onLongPress={handleLongPress}
      >
        <View style={styles.folderHeaderLeft}>
          <View style={[styles.folderIcon, { backgroundColor: folder.color || theme.primary }]}>
            <Ionicons name="folder" size={16} color="#FFF" />
          </View>
          <Text style={[styles.folderName, { color: theme.text }]}>{folder.name}</Text>
          <Text style={[styles.folderCount, { color: theme.textTertiary }]}>
            ({folder.templates.length})
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.textTertiary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.folderContent}>
          {folder.templates.length === 0 ? (
            <Text style={[styles.folderEmpty, { color: theme.textTertiary }]}>
              No routines in this folder
            </Text>
          ) : (
            folder.templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPress={() => onStartTemplate(template.id, template.name)}
                theme={theme}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function WorkoutsHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const { data: foldersData, isLoading, refetch } = useFolders();
  const startWorkout = useStartWorkout();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();

  const [showNewWorkout, setShowNewWorkout] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleStartEmpty = async () => {
    const name = workoutName.trim() || `Workout ${new Date().toLocaleDateString()}`;
    // Close modal immediately for instant feel
    setShowNewWorkout(false);
    setWorkoutName('');
    
    try {
      const result = await startWorkout.mutateAsync({ name });
      await storage.set('activeWorkout', result.workout.id);
      router.push(`/workout/${result.workout.id}`);
    } catch {
      Alert.alert('Error', 'Failed to start workout');
    }
  };

  const handleStartFromTemplate = async (templateId: string, templateName: string) => {
    try {
      const result = await startWorkout.mutateAsync({
        name: templateName,
        templateId,
      });
      await storage.set('activeWorkout', result.workout.id);
      router.push(`/workout/${result.workout.id}`);
    } catch {
      Alert.alert('Error', 'Failed to start workout');
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }
    const name = folderName.trim();
    // Close modal immediately - optimistic update will show folder
    setShowNewFolder(false);
    setFolderName('');
    
    try {
      await createFolder.mutateAsync({ name });
    } catch {
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    try {
      await deleteFolder.mutateAsync(id);
    } catch {
      Alert.alert('Error', 'Failed to delete folder');
    }
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const folders = foldersData?.folders || [];
  const unfolderedTemplates = foldersData?.unfolderedTemplates || [];
  const hasContent = folders.length > 0 || unfolderedTemplates.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Quick Start</Text>
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

        {/* Routines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Routines</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity onPress={() => setShowNewFolder(true)} style={styles.headerAction}>
                <Ionicons name="folder-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/templates/new')}>
                <Text style={[styles.sectionAction, { color: theme.primary }]}>+ New</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLoading ? (
            <WorkoutListSkeleton />
          ) : !hasContent ? (
            <View
              style={[styles.emptyState, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="clipboard-outline" size={28} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Routines Yet</Text>
              <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
                Create a routine to quickly start your favorite workouts
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => router.push('/templates/new')}
              >
                <Text style={[styles.emptyButtonText, { color: theme.text }]}>Create Routine</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.routinesContainer}>
              {/* Folders */}
              {folders.map((folder) => (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  onStartTemplate={handleStartFromTemplate}
                  onDeleteFolder={handleDeleteFolder}
                  theme={theme}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                />
              ))}

              {/* Unfoldered Templates */}
              {unfolderedTemplates.length > 0 && (
                <View style={styles.unfolderedSection}>
                  {folders.length > 0 && (
                    <Text style={[styles.unfolderedLabel, { color: theme.textTertiary }]}>
                      Other Routines
                    </Text>
                  )}
                  {unfolderedTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPress={() => handleStartFromTemplate(template.id, template.name)}
                      theme={theme}
                    />
                  ))}
                </View>
              )}
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
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Workout</Text>
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
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
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

      {/* New Folder Modal */}
      <Modal
        visible={showNewFolder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewFolder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Folder</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="Folder name"
              placeholderTextColor={theme.inputPlaceholder}
              value={folderName}
              onChangeText={setFolderName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowNewFolder(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: theme.primary }]}
                onPress={handleCreateFolder}
                disabled={createFolder.isPending}
              >
                <Text style={[styles.modalConfirmText, { color: theme.textInverse }]}>
                  {createFolder.isPending ? 'Creating...' : 'Create'}
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
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerAction: {
    padding: spacing.xs,
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
  routinesContainer: {
    gap: spacing.md,
  },
  folderSection: {
    marginBottom: spacing.sm,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
  },
  folderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  folderIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  folderCount: {
    fontSize: typography.sizes.sm,
  },
  folderContent: {
    paddingLeft: spacing.base,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  folderEmpty: {
    fontSize: typography.sizes.sm,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    fontStyle: 'italic',
  },
  unfolderedSection: {
    gap: spacing.sm,
  },
  unfolderedLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '500',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  templateCard: {
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  templateName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    flex: 1,
  },
  dayBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  dayBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
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
