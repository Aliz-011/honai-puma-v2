import { db2 } from "@/db";
import { Hono } from "hono";

const app = new Hono()
    .get('/areas', async c => {
        const areas = await db2.query.regionals.findMany({
            with: {
                branches: {
                    with: {
                        subbranches: {
                            with: {
                                clusters: {
                                    with: {
                                        kabupatens: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        return c.json({ data: areas })
    })
    .get('/fmc-areas', async c => {
        const areas = await db2.query.regionals.findMany({
            with: {
                branches: {
                    with: {
                        woks: {
                            with: {
                                stos: true
                            }
                        }
                    }
                }
            }
        })

        return c.json({ data: areas })
    })

export default app