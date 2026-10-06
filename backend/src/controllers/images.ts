import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { useS3, uploadToS3, uploadVariantsToS3, uploadVariantsToLocal } from '../middleware/upload';
import logger from '../utils/logger';

const extractHashtags = (description: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = description.matchAll(hashtagRegex);
    return Array.from(matches, match => match[1]);
};

const extractMentions = (description: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = description.matchAll(mentionRegex);
    return Array.from(matches, match => match[1]);
};

export const syncHashtagsAndMentions = async (imageId: string, description: string): Promise<void> => {
    logger.info('syncHashtagsAndMentions start', { imageId, description });

    try {
        await prisma.imageHashtag.deleteMany({ where: { imageId } });
        logger.info('deleteMany imageHashtag ok');
    } catch (e) {
        logger.error('deleteMany imageHashtag FAILED', { error: e instanceof Error ? e.message : e });
        throw e;
    }

    try {
        await prisma.imageMention.deleteMany({ where: { imageId } });
        logger.info('deleteMany imageMention ok');
    } catch (e) {
        logger.error('deleteMany imageMention FAILED', { error: e instanceof Error ? e.message : e });
        throw e;
    }

    const hashtags = extractHashtags(description);
    logger.info('hashtags extracted', { hashtags });

    for (const name of hashtags) {
        try {
            await prisma.$executeRaw`
                INSERT INTO "hashtags" ("id", "name", "createdAt")
                VALUES (${randomUUID()}, ${name}, NOW())
                ON CONFLICT ("name") DO NOTHING
            `;
            logger.info('INSERT hashtag ok', { name });
        } catch (e) {
            logger.error('INSERT hashtag FAILED', { name, error: e instanceof Error ? e.message : e });
            throw e;
        }

        try {
            await prisma.$executeRaw`
                INSERT INTO "image_hashtags" ("imageId", "hashtagId")
                SELECT ${imageId}, "id" FROM "hashtags" WHERE "name" = ${name}
            `;
            logger.info('INSERT image_hashtag ok', { imageId, name });
        } catch (e) {
            logger.error('INSERT image_hashtag FAILED', { imageId, name, error: e instanceof Error ? e.message : e });
            throw e;
        }
    }

    const mentions = extractMentions(description);
    if (mentions.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
            where: { username: { in: mentions } },
            select: { id: true },
        });

        if (mentionedUsers.length > 0) {
            await prisma.imageMention.createMany({
                data: mentionedUsers.map((user: { id: string }) => ({
                    imageId,
                    userId: user.id,
                })),
            });
        }
    }

    logger.info('syncHashtagsAndMentions done', { imageId });
};


export const getAllImages = async (req: Request, res: Response) => {
    try {
        const images = await prisma.image.findMany({
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
            data: images,
        });
    } catch (error) {
        logger.error('getAllImages failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({
            error: 'Failed to fetch images',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const getUserImages = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id as string;

        const images = await prisma.image.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
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
            data: images,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch user images',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const getImageById = async (req: Request, res: Response) => {
    try {
        const imageId = req.params.id as string;

        const image = await prisma.image.findUnique({
            where: {
                id: imageId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
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

        if (!image) {
            return res.status(404).json({
                error: 'Image not found',
                message: `Image with id ${req.params.id} does not exist`,
            });
        }

        res.status(200).json({
            data: image,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch image',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const createImage = async (req: Request, res: Response) => {
    try {
        const multerReq = req as Request & { file?: Express.Multer.File };

        if (!multerReq.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please provide an image file',
            });
        }


        const authenticatedUser = req.user as { id: string };
        const { description, filter } = req.body;
        const userId = authenticatedUser.id;

        let imagesUrls: Record<string, string>;
        if (useS3 && multerReq.file.buffer) {
            imagesUrls = await uploadVariantsToS3(multerReq.file, filter);
        } else {
            imagesUrls = await uploadVariantsToLocal(multerReq.file, filter);
        }

        const newImage = await prisma.image.create({
            data: {
                urlSmall: imagesUrls.small,
                urlMedium: imagesUrls.medium,
                urlLarge: imagesUrls.large,
                description: description || null,
                userId: userId,
            },
        });

        if (description) {
            await syncHashtagsAndMentions(newImage.id, description);
        }

        res.status(201).json({
            message: 'Image added successfully',
            data: newImage,
            url: `/api/images/${newImage.id}`,
        });
    } catch (error) {
        logger.error('createImage failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({
            error: 'Failed to create image',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const updateImage = async (req: Request, res: Response) => {
    try {
        const imageId = req.params.id as string;
        const authenticatedUser = req.user as { id: string };
        const { description } = req.body;

        const existingImage = await prisma.image.findUnique({ where: { id: imageId } });
        if (!existingImage) {
            return res.status(404).json({
                error: 'Image not found',
                message: `Image with id ${imageId} does not exist`,
            });
        }
        if (existingImage.userId !== authenticatedUser.id) {
            return res.status(403).json({ error: 'Forbidden: you do not own this image' });
        }

        const updateData: Prisma.ImageUpdateInput = {};
        if (description !== undefined) {
            updateData.description = description;
        }

        const updatedImage = await prisma.image.update({
            where: {
                id: imageId,
            },
            data: updateData,
        });

        if (description !== undefined) {
            await syncHashtagsAndMentions(imageId, description);
        }

        res.status(200).json({
            data: updatedImage,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return res.status(404).json({
                error: 'Image not found',
                message: `Image with id ${req.params.id} does not exist`,
            });
        }

        logger.error('updateImage failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({
            error: 'Failed to update image',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const deleteImage = async (req: Request, res: Response) => {
    try {
        const imageId = req.params.id as string;
        const authenticatedUser = req.user as { id: string };

        const existingImage = await prisma.image.findUnique({ where: { id: imageId } });
        if (!existingImage) {
            return res.status(404).json({
                error: 'Image not found',
                message: `Image with id ${imageId} does not exist`,
            });
        }
        if (existingImage.userId !== authenticatedUser.id) {
            return res.status(403).json({ error: 'Forbidden: you do not own this image' });
        }

        await prisma.image.delete({
            where: {
                id: imageId,
            },
        });

        res.status(200).json({
            message: 'Image deleted successfully',
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return res.status(404).json({
                error: 'Image not found',
                message: `Image with id ${req.params.id} does not exist`,
            });
        }

        res.status(500).json({
            error: 'Failed to delete image',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
