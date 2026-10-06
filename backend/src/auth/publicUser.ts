import { Prisma } from '@prisma/client';

export const publicUserSelect = {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    phone: true,
    avatar: true,
    bio: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect;

