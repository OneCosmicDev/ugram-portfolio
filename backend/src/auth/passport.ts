import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { prisma } from '../prisma';
import { publicUserSelect } from './publicUser';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

function normalizeUsername(value: string): string {
    const normalized = value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);

    return normalized || 'user';
}

async function buildUniqueUsername(base: string): Promise<string> {
    let username = base;
    let suffix = 1;

    while (await prisma.user.findUnique({ where: { username } })) {
        const suffixText = `${suffix}`;
        const trimmedBase = base.slice(0, Math.max(1, 20 - suffixText.length));
        username = `${trimmedBase}${suffixText}`;
        suffix += 1;
    }

    return username;
}

export function configurePassport() {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
                select: publicUserSelect,
            });

            done(null, user ?? false);
        } catch (error) {
            done(error);
        }
    });

    if (!googleClientId || !googleClientSecret) {
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: `${backendUrl}/auth/google/callback`,
            },
            async (
                _accessToken: string,
                _refreshToken: string,
                profile: Profile,
                done: VerifyCallback
            ) => {
                try {
                    const email = profile.emails?.[0]?.value;

                    if (!email) {
                        return done(new Error('Google account did not provide an email address.'));
                    }

                    const avatar = profile.photos?.[0]?.value ?? null;
                    const firstName = profile.name?.givenName ?? null;
                    const lastName = profile.name?.familyName ?? null;

                    const existingByGoogleId = await prisma.user.findUnique({
                        where: { googleId: profile.id },
                        select: publicUserSelect,
                    });

                    if (existingByGoogleId) {
                        return done(null, existingByGoogleId);
                    }

                    const existingByEmail = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (existingByEmail) {
                        const linkedUser = await prisma.user.update({
                            where: { id: existingByEmail.id },
                            data: {
                                googleId: profile.id,
                                firstName: existingByEmail.firstName ?? firstName,
                                lastName: existingByEmail.lastName ?? lastName,
                                avatar: existingByEmail.avatar ?? avatar,
                            },
                            select: publicUserSelect,
                        });

                        return done(null, linkedUser);
                    }

                    const emailHandle = email.split('@')[0] || profile.displayName || 'user';
                    const baseUsername = normalizeUsername(emailHandle);
                    const username = await buildUniqueUsername(baseUsername);

                    const createdUser = await prisma.user.create({
                        data: {
                            googleId: profile.id,
                            email,
                            username,
                            password: null,
                            firstName,
                            lastName,
                            avatar,
                        },
                        select: publicUserSelect,
                    });

                    return done(null, createdUser);
                } catch (error) {
                    return done(error as Error);
                }
            }
        )
    );
}

export default passport;

