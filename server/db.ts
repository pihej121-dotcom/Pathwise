import pkg from "pg";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Railway
});

export const db = drizzle(pool);
