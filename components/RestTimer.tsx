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

const PRESET_TIMES = [30, 60, 90, 120, 180];

interface RestTimerProps {
  defaultTime?: number;
  onComplete?: () => void;
}

export function RestTimer({ defaultTime = 90, onComplete }: RestTimerProps) {
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
            // Timer complete
            Vibration.vibrate(Platform.OS === 'ios' ? [0, 200, 100, 200, 100, 200] : 500);
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          // Haptic at 3, 2, 1
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

  const progress = (selectedTime - timeRemaining) / selectedTime;

  return (
    <>
      {/* Floating Timer Button */}
      <TouchableOpacity
        style={[
          styles.floatingButton,
          isRunning && styles.floatingButtonActive,
        ]}
        onPress={() => isRunning ? setIsVisible(true) : startTimer()}
      >
        <Ionicons name="timer-outline" size={24} color="#0F172A" />
        {isRunning && (
          <Text style={styles.floatingTime}>{formatTime(timeRemaining)}</Text>
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
          <View style={styles.modalContent}>
            {/* Progress Ring */}
            <View style={styles.timerCircle}>
              <View style={styles.timerCircleInner}>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.timerLabel}>
                  {isRunning ? 'Rest' : 'Ready'}
                </Text>
              </View>
              {/* Progress indicator */}
              <View
                style={[
                  styles.progressArc,
                  { transform: [{ rotate: `${progress * 360}deg` }] },
                ]}
              />
            </View>

            {/* Preset Times */}
            {!isRunning && (
              <View style={styles.presets}>
                {PRESET_TIMES.map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.presetButton,
                      selectedTime === time && styles.presetButtonActive,
                    ]}
                    onPress={() => {
                      setSelectedTime(time);
                      setTimeRemaining(time);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedTime === time && styles.presetTextActive,
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
                    style={styles.controlButton}
                    onPress={() => addTime(-15)}
                  >
                    <Text style={styles.controlButtonText}>-15s</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopTimer}
                  >
                    <Ionicons name="stop" size={32} color="#0F172A" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => addTime(15)}
                  >
                    <Text style={styles.controlButtonText}>+15s</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => startTimer()}
                  >
                    <Ionicons name="play" size={24} color="#0F172A" />
                    <Text style={styles.startButtonText}>Start</Text>
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
                <Text style={styles.skipButtonText}>Skip Rest</Text>
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
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22D3EE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  floatingButtonActive: {
    backgroundColor: '#F59E0B',
  },
  floatingTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    padding: 32,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  timerCircleInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  progressArc: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: '#22D3EE',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  presetButtonActive: {
    backgroundColor: '#22D3EE',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  presetTextActive: {
    color: '#0F172A',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22D3EE',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
});

