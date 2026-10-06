import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ugram API',
            version: '1.0.0',
            description: 'REST API for Ugram — an Instagram-like photo sharing application (GLO-3112)',
        },
        servers: [
            {
                url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
                description: 'API server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        username: { type: 'string' },
                        firstName: { type: 'string', nullable: true },
                        lastName: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        avatar: { type: 'string', nullable: true },
                        bio: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Image: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        url: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        userId: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Validation error' },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Users', description: 'User management' },
            { name: 'Images', description: 'Image operations' },
            { name: 'Search', description: 'Search functionality' },
        ],
    },
    apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
