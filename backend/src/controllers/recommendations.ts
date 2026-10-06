import { Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../utils/logger';

export const getInterestBasedImages = async (req: Request, res: Response) => {
    try {
        const authenticatedUser = req.user as { id: string };
        const currentUserId = authenticatedUser.id;

        // Images the user has already reacted to or commented on
        const [reactedImages, commentedImages] = await Promise.all([
            prisma.reaction.findMany({
                where: { userId: currentUserId },
                select: { imageId: true },
            }),
            prisma.comment.findMany({
                where: { userId: currentUserId },
                select: { imageId: true },
            }),
        ]);

        const interactedIds = [
            ...new Set([
                ...reactedImages.map((r) => r.imageId),
                ...commentedImages.map((c) => c.imageId),
            ]),
        ];

        if (interactedIds.length === 0) {
            // No interactions yet — return most popular images (by reactions)
            const popular = await prisma.image.findMany({
                where: { userId: { not: currentUserId } },
                orderBy: { reactions: { _count: 'desc' } },
                take: 20,
                include: {
                    user: { select: { id: true, username: true, avatar: true } },
                    hashtags: { include: { hashtag: true } },
                    mentions: { include: { user: { select: { id: true, username: true } } } },
                    _count: { select: { reactions: true, comments: true } },
                },
            });
            return res.status(200).json({ data: popular });
        }

        // Hashtags the user has interacted with
        const interestHashtags = await prisma.imageHashtag.findMany({
            where: { imageId: { in: interactedIds } },
            select: { hashtagId: true },
            distinct: ['hashtagId'],
        });

        const hashtagIds = interestHashtags.map((h) => h.hashtagId);

        if (hashtagIds.length === 0) {
            return res.status(200).json({ data: [] });
        }

        // Find images with those hashtags, excluding already-interacted and own images
        const recommended = await prisma.image.findMany({
            where: {
                id: { notIn: interactedIds },
                userId: { not: currentUserId },
                hashtags: { some: { hashtagId: { in: hashtagIds } } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                user: { select: { id: true, username: true, avatar: true } },
                hashtags: { include: { hashtag: true } },
                mentions: { include: { user: { select: { id: true, username: true } } } },
                _count: { select: { reactions: true, comments: true } },
            },
        });

        res.status(200).json({ data: recommended });
    } catch (error) {
        logger.error('getInterestBasedImages failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
};
