import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout, formatDuration, calculateWorkoutStats } from '@/hooks/useWorkouts';
import { getMuscleGroupInfo } from '@/hooks/useExercises';

export default function WorkoutSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useWorkout(id);

  const workout = data?.workout;

  if (!workout) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const stats = calculateWorkoutStats(workout);
  const date = new Date(workout.startedAt);

  // Calculate muscle groups hit
  const muscleGroups = new Set(workout.exercises.map(e => e.exercise.muscleGroup));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(app)')}>
          <Ionicons name="close" size={28} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Complete</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Celebration */}
        <View style={styles.celebration}>
          <Text style={styles.celebrationEmoji}>💪</Text>
          <Text style={styles.celebrationTitle}>Great Work!</Text>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.workoutDate}>
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color="#22D3EE" />
            <Text style={styles.statValue}>
              {workout.duration ? formatDuration(workout.duration) : '-'}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={24} color="#22D3EE" />
            <Text style={styles.statValue}>{stats.completedSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="barbell-outline" size={24} color="#22D3EE" />
            <Text style={styles.statValue}>{workout.exercises.length}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={24} color="#22D3EE" />
            <Text style={styles.statValue}>
              {stats.totalVolume > 0 ? `${(stats.totalVolume / 1000).toFixed(1)}k` : '-'}
            </Text>
            <Text style={styles.statLabel}>Volume (lbs)</Text>
          </View>
        </View>

        {/* PRs */}
        {stats.prCount > 0 && (
          <View style={styles.prSection}>
            <View style={styles.prHeader}>
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <Text style={styles.prTitle}>
                {stats.prCount} Personal Record{stats.prCount > 1 ? 's' : ''}!
              </Text>
            </View>
            {workout.exercises.map(ex => 
              ex.sets.filter(s => s.isPR).map(set => (
                <View key={set.id} style={styles.prItem}>
                  <Text style={styles.prExercise}>{ex.exercise.name}</Text>
                  <Text style={styles.prValue}>
                    {set.weight} lbs × {set.reps} reps
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Muscle Groups */}
        <View style={styles.muscleSection}>
          <Text style={styles.sectionTitle}>Muscles Worked</Text>
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
          <Text style={styles.sectionTitle}>Exercises</Text>
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
              <View key={ex.id} style={styles.exerciseSummary}>
                <View style={styles.exerciseSummaryHeader}>
                  <Text style={styles.exerciseSummaryName}>{ex.exercise.name}</Text>
                  <Text style={styles.exerciseSummarySets}>
                    {completedSets.length} set{completedSets.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                {bestSet && bestSet.weight !== undefined && (
                  <Text style={styles.exerciseBestSet}>
                    Best: {bestSet.weight} lbs × {bestSet.reps} reps
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Done Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.replace('/(app)')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
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
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  celebration: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22D3EE',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  prSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  prTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F59E0B',
  },
  prItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
  },
  prExercise: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  prValue: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  muscleSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  muscleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  muscleChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  exerciseSection: {
    marginBottom: 24,
  },
  exerciseSummary: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  exerciseSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseSummaryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  exerciseSummarySets: {
    fontSize: 13,
    color: '#64748B',
  },
  exerciseBestSet: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  doneButton: {
    backgroundColor: '#22D3EE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
});

