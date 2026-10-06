import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { getIO } from '../socket';
import logger from '../utils/logger';

function getConversationKey(id1: string, id2: string): [string, string] {
    return id1 < id2 ? [id1, id2] : [id2, id1];
}

const messageInclude = {
    sender: {
        select: { id: true, username: true, avatar: true },
    },
};

const conversationInclude = {
    user1: { select: { id: true, username: true, avatar: true, firstName: true, lastName: true } },
    user2: { select: { id: true, username: true, avatar: true, firstName: true, lastName: true } },
    messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        include: messageInclude,
    },
};

export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as { id: string }).id;

        const conversations = await prisma.conversation.findMany({
            where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
            orderBy: { updatedAt: 'desc' },
            include: conversationInclude,
        });

        res.status(200).json({ data: conversations });
    } catch (error) {
        logger.error('getConversations failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to get conversations' });
    }
};

export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req.user as { id: string }).id;
        const otherUserId = req.params.userId as string;

        if (currentUserId === otherUserId) {
            return res.status(400).json({ error: 'Cannot chat with yourself' });
        }

        const other = await prisma.user.findUnique({ where: { id: otherUserId } });
        if (!other) return res.status(404).json({ error: 'User not found' });

        const [user1Id, user2Id] = getConversationKey(currentUserId, otherUserId);

        let conversation = await prisma.conversation.findUnique({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            include: conversationInclude,
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: { user1Id, user2Id },
                include: conversationInclude,
            });
        }

        // Fetch all messages for the conversation
        const messages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            include: messageInclude,
        });

        // Mark unread messages as read
        await prisma.message.updateMany({
            where: { conversationId: conversation.id, senderId: { not: currentUserId }, read: false },
            data: { read: true },
        });

        res.status(200).json({ data: { conversation, messages } });
    } catch (error) {
        logger.error('getOrCreateConversation failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to get conversation' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const senderId = (req.user as { id: string }).id;
        const otherUserId = req.params.userId as string;
        const { content } = req.body as { content: string };

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const other = await prisma.user.findUnique({ where: { id: otherUserId } });
        if (!other) return res.status(404).json({ error: 'User not found' });

        const [user1Id, user2Id] = getConversationKey(senderId, otherUserId);

        const conversation = await prisma.conversation.upsert({
            where: { user1Id_user2Id: { user1Id, user2Id } },
            create: { user1Id, user2Id },
            update: { updatedAt: new Date() },
        });

        const message = await prisma.message.create({
            data: { conversationId: conversation.id, senderId, content: content.trim() },
            include: messageInclude,
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        });

        // Emit via Socket.io
        try {
            const io = getIO();
            io.to(`conversation:${conversation.id}`).emit('new_message', message);
        } catch {
            // Socket.io may not be initialized in test environments
        }

        res.status(201).json({ data: message });
    } catch (error) {
        logger.error('sendMessage failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to send message' });
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as { id: string }).id;

        const count = await prisma.message.count({
            where: { senderId: { not: userId }, read: false, conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] } },
        });

        res.status(200).json({ data: { count } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};
