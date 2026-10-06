import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import fs from "fs";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export const useS3 = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME
);

const diskStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },
});

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only JPG and PNG images are allowed'));
        }
        cb(null, true);
    },
});

export async function uploadToS3(file: Express.Multer.File): Promise<string> {
    const region = process.env.AWS_REGION || 'us-east-2';
    const bucket = process.env.S3_BUCKET_NAME!;

    const s3 = new S3Client({ region });
    const key = `uploads/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    );

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadToLocal(file: Express.Multer.File): Promise<string> {
    const filename = `avatar-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    await sharp(file.buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(filepath);

    return `/uploads/${filename}`;
}

export async function uploadVariantsToLocal(file: Express.Multer.File, filter?: string) {
    const sizes = [
        { name: 'small', width: 300 },
        { name: 'medium', width: 600 },
        { name: 'large', width: 1080 },
    ];
    const imagesUrls: Record<string, string> = {};

    for (const size of sizes) {
        const filename = `${size.name}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
        const filepath = path.join(UPLOADS_DIR, filename);

        await sharp(file.buffer)
            .resize(size.width)
            .jpeg({ quality: 80 })
            .toFile(filepath);

        imagesUrls[size.name] = `/uploads/${filename}`;
    }

    return imagesUrls;
}

export async function uploadVariantsToS3(file: Express.Multer.File, filter?: string) {
    const region = process.env.AWS_REGION || 'us-east-2';
    const bucket = process.env.S3_BUCKET_NAME!;

    const s3 = new S3Client({ region });

    const processedImages = await processImage(file);

    const urls: Record<string, string> = {};

    for (const [size, buffer] of Object.entries(processedImages)) {
        const key = `uploads/${size}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

        await s3.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: buffer,
                ContentType: file.mimetype,
            })
        );

        urls[size] = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }

    return urls;
}

export async function processImage(file: Express.Multer.File, filter?: string) {
    const sizes = [
        { name: 'small', width: 300 },
        { name: 'medium', width: 600 },
        { name: 'large', width: 1080 },
    ];

    const results: Record<string, Buffer> = {};

    for (const size of sizes) {
        let pipeline = sharp(file.buffer);

        pipeline = applyFilter(pipeline, filter);

        results[size.name] = await pipeline.resize(size.width).jpeg({ quality: 80 }).toBuffer();
    }

    return results;
}

function applyFilter(image: sharp.Sharp, filter?: string) {
    switch (filter) {
        case "grayscale":
            return image.grayscale();

        case "sepia":
            return image.modulate({
                saturation: 0.3,
                brightness: 1.1,
            });

        case "blur":
            return image.blur(2);

        case "bright":
            return image.modulate({ brightness: 1.3 });

        case "contrast":
            return image.linear(1.3, -10);

        default:
            return image;
    }
}