import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from 'zod'
import { HTTPException } from "hono/http-exception";
import { authHandler, initAuthConfig, verifyAuth } from '@hono/auth-js'
import Credentials from '@auth/core/providers/credentials'
import ldap from 'ldapjs';

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

const app = new Hono();

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

// BETTER-AUTH MIDDLEWARE
// app.use("*", async (c, next) => {
//     const session = await auth.api.getSession({ headers: c.req.raw.headers });

//     if (!session) {
//         c.set("user", null);
//         c.set("session", null);
//         return await next();
//     }

//     c.set("user", session.user);
//     c.set("session", session.session);
//     return await next();
// });

const loginSchema = z.object({
    username: z.string().trim().min(1, 'Please enter your username'),
    password: z.string().min(1, "Please enter your password"),
})

// NEXT-AUTH CONFIG
app.use(
    '*',
    initAuthConfig((c) => ({
        secret: process.env.AUTH_SECRET,
        providers: [
            Credentials({
                name: 'LDAP',
                credentials: {
                    username: { label: "Username", type: "text" },
                    password: { label: "Password", type: "password" },
                },
                async authorize(credentials) {
                    const adServer = process.env.LDAP_URL as string;
                    const domain = process.env.LDAP_DOMAIN as string;

                    const rootDn = process.env.LDAP_BASE_DN as string;
                    const client = ldap.createClient({
                        url: adServer,
                    })

                    // LDAP search for user details
                    const listOus = (process.env.LDAP_SEARCH_OUS as string).split(',')

                    try {
                        const validate = loginSchema.safeParse(credentials);
                        if (!validate.success) return null;

                        const { username, password } = validate.data

                        client.on("error", (err) => {
                            console.error("LDAP connection error:", err);
                            return { message: "LDAP connection failed" }
                        });

                        await new Promise<void>((resolve, reject) => {
                            client.bind(`${username}${domain}`, password, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });

                        let firstName = "";
                        let lastName = "";

                        for (const ou of listOus) {
                            const baseDn = `ou=${ou},${process.env.LDAP_BASE_DN}`;
                            const searchOptions = {
                                filter: `(sAMAccountName=${username})`,
                                scope: "sub" as const,
                                attributes: ["givenName", "sn", "name", "mail"],
                            };

                            const entries = await new Promise<ldap.SearchEntry[]>((resolve, reject) => {
                                client.search(baseDn, searchOptions, (err, res) => {
                                    if (err) {
                                        return reject(err);
                                    }

                                    const entries: ldap.SearchEntry[] = [];
                                    res.on("searchEntry", (entry) => entries.push(entry));
                                    res.on("error", (err) => reject(err));
                                    res.on("end", (result) => {
                                        if (result?.status !== 0) {
                                            return reject(new Error(`LDAP search ended with status: ${result?.status}`));
                                        }
                                        resolve(entries)
                                    });
                                });
                            });

                            console.log(entries);

                            for (const entry of entries) {
                                if (entry.attributes) {
                                    const firstNameAttr = entry.attributes.find((attr) => attr.type === "givenName");
                                    const lastNameAttr = entry.attributes.find((attr) => attr.type === "sn");
                                    if (firstNameAttr && firstNameAttr.values.length > 0) {
                                        firstName = firstNameAttr.values[0];
                                    }
                                    if (lastNameAttr && lastNameAttr.values.length > 0) {
                                        lastName = lastNameAttr.values[0];
                                    }
                                }
                            }

                            if (firstName && lastName) break;
                        }

                        // Unbind LDAP client
                        client.unbind();

                        return {
                            id: username + Date.now(),
                            name: username,
                            email: `${username}${domain}`
                        }
                    } catch (error) {
                        console.error("LDAP authentication error:", error);
                        return null;
                    } finally {
                        client.unbind()
                    }

                },
            })
        ],
        session: {
            strategy: "jwt",
        },
        callbacks: {
            async jwt({ token, user }) {
                if (user) {
                    token.sub = user.id;
                    token.name = user.name
                }
                return token;
            },
            async session({ session, token }) {
                if (token?.username) {
                    // @ts-ignore
                    session.user.name = token.name as string;
                    session.user.id = token.sub as string
                }
                return session;
            },
        },
        pages: {
            signIn: "/login",
        }
    }))
)

// NEXT-AUTH MIDDLEWARE
app.use('/api/auth/*', authHandler())
app.use('/api/*', verifyAuth())

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }

    return c.json({ error: err.message }, 500)
})

const routes = app
    .basePath('/api')
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