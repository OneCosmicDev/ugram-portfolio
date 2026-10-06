import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string | undefined;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                error: 'Missing query parameter',
                message: 'Please provide a ?q= search term',
            });
        }

        const results = await prisma.user.findMany({
            where: {
                username: {
                    contains: q,
                    mode: 'insensitive',
                },
            },
        });

        res.status(200).json({
            data: results,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to search users',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const searchHashtags = async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string | undefined;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                error: 'Missing query parameter',
                message: 'Please provide a ?q= search term',
            });
        }

        const results = await prisma.hashtag.findMany({
            where: {
                name: {
                    startsWith: q.replace(/^#/, ''),
                    mode: 'insensitive',
                },
            },
            take: 10,
        });

        res.status(200).json({
            data: results,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to search hashtags',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const getTrendingHashtags = async (_req: Request, res: Response) => {
    try {
        const results = await prisma.imageHashtag.groupBy({
            by: ['hashtagId'],
            _count: { hashtagId: true },
            orderBy: { _count: { hashtagId: 'desc' } },
            take: 10,
        });

        const hashtagIds = results.map((r) => r.hashtagId);
        const hashtags = await prisma.hashtag.findMany({
            where: { id: { in: hashtagIds } },
        });

        const hashtagMap = new Map(hashtags.map((h) => [h.id, h.name]));
        const data = results.map((r) => ({
            id: r.hashtagId,
            name: hashtagMap.get(r.hashtagId) ?? '',
            count: r._count.hashtagId,
        }));

        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch trending hashtags',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const searchImages = async (req: Request, res: Response) => {
    try {
        const hashtag = req.query.hashtag as string | undefined;
        const description = req.query.description as string | undefined;

        if (!hashtag && !description) {
            return res.status(400).json({
                error: 'Missing query parameter',
                message: 'Please provide ?hashtag= or ?description= search term',
            });
        }

        const whereClause = hashtag
            ? {
                  hashtags: {
                      some: {
                          hashtag: {
                              name: {
                                  contains: hashtag,
                                  mode: 'insensitive' as const,
                              },
                          },
                      },
                  },
              }
            : {
                  description: {
                      contains: description,
                      mode: 'insensitive' as const,
                  },
              };

        const results = await prisma.image.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                hashtags: { include: { hashtag: true } },
                mentions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(200).json({
            data: results,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to search images',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};