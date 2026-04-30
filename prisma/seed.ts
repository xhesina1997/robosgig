import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categories = [
  { name: 'Plumbing', slug: 'plumbing', icon: '🔧', description: 'Pipes, leaks, toilets, sinks' },
  { name: 'Electrical', slug: 'electrical', icon: '⚡', description: 'Wiring, outlets, lamps, fuse box' },
  { name: 'Carpentry', slug: 'carpentry', icon: '🪚', description: 'Furniture, shelves, doors, floors' },
  { name: 'Painting', slug: 'painting', icon: '🎨', description: 'Walls, ceilings, exterior' },
  { name: 'Cleaning', slug: 'cleaning', icon: '🧹', description: 'Home, office, deep cleaning' },
  { name: 'Moving', slug: 'moving', icon: '📦', description: 'Furniture moving, relocation help' },
  { name: 'Mechanical', slug: 'mechanical', icon: '🚗', description: 'Car and bike repair' },
  { name: 'Handyman', slug: 'handyman', icon: '🔨', description: 'Small repairs, general fixes' },
  { name: 'Delivery', slug: 'delivery', icon: '🛵', description: 'Package pickup, grocery shopping' },
  { name: 'Caregiving', slug: 'caregiving', icon: '🐕', description: 'Dog walking, babysitting, elderly care' },
];

async function main() {
  console.log('Seeding categories...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Seed skills per category
  const plumbing = await prisma.category.findUnique({ where: { slug: 'plumbing' } });
  const electrical = await prisma.category.findUnique({ where: { slug: 'electrical' } });
  const cleaning = await prisma.category.findUnique({ where: { slug: 'cleaning' } });

  const skills = [
    { name: 'Pipe repair', categoryId: plumbing!.id },
    { name: 'Drain unblocking', categoryId: plumbing!.id },
    { name: 'Appliance installation', categoryId: plumbing!.id },
    { name: 'Outlet installation', categoryId: electrical!.id },
    { name: 'Lamp installation', categoryId: electrical!.id },
    { name: 'Deep cleaning', categoryId: cleaning!.id },
    { name: 'Move-out cleaning', categoryId: cleaning!.id },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { id: `seed-${skill.name}` },
      update: {},
      create: { id: `seed-${skill.name}`, ...skill },
    });
  }

  // Seed 3 demo workers in Vienna
  console.log('Seeding demo workers...');
  const password = await bcrypt.hash('Password123', 12);

  const demoWorkers = [
    {
      email: 'hans@example.com',
      firstName: 'Hans',
      lastName: 'Müller',
      city: 'Vienna',
      address: 'Mariahilfer Straße 100, 1060 Wien',
      latitude: 48.1966,
      longitude: 16.3417,
      hourlyRate: 45,
      rating: 4.8,
      totalJobs: 87,
      bio: 'Licensed plumber with 12 years experience. Available weekdays and weekends.',
      categorySlug: 'plumbing',
    },
    {
      email: 'anna@example.com',
      firstName: 'Anna',
      lastName: 'Wagner',
      city: 'Vienna',
      address: 'Praterstraße 22, 1020 Wien',
      latitude: 48.2167,
      longitude: 16.3891,
      hourlyRate: 35,
      rating: 4.9,
      totalJobs: 124,
      bio: 'Professional cleaner, deep cleaning specialist. Eco-friendly products.',
      categorySlug: 'cleaning',
    },
    {
      email: 'stefan@example.com',
      firstName: 'Stefan',
      lastName: 'Bauer',
      city: 'Vienna',
      address: 'Währinger Straße 55, 1090 Wien',
      latitude: 48.2237,
      longitude: 16.3564,
      hourlyRate: 55,
      rating: 4.7,
      totalJobs: 63,
      bio: 'Certified electrician. All electrical work, fast response.',
      categorySlug: 'electrical',
    },
  ];

  for (const w of demoWorkers) {
    const existing = await prisma.user.findUnique({ where: { email: w.email } });
    if (existing) continue;

    const category = await prisma.category.findUnique({ where: { slug: w.categorySlug } });
    const firstSkill = await prisma.skill.findFirst({ where: { categoryId: category!.id } });

    const user = await prisma.user.create({
      data: {
        email: w.email,
        password,
        role: 'WORKER',
        workerProfile: {
          create: {
            firstName: w.firstName,
            lastName: w.lastName,
            city: w.city,
            address: w.address,
            latitude: w.latitude,
            longitude: w.longitude,
            hourlyRate: w.hourlyRate,
            rating: w.rating,
            totalJobs: w.totalJobs,
            bio: w.bio,
            idVerified: true,
            ...(firstSkill
              ? { skills: { create: { skillId: firstSkill.id } } }
              : {}),
          },
        },
      },
    });
    console.log(`Created worker: ${w.firstName} ${w.lastName} (${user.id})`);
  }

  // Seed admin user
  console.log('Seeding admin user...');
  const adminExists = await prisma.user.findUnique({ where: { email: 'adm@adm.com' } });
  if (!adminExists) {
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    await prisma.user.create({
      data: {
        email: 'adm@adm.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created: adm@adm.com / Admin123!');
  } else {
    console.log('Admin user already exists.');
  }

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
