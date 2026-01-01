import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Add your seed data here
  // Example:
  // const user = await prisma.user.create({
  //   data: {
  //     clerkId: 'test_user_id',
  //     email: 'test@example.com',
  //     name: 'Test User',
  //   },
  // });
  // console.log('Created user:', user);

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

