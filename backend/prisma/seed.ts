import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

dotenv.config();

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL || '';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const INITIAL_CATEGORIES = [
  { name: 'Agriculture', slug: 'agriculture' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Food & Beverage', slug: 'food-and-beverage' },
  { name: 'Healthcare', slug: 'healthcare' },
  { name: 'Education', slug: 'education' },
  { name: 'Automotive', slug: 'automotive' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Lifestyle', slug: 'home-and-lifestyle' },
  { name: 'Business & Startup', slug: 'business-and-startup' },
  { name: 'Science', slug: 'science' },
  { name: 'Arts & Culture', slug: 'arts-and-culture' },
];

async function main() {
  console.log('Seeding initial categories...');
  for (const cat of INITIAL_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
  }
  console.log('Categories seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

