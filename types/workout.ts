// Exercise
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions?: string;
  imageUrl?: string;
  isCustom: boolean;
}

// Set within a workout
export interface WorkoutSet {
  id: string;
  order: number;
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  isWarmup: boolean;
  isDropset: boolean;
  isFailure: boolean;
  isPR: boolean;
  completed: boolean;
}

// Exercise within a workout
export interface WorkoutExercise {
  id: string;
  order: number;
  notes?: string;
  restTime?: number;
  exercise: Exercise;
  sets: WorkoutSet[];
}

// Completed workout
export interface Workout {
  id: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  notes?: string;
  exercises: WorkoutExercise[];
}

// Template exercise
export interface TemplateExercise {
  id: string;
  order: number;
  targetSets: number;
  targetReps: string;
  restTime?: number;
  notes?: string;
  exercise: Exercise;
}

// Workout template
export interface WorkoutTemplate {
  id: string;
  name: string;
  notes?: string;
  color?: string;
  folderId?: string;
  dayOfWeek?: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  exercises: TemplateExercise[];
}

// Day of week helpers
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

export function getDayLabel(dayOfWeek?: number): string | null {
  if (dayOfWeek === undefined || dayOfWeek === null) return null;
  return DAYS_OF_WEEK[dayOfWeek]?.short || null;
}

// Routine folder
export interface RoutineFolder {
  id: string;
  name: string;
  color?: string;
  order: number;
  templates: WorkoutTemplate[];
}

// Personal record
export interface PersonalRecord {
  id: string;
  weight: number;
  reps: number;
  estimated1RM?: number;
  achievedAt: string;
}

// API Responses
export interface WorkoutsResponse {
  workouts: Workout[];
  total: number;
  page: number;
  totalPages: number;
}

export interface WorkoutResponse {
  workout: Workout;
}

export interface ExercisesResponse {
  exercises: Exercise[];
}

export interface TemplatesResponse {
  templates: WorkoutTemplate[];
}

export interface FoldersResponse {
  folders: RoutineFolder[];
  unfolderedTemplates: WorkoutTemplate[];
}

export interface FolderResponse {
  folder: RoutineFolder;
}

export interface TemplateResponse {
  template: WorkoutTemplate;
}

