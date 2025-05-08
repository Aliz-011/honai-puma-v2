import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import fmc from "@/modules/fmc/route"
import revenueGross from "@/modules/revenue-gross/route"
import newSales from "@/modules/new-sales/route"
import cvm from "@/modules/cvm/route"
import redeemPv from "@/modules/redeem-pv/route"
import areas from "@/modules/areas/route"
import { HTTPException } from "hono/http-exception";

const app = new Hono().basePath('/api')

app.use(logger());
app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }

    return c.json({ error: err.message }, 500)
})

const routes = app
    .route('/', areas)
    .route('/', fmc)
    .route('/', revenueGross)
    .route('/', newSales)
    .route('/', cvm)
    .route('/', redeemPv)

export const GET = handle(app);
export const POST = handle(app)

export type AppType = typeof routes;