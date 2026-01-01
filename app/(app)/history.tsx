import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkouts, formatDuration, calculateWorkoutStats } from '@/hooks/useWorkouts';
import { useTheme } from '@/providers';
import { typography, spacing, radius, colors } from '@/lib/theme';
import type { Workout } from '@/types/workout';

function WorkoutCard({ workout, onPress }: { workout: Workout; onPress: () => void }) {
  const { theme } = useTheme();
  const stats = calculateWorkoutStats(workout);
  const date = new Date(workout.startedAt);
  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday = 
    new Date(Date.now() - 86400000).toDateString() === date.toDateString();

  const dateLabel = isToday 
    ? 'Today' 
    : isYesterday 
    ? 'Yesterday' 
    : date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} 
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{workout.name}</Text>
        <Text style={[styles.cardDate, { color: theme.textTertiary }]}>{dateLabel}</Text>
      </View>

      <View style={styles.cardStats}>
        {workout.duration && (
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={theme.textTertiary} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {formatDuration(workout.duration)}
            </Text>
          </View>
        )}
        <View style={styles.stat}>
          <Ionicons name="fitness-outline" size={14} color={theme.textTertiary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {workout.exercises.length} exercises
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="layers-outline" size={14} color={theme.textTertiary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {stats.completedSets} sets
          </Text>
        </View>
      </View>

      {stats.prCount > 0 && (
        <View style={[styles.prBadge, { backgroundColor: `${colors.gold}15` }]}>
          <Ionicons name="trophy" size={12} color={colors.gold} />
          <Text style={[styles.prText, { color: colors.gold }]}>
            {stats.prCount} PR{stats.prCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <View style={styles.exerciseList}>
        {workout.exercises.slice(0, 3).map((ex) => (
          <Text 
            key={ex.id} 
            style={[styles.exerciseName, { color: theme.textSecondary }]} 
            numberOfLines={1}
          >
            {ex.sets.filter(s => s.completed).length}× {ex.exercise.name}
          </Text>
        ))}
        {workout.exercises.length > 3 && (
          <Text style={[styles.moreExercises, { color: theme.textTertiary }]}>
            +{workout.exercises.length - 3} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function History() {
  const router = useRouter();
  const { theme } = useTheme();
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useWorkouts(page);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const completedWorkouts = data?.workouts.filter(w => w.completedAt) || [];

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}15` }]}>
        <Ionicons name="calendar-outline" size={32} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Workouts Yet</Text>
      <Text style={[styles.emptyText, { color: theme.textTertiary }]}>
        Complete your first workout to see it here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={completedWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() => router.push(`/workout/${item.id}/summary`)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.primary} 
          />
        }
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        onEndReached={() => {
          if (data && page < data.totalPages) {
            setPage(p => p + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    flex: 1,
  },
  cardDate: {
    fontSize: typography.sizes.xs,
  },
  cardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: typography.sizes.xs,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  prText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  exerciseList: {
    gap: 2,
  },
  exerciseName: {
    fontSize: typography.sizes.sm,
  },
  moreExercises: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});
