// Tiny file-based database. No native modules to compile (keeps `npm install`
// painless on any machine), no external DB server to run. It stores everything
// in server/data/db.json as plain JSON.
//
// This is intentionally simple for a graduation project. If this ever needs to
// handle real concurrent traffic at scale, swap this file for a real database
// (Postgres, SQLite via better-sqlite3, etc.) — every other file only talks to
// the small `db.readDb()` / `db.mutate()` API below, so the swap is contained
// to this one file.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
}

function readDb() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { users: [] };
  }
}

function writeDb(data) {
  ensureFile();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Serializes writes so two requests landing at the same instant can't clobber
// each other's changes (there's no real transaction support in a JSON file).
let queue = Promise.resolve();
function mutate(fn) {
  const run = queue.then(() => {
    const data = readDb();
    const result = fn(data);
    writeDb(data);
    return result;
  });
  // Keep the chain alive even if this particular mutation throws.
  queue = run.catch(() => {});
  return run;
}

export const db = { readDb, mutate };
