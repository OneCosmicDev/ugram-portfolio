import 'express-session';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            username: string;
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            avatar: string | null;
            bio: string | null;
            createdAt: Date;
            updatedAt: Date;
        }
    }
}

declare module 'express-session' {
    interface SessionData {
        passport?: {
            user: string;
        };
    }
}

export {};

