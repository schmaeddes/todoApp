import express from 'express';
import { normalizeSettings, readSettings, writeSettings } from './config.js';
import {
  normalizeProject,
  normalizeTodo,
  readProjects,
  readTodos,
  writeProjects,
  writeTodos,
} from './todos.js';

const app = express();
const PORT = 3001;

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT} (tags: enabled)`);
});
