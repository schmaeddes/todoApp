import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

function resolveDataDir() {
  const envDir = process.env.DATA_DIR?.trim();

  if (envDir) {
    return path.resolve(envDir);
  }

  return PROJECT_ROOT;
}

const DATA_DIR = resolveDataDir();

export const TODOS_FILE = path.join(DATA_DIR, 'todos.md');
export const CONFIG_FILE = path.join(DATA_DIR, 'config.yaml');
export const LEGACY_PROJECTS_FILE = path.join(PROJECT_ROOT, 'projects.md');
export const PROJECT_ROOT_DIR = PROJECT_ROOT;

export function getDataDir() {
  return DATA_DIR;
}

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}
