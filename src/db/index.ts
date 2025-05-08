import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from './schema/v_honai_puma';
import * as schema2 from './schema/puma_2025';
import * as schema3 from './schema/household';
import * as schema4 from './schema/multidim';
import * as schema5 from './schema/zz_wisnu';
import * as authSchema from './schema/auth'

const authConnection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'db_auth'
})

const poolConnection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'v_honai_puma'
})

const poolConnection2 = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'puma_2025'
})

const poolConnection3 = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'household',
})

const poolConnection4 = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'multidim',
})

const poolConnection5 = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'zz_wisnu',
})

export const dbAuth = drizzle({ client: authConnection, mode: 'default', schema: authSchema });
export const db = drizzle({ client: poolConnection, mode: 'default', schema })
export const db2 = drizzle({ client: poolConnection2, mode: 'default', schema: schema2 })
export const db3 = drizzle({ client: poolConnection3, mode: 'default', schema: schema3 })
export const db4 = drizzle({ client: poolConnection4, mode: 'default', schema: schema4 })
export const db5 = drizzle({ client: poolConnection5, mode: 'default', schema: schema5 })
