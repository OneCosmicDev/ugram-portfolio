import { Request, Response } from 'express';
import sharp from 'sharp';
import path from 'path';
import { prisma } from '../prisma';
import { useS3, UPLOADS_DIR } from '../middleware/upload';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { syncHashtagsAndMentions } from './images';
import logger from '../utils/logger';

const UNSPLASH_API = 'https://api.unsplash.com';

export const searchUnsplash = async (req: Request, res: Response) => {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
        return res.status(503).json({ error: 'Unsplash integration not configured' });
    }

    const q = req.query.q as string;
    const page = parseInt((req.query.page as string) || '1', 10);

    if (!q?.trim()) {
        return res.status(400).json({ error: 'Query parameter q is required' });
    }

    try {
        const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=20`;
        const response = await fetch(url, {
            headers: { Authorization: `Client-ID ${accessKey}` },
        });

        if (!response.ok) {
            return res.status(502).json({ error: 'Unsplash API error' });
        }

        const json = await response.json() as {
            results: Array<{
                id: string;
                description: string | null;
                alt_description: string | null;
                urls: { small: string; regular: string; full: string };
                user: { name: string; username: string };
            }>;
            total: number;
            total_pages: number;
        };

        const photos = json.results.map((p) => ({
            id: p.id,
            description: p.description || p.alt_description || '',
            urls: { small: p.urls.small, regular: p.urls.regular, full: p.urls.full },
            author: { name: p.user.name, username: p.user.username },
        }));

        res.status(200).json({ data: { photos, total: json.total, totalPages: json.total_pages } });
    } catch (error) {
        logger.error('searchUnsplash failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to search Unsplash' });
    }
};

export const importUnsplashPhoto = async (req: Request, res: Response) => {
    try {
        const { photoUrl, description } = req.body as { photoUrl: string; description?: string };
        const authenticatedUser = req.user as { id: string };
        const userId = authenticatedUser.id;

        if (!photoUrl) {
            return res.status(400).json({ error: 'photoUrl is required' });
        }

        // Download the image
        const response = await fetch(photoUrl);
        if (!response.ok) {
            return res.status(502).json({ error: 'Failed to download image from Unsplash' });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const sizes = [
            { name: 'small', width: 300 },
            { name: 'medium', width: 600 },
            { name: 'large', width: 1080 },
        ];

        const urls: Record<string, string> = {};

        if (useS3) {
            const region = process.env.AWS_REGION || 'us-east-2';
            const bucket = process.env.S3_BUCKET_NAME!;
            const s3 = new S3Client({ region });

            for (const size of sizes) {
                const processed = await sharp(buffer)
                    .resize(size.width)
                    .jpeg({ quality: 80 })
                    .toBuffer();

                const key = `uploads/${size.name}-${Date.now()}-unsplash.jpg`;
                await s3.send(new PutObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    Body: processed,
                    ContentType: 'image/jpeg',
                }));
                urls[size.name] = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
            }
        } else {
            for (const size of sizes) {
                const filename = `${size.name}-${Date.now()}-unsplash.jpg`;
                const filepath = path.join(UPLOADS_DIR, filename);
                await sharp(buffer).resize(size.width).jpeg({ quality: 80 }).toFile(filepath);
                urls[size.name] = `/uploads/${filename}`;
            }
        }

        const newImage = await prisma.image.create({
            data: {
                urlSmall: urls.small,
                urlMedium: urls.medium,
                urlLarge: urls.large,
                description: description || null,
                userId,
            },
        });

        if (description) {
            await syncHashtagsAndMentions(newImage.id, description);
        }

        res.status(201).json({ data: newImage });
    } catch (error) {
        logger.error('importUnsplashPhoto failed', { message: error instanceof Error ? error.message : error });
        res.status(500).json({ error: 'Failed to import photo' });
    }
};
