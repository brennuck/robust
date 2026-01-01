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
import type { Workout } from '@/types/workout';

function WorkoutCard({ workout, onPress }: { workout: Workout; onPress: () => void }) {
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
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{workout.name}</Text>
        <Text style={styles.cardDate}>{dateLabel}</Text>
      </View>

      <View style={styles.cardStats}>
        {workout.duration && (
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.statText}>{formatDuration(workout.duration)}</Text>
          </View>
        )}
        <View style={styles.stat}>
          <Ionicons name="barbell-outline" size={14} color="#64748B" />
          <Text style={styles.statText}>{workout.exercises.length} exercises</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="layers-outline" size={14} color="#64748B" />
          <Text style={styles.statText}>{stats.completedSets} sets</Text>
        </View>
        {stats.totalVolume > 0 && (
          <View style={styles.stat}>
            <Ionicons name="trending-up-outline" size={14} color="#64748B" />
            <Text style={styles.statText}>
              {stats.totalVolume.toLocaleString()} lbs
            </Text>
          </View>
        )}
      </View>

      {stats.prCount > 0 && (
        <View style={styles.prBadge}>
          <Ionicons name="trophy" size={12} color="#F59E0B" />
          <Text style={styles.prText}>{stats.prCount} PR{stats.prCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      <View style={styles.exerciseList}>
        {workout.exercises.slice(0, 3).map((ex) => (
          <Text key={ex.id} style={styles.exerciseName} numberOfLines={1}>
            {ex.sets.filter(s => s.completed).length}× {ex.exercise.name}
          </Text>
        ))}
        {workout.exercises.length > 3 && (
          <Text style={styles.moreExercises}>
            +{workout.exercises.length - 3} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function History() {
  const router = useRouter();
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
      <Ionicons name="calendar-outline" size={64} color="#475569" />
      <Text style={styles.emptyTitle}>No Workouts Yet</Text>
      <Text style={styles.emptyText}>
        Complete your first workout to see it here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22D3EE" />
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
    backgroundColor: '#0F172A',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748B',
  },
  cardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  prText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  exerciseList: {
    gap: 4,
  },
  exerciseName: {
    fontSize: 13,
    color: '#94A3B8',
  },
  moreExercises: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

