import { Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../utils/logger';

export const toggleReaction = async (req: Request, res: Response) => {
    try {
        const imageId = req.params.id as string;
        const authenticatedUser = req.user as { id: string };
        const userId = authenticatedUser.id;

        const image = await prisma.image.findUnique({ where: { id: imageId } });
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const existing = await prisma.reaction.findUnique({
            where: { imageId_userId: { imageId, userId } },
        });

        if (existing) {
            await prisma.reaction.delete({ where: { imageId_userId: { imageId, userId } } });
            const count = await prisma.reaction.count({ where: { imageId } });
            return res.status(200).json({ data: { liked: false, count } });
        }

        await prisma.reaction.create({ data: { imageId, userId } });

        if (image.userId !== userId) {
            await prisma.notification.create({
                data: { userId: image.userId, fromUserId: userId, type: 'reaction', imageId },
            });
        }

        const count = await prisma.reaction.count({ where: { imageId } });
        return res.status(201).json({ data: { liked: true, count } });
    } catch (error) {
        logger.error('toggleReaction failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to toggle reaction' });
    }
};

export const getReactions = async (req: Request, res: Response) => {
    try {
        const imageId = req.params.id as string;
        const userId = (req.user as { id: string } | undefined)?.id;

        const count = await prisma.reaction.count({ where: { imageId } });
        let liked = false;
        if (userId) {
            const existing = await prisma.reaction.findUnique({
                where: { imageId_userId: { imageId, userId } },
            });
            liked = !!existing;
        }

        res.status(200).json({ data: { count, liked } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reactions' });
    }
};
