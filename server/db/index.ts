import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"
import * as schema from "./schema"
import { resolve } from "path"
import { mkdirSync } from "fs"

const dataDir = resolve(process.cwd(), "data")
mkdirSync(dataDir, { recursive: true })

const dbPath = resolve(dataDir, "khadamati.db")
const sqlite = new Database(dbPath)

// Performance pragmas for SQLite
sqlite.run("PRAGMA journal_mode = WAL")
sqlite.run("PRAGMA foreign_keys = ON")

export const db = drizzle(sqlite, { schema })
export { schema }
export type DB = typeof db
