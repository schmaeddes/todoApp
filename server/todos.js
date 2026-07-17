import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TODOS_FILE = path.join(__dirname, '..', 'todos.md');

const TASK_LINE =
  /^- \[( |x)\] (.+?)(?: <!-- (.+?) -->)?\s*$/;

function parseMetadata(comment) {
  const metadata = {};

  if (!comment) return metadata;

  const idMatch = comment.match(/id:(\d+)/);
  if (idMatch) metadata.id = parseInt(idMatch[1], 10);

  const listMatch = comment.match(/list:(\w+)/);
  if (listMatch) metadata.list = listMatch[1];

  const scheduleMatch = comment.match(/schedule:(\d{4}-\d{2}-\d{2})/);
  if (scheduleMatch) metadata.scheduledDate = scheduleMatch[1];

  const dueMatch = comment.match(/due:(\d{4}-\d{2}-\d{2})/);
  if (dueMatch) metadata.dueDate = dueMatch[1];

  const tagsMatch = comment.match(/tags:([\w,-]+)/);
  if (tagsMatch) {
    metadata.tags = tagsMatch[1].split(',').filter(Boolean);
  }

  return metadata;
}

function normalizeIsoDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function normalizeTodo(todo) {
  return {
    id: todo.id,
    text: String(todo.text || '').trim(),
    done: Boolean(todo.done),
    list: todo.list || 'inbox',
    scheduledDate: normalizeIsoDate(todo.scheduledDate),
    dueDate: normalizeIsoDate(todo.dueDate),
    tags: Array.isArray(todo.tags) ? todo.tags : [],
  };
}

export { normalizeTodo };

function formatMetadata(todo) {
  const normalized = normalizeTodo(todo);
  const parts = [
    `id:${normalized.id}`,
    `list:${normalized.list}`,
  ];

  if (normalized.scheduledDate) {
    parts.push(`schedule:${normalized.scheduledDate}`);
  }
  if (normalized.dueDate) {
    parts.push(`due:${normalized.dueDate}`);
  }
  if (normalized.tags.length > 0) {
    parts.push(`tags:${normalized.tags.join(',')}`);
  }

  return ` <!-- ${parts.join(' ')} -->`;
}

export async function readTodos() {
  let content;

  try {
    content = await fs.readFile(TODOS_FILE, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeTodos([]);
      return [];
    }
    throw err;
  }

  const todos = [];
  const seenIds = new Set();
  let nextId = 1;

  for (const line of content.split('\n')) {
    const match = line.match(TASK_LINE);
    if (!match) continue;

    const done = match[1] === 'x';
    const text = match[2].trim();
    const metadata = parseMetadata(match[3]);
    let id = metadata.id ?? null;

    if (!id || seenIds.has(id)) {
      id = nextId;
    }
    while (seenIds.has(id)) {
      id += 1;
    }

    seenIds.add(id);
    nextId = Math.max(nextId, id + 1);
    todos.push(normalizeTodo({
      id,
      text,
      done,
      list: metadata.list || 'inbox',
      scheduledDate: metadata.scheduledDate || null,
      dueDate: metadata.dueDate || null,
      tags: metadata.tags || [],
    }));
  }

  return todos;
}

export async function writeTodos(todos) {
  const lines = ['# Todos', ''];

  for (const todo of todos) {
    const normalized = normalizeTodo(todo);
    const checkbox = normalized.done ? 'x' : ' ';
    lines.push(`- [${checkbox}] ${normalized.text}${formatMetadata(normalized)}`);
  }

  lines.push('');
  await fs.writeFile(TODOS_FILE, lines.join('\n'), 'utf-8');
}
