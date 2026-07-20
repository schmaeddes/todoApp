import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeSettings, readSettings, writeSettings } from './config.js';
import { ensureDataDir, getDataDir } from './paths.js';
import {
  normalizeProject,
  normalizeTodo,
  readProjects,
  readTodos,
  writeProjects,
  writeTodos,
} from './todos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const distDir = path.join(__dirname, '..', 'dist');

app.use(express.json());

app.get('/api/todos', async (_req, res) => {
  try {
    res.json(await readTodos());
  } catch {
    res.status(500).json({ error: 'Failed to read todos' });
  }
});

app.put('/api/todos', async (req, res) => {
  const todos = req.body;

  if (!Array.isArray(todos)) {
    res.status(400).json({ error: 'Expected an array of todos' });
    return;
  }

  try {
    const normalized = todos.map(normalizeTodo);
    await writeTodos(normalized);
    res.json(normalized);
  } catch {
    res.status(500).json({ error: 'Failed to write todos' });
  }
});

app.get('/api/projects', async (_req, res) => {
  try {
    res.json(await readProjects());
  } catch {
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

app.put('/api/projects', async (req, res) => {
  const projects = req.body;

  if (!Array.isArray(projects)) {
    res.status(400).json({ error: 'Expected an array of projects' });
    return;
  }

  try {
    const normalized = projects.map(normalizeProject);
    await writeProjects(normalized);
    res.json(normalized);
  } catch {
    res.status(500).json({ error: 'Failed to write projects' });
  }
});

app.get('/api/settings', async (_req, res) => {
  try {
    res.json(await readSettings());
  } catch {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Expected a settings object' });
    return;
  }

  try {
    const normalized = normalizeSettings(req.body);
    await writeSettings(normalized);
    res.json(normalized);
  } catch {
    res.status(500).json({ error: 'Failed to write settings' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

async function start() {
  await ensureDataDir();

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Data directory: ${getDataDir()}`);
  });
}

start();
