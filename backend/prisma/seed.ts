import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
        console.log('✅ Database already has data, skipping seed.');
        return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
        data: {
            email: 'john.doe@example.com',
            username: 'johndoe',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1-555-0101',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe',
            bio: 'Photography enthusiast | Travel lover',
        },
    });

    const user2 = await prisma.user.create({
        data: {
            email: 'jane.smith@example.com',
            username: 'janesmith',
            password: hashedPassword,
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+1-555-0102',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=janesmith',
            bio: 'Digital artist | Coffee addict',
        },
    });

    const user3 = await prisma.user.create({
        data: {
            email: 'alex.wilson@example.com',
            username: 'alexwilson',
            password: hashedPassword,
            firstName: 'Alex',
            lastName: 'Wilson',
            phone: '+1-555-0103',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexwilson',
            bio: 'Software developer | Nature lover ',
        },
    });

    console.log('👥 Created 3 users');

    const hTags = (names: string[]): Prisma.ImageHashtagCreateNestedManyWithoutImageInput => ({
        create: names.map(name => ({
            hashtag: { connectOrCreate: { where: { name }, create: { name } } }
        }))
    });

    await prisma.image.create({
        data: {
            urlSmall: 'https://picsum.photos/seed/ugram1/800/600',
            urlMedium: 'https://picsum.photos/seed/ugram1/800/600',
            urlLarge: 'https://picsum.photos/seed/ugram1/800/600',
            description: 'Beautiful sunset at the beach!',
            userId: user1.id,
            hashtags: hTags(['sunset', 'beach', 'nature']),
            mentions: {
                create: [{ userId: user2.id }],
            },
        },
    });

    await prisma.image.create({
        data: {
            urlSmall: 'https://picsum.photos/seed/ugram2/800/600',
            urlMedium: 'https://picsum.photos/seed/ugram2/800/600',
            urlLarge: 'https://picsum.photos/seed/ugram2/800/600',
            description: 'Morning coffee vibes',
            userId: user1.id,
            hashtags: hTags(['coffee', 'morning']),
        },
    });

    await prisma.image.create({
        data: {
            urlSmall: 'https://picsum.photos/seed/ugram3/800/600',
            urlMedium: 'https://picsum.photos/seed/ugram3/800/600',
            urlLarge: 'https://picsum.photos/seed/ugram3/800/600',
            description: 'New digital artwork! What do you think?',
            userId: user2.id,
            hashtags: hTags(['art', 'digital', 'creative']),
            mentions: {
                create: [{ userId: user1.id }, { userId: user3.id }],
            },
        },
    });

    await prisma.image.create({
        data: {
            urlSmall: 'https://picsum.photos/seed/ugram4/800/600',
            urlMedium: 'https://picsum.photos/seed/ugram4/800/600',
            urlLarge: 'https://picsum.photos/seed/ugram4/800/600',
            description: 'Hiking in the mountains',
            userId: user3.id,
            hashtags: hTags(['hiking', 'mountains', 'adventure']),
        },
    });

    await prisma.image.create({
        data: {
            urlSmall: 'https://picsum.photos/seed/ugram5/800/600',
            urlMedium: 'https://picsum.photos/seed/ugram5/800/600',
            urlLarge: 'https://picsum.photos/seed/ugram5/800/600',
            description: 'Code review session ',
            userId: user3.id,
            hashtags: hTags(['coding', 'developer', 'tech']),
        },
    });

    console.log('Created 5 images with hashtags and mentions');

    console.log('✅ Seed completed successfully!');
    console.log(`
📊 Summary:
- Users: 3
- Images: 5
- Hashtags: 13
- Mentions: 3
  `);
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
