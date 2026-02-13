import { drizzle } from "drizzle-orm/libsql";
import { turso } from "./client";
import * as schema from "./schema";

export const db = drizzle(turso, { schema });

export * from "./schema";
