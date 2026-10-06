import { Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../utils/logger';

export const toggleFollow = async (req: Request, res: Response) => {
    try {
        const followingId = req.params.id as string;
        const authenticatedUser = req.user as { id: string };
        const followerId = authenticatedUser.id;

        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const target = await prisma.user.findUnique({ where: { id: followingId } });
        if (!target) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existing = await prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } },
        });

        if (existing) {
            await prisma.follow.delete({
                where: { followerId_followingId: { followerId, followingId } },
            });
            const followerCount = await prisma.follow.count({ where: { followingId } });
            return res.status(200).json({ data: { isFollowing: false, followerCount } });
        }

        await prisma.follow.create({ data: { followerId, followingId } });
        const followerCount = await prisma.follow.count({ where: { followingId } });
        return res.status(201).json({ data: { isFollowing: true, followerCount } });
    } catch (error) {
        logger.error('toggleFollow failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to toggle follow' });
    }
};

export const getFollowStatus = async (req: Request, res: Response) => {
    try {
        const followingId = req.params.id as string;
        const authenticatedUser = req.user as { id: string } | undefined;
        const followerId = authenticatedUser?.id;

        let isFollowing = false;
        if (followerId) {
            const existing = await prisma.follow.findUnique({
                where: { followerId_followingId: { followerId, followingId } },
            });
            isFollowing = !!existing;
        }

        const followerCount = await prisma.follow.count({ where: { followingId } });
        res.status(200).json({ data: { isFollowing, followerCount } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get follow status' });
    }
};

export const getRecommendedAccounts = async (req: Request, res: Response) => {
    try {
        const authenticatedUser = req.user as { id: string };
        const currentUserId = authenticatedUser.id;

        const myFollows = await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
        });
        const followingIds = new Set(myFollows.map((f: { followingId: string }) => f.followingId));

        const topUsers = await prisma.user.findMany({
            where: { id: { not: currentUserId } },
            include: {
                _count: { select: { images: true, followers: true } },
                images: {
                    include: { _count: { select: { reactions: true } } },
                    take: 10,
                },
            },
            take: 30,
        });

        const scored = topUsers
            .map((u) => ({
                id: u.id,
                username: u.username,
                firstName: u.firstName,
                lastName: u.lastName,
                avatar: u.avatar,
                bio: u.bio,
                followerCount: u._count.followers,
                imageCount: u._count.images,
                reactionCount: u.images.reduce((sum: number, img: { _count: { reactions: number } }) => sum + img._count.reactions, 0),
                isFollowing: followingIds.has(u.id),
            }))
            .sort((a, b) => b.reactionCount - a.reactionCount || b.followerCount - a.followerCount)
            .slice(0, 8);

        res.status(200).json({ data: scored });
    } catch (error) {
        logger.error('getRecommendedAccounts failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to get recommended accounts' });
    }
};
