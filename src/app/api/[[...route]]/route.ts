import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { csrf } from 'hono/csrf'
import { zValidator } from "@/lib/validator-wrapper";
import { z } from 'zod'
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import fmc from "@/modules/fmc/route"
import revenueGross from "@/modules/revenue-gross/route"
import newSales from "@/modules/new-sales/route"
import cvm from "@/modules/cvm/route"
import redeemPv from "@/modules/redeem-pv/route"
import areas from "@/modules/areas/route"
import sa from '@/modules/sa/route'
import so from '@/modules/so/route'
import payingSubs from '@/modules/paying-subs/route'
import IOREPS from '@/modules/household/route'

import { auth } from "@/lib/auth";
import { dbAuth } from "@/db";
import { accounts, users } from "@/db/schema/auth";

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}>();

app.use(logger());
app.use(
    "/*",
    cors({
        origin: [process.env.NEXT_PUBLIC_APP_URL || '', 'http://localhost:3000'],
        allowMethods: ["GET", "POST", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
)

app.use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        c.set("user", null);
        c.set("session", null);
        return await next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return await next();
});
app.use(csrf())

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }

    return c.json({ error: err.message }, 500)
})

const routes = app
    .basePath('/api')
    .post('/signin',
        zValidator('json', z.object({
            username: z.string().trim().min(1, 'Please enter your username'),
            password: z.string().min(1, "Please enter your password"),
        })),
        async c => {
            const { password, username } = c.req.valid('json')
            await auth.api.signInUsername({
                headers: c.req.raw.headers,
                body: {
                    username,
                    password,
                },
            });

            return c.json(null, 200)
        })
    .post('/signup',
        zValidator('json', z.object({
            name: z.string().min(2, "Name must be at least 2 characters"),
            username: z.string()
                .min(6, "Username must be at least 6 characters")
                .max(20, "Username cannot exceed 20 characters")
                .regex(
                    /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9_]+$/,
                    "Username must contain at least one letter and one number, and can only include letters, numbers, and underscores"
                ),
            email: z.string().email("Invalid email address"),
            password: z.string()
                .min(8, "Password must be at least 8 characters")
                .max(30, "Password cannot exceed 30 characters")
                .regex(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
                    "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
                )
        })
        ), async c => {
            const { email, name, password, username } = c.req.valid('json')

            await auth.api.signUpEmail({
                headers: c.req.raw.headers,
                body: {
                    email,
                    name,
                    password,
                    username
                }
            })

            return c.json(null, 200)
        })
    .post('/signout', async c => {
        const session = c.get('session')

        if (!session) {
            throw new HTTPException(403, { res: c.json({ message: 'Unauthorized' }) })
        }

        await auth.api.signOut({
            headers: c.req.raw.headers,
        });

        return c.json(null, 200)
    })
    .post('/update-password', zValidator('json', z.object({
        oldPassword: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters")
            .max(30, "Password cannot exceed 30 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
                "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
            )
    })),
        async c => {
            const session = c.get('session')
            if (!session) {
                throw new HTTPException(401, { res: c.json({ message: 'Unauthorized' }) })
            }

            const { newPassword, oldPassword } = c.req.valid('json')
            const ctx = await auth.$context

            const [userAccount] = await dbAuth.select({ password: accounts.password }).from(accounts).where(eq(accounts.userId, session.userId))

            if (!userAccount.password) {
                throw new HTTPException(401, { res: c.json({ message: 'Unauthorized' }) })
            }

            const checkPassword = await ctx.password.verify({ hash: userAccount.password, password: oldPassword })

            if (!checkPassword) {
                throw new HTTPException(405, { res: c.json({ message: 'Old password do not matches' }) })
            }

            const hash = await ctx.password.hash(newPassword)
            await ctx.internalAdapter.updatePassword(session.userId, hash)

            return c.json({ message: 'Password updated successfully' }, 200);
        })
    .post('/update-profile', zValidator('json', z.object({
        nik: z
            .string()
            .min(5, { message: 'NIK must be at least 5 digits' })
            .max(8)
            .trim()
            .regex(/^\d+$/, { message: "NIK must contain only numbers" }),
        phoneNumber: z
            .string()
            .min(11, { message: 'Phone number must be at least 11 digits' })
            .max(13)
            .trim()
            .regex(/^\d+$/, { message: "Phone number must contain only numbers" })
    })),
        async c => {
            const session = c.get('session')

            if (!session) {
                throw new HTTPException(401, { message: 'Unauthorized' });
            }

            const { nik, phoneNumber } = c.req.valid('json')


            const result = await dbAuth.update(users).set({
                nik,
                phoneNumber
            }).where(eq(users.id, session.userId))

            let updatedCount = 0;
            // Assuming dbAuth.update returns an object with a 'count' property for affected rows
            if (typeof result === 'object' && result !== null && 'count' in result) {
                updatedCount = (result as { count: number }).count;
            } else if (Array.isArray(result)) {
                updatedCount = result.length;
            } else {
                if (!result || (typeof result === 'object' && 'count' in result && (result as { count: number }).count === 0)) {
                    throw new HTTPException(404, { message: 'User not found or profile already up to date' });
                }
                updatedCount = 1;
            }

            if (updatedCount === 0) {
                throw new HTTPException(404, { message: 'User profile not found' });
            }

            return c.json({ message: 'Profile updated successfully' }, 200);
        })
    .route('/', areas)
    .route('/', fmc)
    .route('/', revenueGross)
    .route('/', newSales)
    .route('/', cvm)
    .route('/', redeemPv)
    .route('/', sa)
    .route('/', so)
    .route('/', payingSubs)
    .route('/', IOREPS)

export const GET = handle(app);
export const POST = handle(app)

export type AppType = typeof routes;