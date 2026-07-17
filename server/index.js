import express from 'express';
import { normalizeTodo, readTodos, writeTodos } from './todos.js';

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

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT} (tags: enabled)`);
});
