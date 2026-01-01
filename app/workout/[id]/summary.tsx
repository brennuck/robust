import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout, formatDuration, calculateWorkoutStats } from '@/hooks/useWorkouts';
import { getMuscleGroupInfo } from '@/hooks/useExercises';
import { useTheme } from '@/providers';
import { typography, spacing, radius, colors } from '@/lib/theme';

export default function WorkoutSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data } = useWorkout(id);

  const workout = data?.workout;

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.loadingText, { color: theme.textTertiary }]}>Loading...</Text>
      </View>
    );
  }

  const stats = calculateWorkoutStats(workout);
  const date = new Date(workout.startedAt);
  const muscleGroups = new Set(workout.exercises.map(e => e.exercise.muscleGroup));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.base }]}>
        <TouchableOpacity onPress={() => router.replace('/(app)')}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Workout Complete</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Celebration */}
        <View style={styles.celebration}>
          <View style={[styles.celebrationIcon, { backgroundColor: `${theme.primary}20` }]}>
            <Text style={styles.celebrationEmoji}>💪</Text>
          </View>
          <Text style={[styles.celebrationTitle, { color: theme.text }]}>Great Work!</Text>
          <Text style={[styles.workoutName, { color: theme.primary }]}>{workout.name}</Text>
          <Text style={[styles.workoutDate, { color: theme.textTertiary }]}>
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="time-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {workout.duration ? formatDuration(workout.duration) : '-'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Duration</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="layers-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.completedSets}</Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Sets</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="fitness-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{workout.exercises.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Exercises</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Ionicons name="trending-up-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.totalVolume > 0 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : '-'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textTertiary }]}>Volume (lbs)</Text>
          </View>
        </View>

        {/* PRs */}
        {stats.prCount > 0 && (
          <View style={[styles.prSection, { backgroundColor: `${colors.gold}15`, borderColor: `${colors.gold}30` }]}>
            <View style={styles.prHeader}>
              <Ionicons name="trophy" size={24} color={colors.gold} />
              <Text style={[styles.prTitle, { color: colors.gold }]}>
                {stats.prCount} Personal Record{stats.prCount > 1 ? 's' : ''}!
              </Text>
            </View>
            {workout.exercises.map(ex => 
              ex.sets.filter(s => s.isPR).map(set => (
                <View key={set.id} style={[styles.prItem, { borderTopColor: `${colors.gold}20` }]}>
                  <Text style={[styles.prExercise, { color: theme.text }]}>{ex.exercise.name}</Text>
                  <Text style={[styles.prValue, { color: colors.gold }]}>
                    {set.weight} lbs × {set.reps} reps
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Muscle Groups */}
        <View style={styles.muscleSection}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Muscles Worked</Text>
          <View style={styles.muscleChips}>
            {Array.from(muscleGroups).map(group => {
              const info = getMuscleGroupInfo(group);
              return (
                <View
                  key={group}
                  style={[styles.muscleChip, { backgroundColor: `${info.color}20` }]}
                >
                  <View style={[styles.muscleDot, { backgroundColor: info.color }]} />
                  <Text style={[styles.muscleChipText, { color: info.color }]}>
                    {info.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Exercise Breakdown */}
        <View style={styles.exerciseSection}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Exercises</Text>
          {workout.exercises.map(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            const bestSet = completedSets.reduce(
              (best, set) => {
                const volume = (set.weight || 0) * (set.reps || 0);
                const bestVolume = (best.weight || 0) * (best.reps || 0);
                return volume > bestVolume ? set : best;
              },
              completedSets[0] || { weight: 0, reps: 0 }
            );

            return (
              <View key={ex.id} style={[styles.exerciseSummary, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <View style={styles.exerciseSummaryHeader}>
                  <Text style={[styles.exerciseSummaryName, { color: theme.text }]}>
                    {ex.exercise.name}
                  </Text>
                  <Text style={[styles.exerciseSummarySets, { color: theme.textTertiary }]}>
                    {completedSets.length} set{completedSets.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {bestSet && bestSet.weight !== undefined && (
                  <Text style={[styles.exerciseBestSet, { color: theme.textSecondary }]}>
                    Best: {bestSet.weight} lbs × {bestSet.reps} reps
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Done Button */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom + spacing.base }]}>
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: theme.primary }]}
          onPress={() => router.replace('/(app)')}
        >
          <Text style={[styles.doneButtonText, { color: theme.textInverse }]}>Done</Text>
        </TouchableOpacity>
      </View>
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
  },
  headerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  celebration: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  celebrationEmoji: {
    fontSize: 40,
  },
  celebrationTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  workoutName: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  workoutDate: {
    fontSize: typography.sizes.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  prSection: {
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  prTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  prExercise: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  prValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  muscleSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: 6,
  },
  muscleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  muscleChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  exerciseSection: {
    marginBottom: spacing.xl,
  },
  exerciseSummary: {
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  exerciseSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSummaryName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  exerciseSummarySets: {
    fontSize: typography.sizes.sm,
  },
  exerciseBestSet: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
  },
  doneButton: {
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});
