import { env } from "@better-t-app/env/server";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as schema from "./schema";

export * from "./schema";

export function createDb() {
  const client = createClient({
    url: env.DATABASE_URL,
  });

  return drizzle({ client, schema });
}

export const db = createDb();

export async function runMigrations() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "migrations"),
  });
}
