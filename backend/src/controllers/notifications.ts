import { Request, Response } from 'express';
import { prisma } from '../prisma';

const notificationInclude = {
    fromUser: { select: { id: true, username: true, avatar: true } },
    image: { select: { id: true, urlSmall: true } },
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as { id: string }).id;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            include: notificationInclude,
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({ data: notifications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const notifId = req.params.id as string;
        const userId = (req.user as { id: string }).id;

        const notif = await prisma.notification.findUnique({ where: { id: notifId } });
        if (!notif || notif.userId !== userId) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.update({ where: { id: notifId }, data: { read: true } });
        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

export const markAllRead = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as { id: string }).id;
        await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};
