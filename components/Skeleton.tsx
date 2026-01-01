import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/providers';
import { radius } from '@/lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = radius.md,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: theme.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function TemplateCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.templateCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <Skeleton width={140} height={18} />
      <View style={styles.gap} />
      <Skeleton width={100} height={14} />
      <View style={styles.gap} />
      <Skeleton width={80} height={12} />
    </View>
  );
}

export function FolderSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.folder, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <View style={styles.folderHeader}>
        <Skeleton width={120} height={16} />
        <Skeleton width={60} height={14} />
      </View>
    </View>
  );
}

export function WorkoutListSkeleton() {
  return (
    <View style={styles.list}>
      <FolderSkeleton />
      <FolderSkeleton />
      <TemplateCardSkeleton />
      <TemplateCardSkeleton />
      <TemplateCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  templateCard: {
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 12,
    borderWidth: 1,
  },
  folder: {
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 12,
    borderWidth: 1,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gap: {
    height: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});

