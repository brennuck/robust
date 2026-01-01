import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  // Chest
  { name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Incline Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Decline Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
  { name: 'Dumbbell Bench Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Dumbbell Fly', muscleGroup: 'chest', equipment: 'dumbbell' },
  { name: 'Cable Fly', muscleGroup: 'chest', equipment: 'cable' },
  { name: 'Push Up', muscleGroup: 'chest', equipment: 'bodyweight' },
  { name: 'Chest Dip', muscleGroup: 'chest', equipment: 'bodyweight' },
  { name: 'Machine Chest Press', muscleGroup: 'chest', equipment: 'machine' },
  { name: 'Pec Deck', muscleGroup: 'chest', equipment: 'machine' },

  // Back
  { name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Pendlay Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'T-Bar Row', muscleGroup: 'back', equipment: 'barbell' },
  { name: 'Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell' },
  { name: 'Pull Up', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Chin Up', muscleGroup: 'back', equipment: 'bodyweight' },
  { name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Face Pull', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Straight Arm Pulldown', muscleGroup: 'back', equipment: 'cable' },
  { name: 'Machine Row', muscleGroup: 'back', equipment: 'machine' },

  // Shoulders
  { name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Push Press', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Arnold Press', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Front Raise', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Rear Delt Fly', muscleGroup: 'shoulders', equipment: 'dumbbell' },
  { name: 'Cable Lateral Raise', muscleGroup: 'shoulders', equipment: 'cable' },
  { name: 'Machine Shoulder Press', muscleGroup: 'shoulders', equipment: 'machine' },
  { name: 'Reverse Pec Deck', muscleGroup: 'shoulders', equipment: 'machine' },
  { name: 'Upright Row', muscleGroup: 'shoulders', equipment: 'barbell' },
  { name: 'Shrugs', muscleGroup: 'shoulders', equipment: 'barbell' },

  // Arms - Biceps
  { name: 'Barbell Curl', muscleGroup: 'arms', equipment: 'barbell' },
  { name: 'EZ Bar Curl', muscleGroup: 'arms', equipment: 'barbell' },
  { name: 'Dumbbell Curl', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Hammer Curl', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Incline Dumbbell Curl', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Concentration Curl', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Preacher Curl', muscleGroup: 'arms', equipment: 'barbell' },
  { name: 'Cable Curl', muscleGroup: 'arms', equipment: 'cable' },

  // Arms - Triceps
  { name: 'Close Grip Bench Press', muscleGroup: 'arms', equipment: 'barbell' },
  { name: 'Skull Crushers', muscleGroup: 'arms', equipment: 'barbell' },
  { name: 'Tricep Dip', muscleGroup: 'arms', equipment: 'bodyweight' },
  { name: 'Overhead Tricep Extension', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Tricep Kickback', muscleGroup: 'arms', equipment: 'dumbbell' },
  { name: 'Tricep Pushdown', muscleGroup: 'arms', equipment: 'cable' },
  { name: 'Rope Pushdown', muscleGroup: 'arms', equipment: 'cable' },
  { name: 'Overhead Cable Extension', muscleGroup: 'arms', equipment: 'cable' },

  // Legs - Quads
  { name: 'Squat', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Front Squat', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Hack Squat', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Leg Press', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Leg Extension', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Goblet Squat', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Lunges', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Walking Lunges', muscleGroup: 'legs', equipment: 'dumbbell' },
  { name: 'Step Ups', muscleGroup: 'legs', equipment: 'dumbbell' },

  // Legs - Hamstrings & Glutes
  { name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Stiff Leg Deadlift', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Good Mornings', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Leg Curl', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Seated Leg Curl', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Hip Thrust', muscleGroup: 'legs', equipment: 'barbell' },
  { name: 'Glute Bridge', muscleGroup: 'legs', equipment: 'bodyweight' },
  { name: 'Cable Pull Through', muscleGroup: 'legs', equipment: 'cable' },

  // Legs - Calves
  { name: 'Standing Calf Raise', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Seated Calf Raise', muscleGroup: 'legs', equipment: 'machine' },
  { name: 'Donkey Calf Raise', muscleGroup: 'legs', equipment: 'machine' },

  // Core
  { name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Side Plank', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Crunch', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Sit Up', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Leg Raise', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Hanging Leg Raise', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Ab Wheel Rollout', muscleGroup: 'core', equipment: 'other' },
  { name: 'Cable Crunch', muscleGroup: 'core', equipment: 'cable' },
  { name: 'Wood Chop', muscleGroup: 'core', equipment: 'cable' },
  { name: 'Russian Twist', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Mountain Climbers', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Dead Bug', muscleGroup: 'core', equipment: 'bodyweight' },
  { name: 'Bird Dog', muscleGroup: 'core', equipment: 'bodyweight' },

  // Cardio
  { name: 'Treadmill Running', muscleGroup: 'cardio', equipment: 'machine' },
  { name: 'Treadmill Walking', muscleGroup: 'cardio', equipment: 'machine' },
  { name: 'Stationary Bike', muscleGroup: 'cardio', equipment: 'machine' },
  { name: 'Rowing Machine', muscleGroup: 'cardio', equipment: 'machine' },
  { name: 'Elliptical', muscleGroup: 'cardio', equipment: 'machine' },
  { name: 'Stair Climber', muscleGroup: 'cardio', equipment: 'machine' },
  { name: 'Jump Rope', muscleGroup: 'cardio', equipment: 'other' },
  { name: 'Burpees', muscleGroup: 'cardio', equipment: 'bodyweight' },
  { name: 'Box Jumps', muscleGroup: 'cardio', equipment: 'other' },
  { name: 'Battle Ropes', muscleGroup: 'cardio', equipment: 'other' },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed exercises
  console.log('📋 Seeding exercises...');
  
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { 
        name_createdById: { 
          name: exercise.name, 
          createdById: '' // Empty string for system exercises
        } 
      },
      update: {},
      create: {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        isCustom: false,
        createdById: null,
      },
    });
  }

  console.log(`✅ Seeded ${exercises.length} exercises`);
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
