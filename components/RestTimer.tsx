import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { typography, spacing, radius } from '@/lib/theme';

const PRESET_TIMES = [30, 60, 90, 120, 180];

interface RestTimerProps {
  defaultTime?: number;
  onComplete?: () => void;
}

export function RestTimer({ defaultTime = 90, onComplete }: RestTimerProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(defaultTime);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startTimer = useCallback((time?: number) => {
    const startTime = time ?? selectedTime;
    setTimeRemaining(startTime);
    setSelectedTime(startTime);
    setIsRunning(true);
    setIsVisible(true);
  }, [selectedTime]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimeRemaining(selectedTime);
  }, [stopTimer, selectedTime]);

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining(prev => Math.max(0, prev + seconds));
  }, []);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            Vibration.vibrate(Platform.OS === 'ios' ? [0, 200, 100, 200, 100, 200] : 500);
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          if (prev <= 4) {
            Vibration.vibrate(Platform.OS === 'ios' ? 50 : 30);
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, timeRemaining, onComplete]);

  return (
    <>
      {/* Floating Timer Button */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          { backgroundColor: isRunning ? theme.accent : theme.primary },
        ]}
        onPress={() => isRunning ? setIsVisible(true) : startTimer()}
      >
        <Ionicons name="timer-outline" size={24} color={theme.textInverse} />
        {isRunning && (
          <Text style={[styles.floatingTime, { color: theme.textInverse }]}>
            {formatTime(timeRemaining)}
          </Text>
        )}
      </TouchableOpacity>

      {/* Timer Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Progress Ring */}
            <View style={[styles.timerCircle, { borderColor: theme.border }]}>
              <View style={styles.timerCircleInner}>
                <Text style={[styles.timerText, { color: theme.text }]}>
                  {formatTime(timeRemaining)}
                </Text>
                <Text style={[styles.timerLabel, { color: theme.textTertiary }]}>
                  {isRunning ? 'Rest' : 'Ready'}
                </Text>
              </View>
            </View>

            {/* Preset Times */}
            {!isRunning && (
              <View style={styles.presets}>
                {PRESET_TIMES.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.presetButton,
                      { backgroundColor: theme.backgroundSecondary },
                      selectedTime === time && { backgroundColor: theme.primary },
                    ]}
                    onPress={() => {
                      setSelectedTime(time);
                      setTimeRemaining(time);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        { color: theme.textSecondary },
                        selectedTime === time && { color: theme.textInverse },
                      ]}
                    >
                      {formatTime(time)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
              {isRunning ? (
                <>
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => addTime(-15)}
                  >
                    <Text style={[styles.controlButtonText, { color: theme.text }]}>-15s</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.stopButton, { backgroundColor: theme.error }]}
                    onPress={stopTimer}
                  >
                    <Ionicons name="stop" size={32} color={theme.textInverse} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.controlButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => addTime(15)}
                  >
                    <Text style={[styles.controlButtonText, { color: theme.text }]}>+15s</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => setIsVisible(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: theme.primary }]}
                    onPress={() => startTimer()}
                  >
                    <Ionicons name="play" size={24} color={theme.textInverse} />
                    <Text style={[styles.startButtonText, { color: theme.textInverse }]}>
                      Start
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Skip */}
            {isRunning && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  stopTimer();
                  setIsVisible(false);
                  onComplete?.();
                }}
              >
                <Text style={[styles.skipButtonText, { color: theme.textTertiary }]}>
                  Skip Rest
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    gap: spacing.sm,
  },
  floatingTime: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    padding: spacing['2xl'],
    borderRadius: radius.xl,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  timerCircleInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: typography.sizes.base,
    marginTop: spacing.xs,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  presetButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  presetText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  controlButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  controlButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  cancelButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  startButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    fontSize: typography.sizes.sm,
  },
});
