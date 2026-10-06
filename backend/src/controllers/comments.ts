import { Request, Response } from 'express';
import { prisma } from '../prisma';
import logger from '../utils/logger';

const commentInclude = {
    user: { select: { id: true, username: true, avatar: true } },
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const imageId = req.params.id as string;
        const comments = await prisma.comment.findMany({
            where: { imageId },
            include: commentInclude,
            orderBy: { createdAt: 'asc' },
        });
        res.status(200).json({ data: comments });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        const imageId = req.params.id as string;
        const authenticatedUser = req.user as { id: string };
        const userId = authenticatedUser.id;
        const { content } = req.body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content cannot be empty' });
        }

        const image = await prisma.image.findUnique({ where: { id: imageId } });
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const comment = await prisma.comment.create({
            data: { imageId, userId, content: content.trim() },
            include: commentInclude,
        });

        if (image.userId !== userId) {
            await prisma.notification.create({
                data: { userId: image.userId, fromUserId: userId, type: 'comment', imageId },
            });
        }

        res.status(201).json({ data: comment });
    } catch (error) {
        logger.error('createComment failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to create comment' });
    }
};

export const deleteComment = async (req: Request, res: Response) => {
    try {
        const commentId = req.params.id as string;
        const authenticatedUser = req.user as { id: string };
        const userId = authenticatedUser.id;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { image: { select: { userId: true } } },
        });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        const isAuthor = comment.userId === userId;
        const isImageOwner = comment.image.userId === userId;
        if (!isAuthor && !isImageOwner) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.comment.delete({ where: { id: commentId } });
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};
