import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma';
import { publicUserSelect } from '../auth/publicUser';
import { useS3, uploadToS3, uploadToLocal } from '../middleware/upload';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: publicUserSelect,
        });
        res.status(200).json({
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch users',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id as string;

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
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
                images: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    include: {
                        user: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
                        hashtags: { include: { hashtag: true } },
                        mentions: { include: { user: { select: { id: true, username: true } } } },
                    },
                }
            },
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with id ${req.params.id} does not exist`,
            });
        }

        res.status(200).json({
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Missing requires fields',
                message: 'Please fill in all fields',
            });
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] },
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: existingUser.username === username
                    ? `Username "${username}" is already taken`
                    : `Email "${email}" is already registered`,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                firstName,
                lastName,
            },
            select: publicUserSelect,
        });

        res.status(201).json({
            data: newUser,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({
                error: 'User already exists',
                message: 'Username or email is already taken',
            });
        }
        res.status(500).json({
            error: 'Failed to create user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id as string;
        const { email, firstName, lastName, phone, avatar, bio } = req.body;

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Invalid email format',
                    message: `${email} is not a valid email address`,
                });
            }
        }

        if (phone && phone.trim() !== '') {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    error: 'Invalid phone format',
                    message: 'Phone number can only contain digits, spaces, dashes, plus signs, and parentheses',
                });
            }
        }

        const updateData: Prisma.UserUpdateInput = {};
        if (email !== undefined) updateData.email = email;
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (bio !== undefined) updateData.bio = bio;

        let newAvatar = avatar;
        const multerReq = req as Request & { file?: Express.Multer.File };
        if (multerReq.file) {
            if (useS3 && multerReq.file.buffer) {
                newAvatar = await uploadToS3(multerReq.file);
            } else {
                newAvatar = await uploadToLocal(multerReq.file);
            }
        }
        
        if (newAvatar !== undefined) updateData.avatar = newAvatar;

        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: updateData,
            select: publicUserSelect,
        });

        res.status(200).json({
            data: updatedUser,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with id ${req.params.id} does not exist`,
            });
        }

        res.status(500).json({
            error: 'Failed to update user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id as string;

        await prisma.user.delete({
            where: {
                id: userId,
            },
        });

        res.status(200).json({
            message: `User ${userId} deleted successfully`,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Record to delete not found')) {
            return res.status(404).json({
                error: 'User not found',
                message: `User with id ${req.params.id} does not exist`,
            });
        }

        res.status(500).json({
            error: 'Failed to delete user',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
