import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { readProjects } from './projects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TODOS_FILE = path.join(__dirname, '..', 'todos.md');

const TASK_LINE =
  /^- \[( |x)\] (.+?)(?: <!-- (.+?) -->)?\s*$/;

const SYSTEM_SECTIONS = new Map([
  ['# Inbox', 'inbox'],
  ['# Today', 'today'],
  ['# Scheduled', 'scheduled'],
  ['# Trash', 'trash'],
  ['# Projects', 'projects'],
]);

function slugifyProjectName(name) {
  const slug = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'project';
}

function parseMetadata(comment) {
  const metadata = {};

  if (!comment) return metadata;

  const idMatch = comment.match(/id:(\d+)/);
  if (idMatch) metadata.id = parseInt(idMatch[1], 10);

  const listMatch = comment.match(/list:([\w:-]+)/);
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

function getTodayIso() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function normalizeTodo(todo) {
  const normalized = {
    id: todo.id,
    text: String(todo.text || '').trim(),
    done: Boolean(todo.done),
    list: todo.list || 'inbox',
    scheduledDate: normalizeIsoDate(todo.scheduledDate),
    dueDate: normalizeIsoDate(todo.dueDate),
    tags: Array.isArray(todo.tags) ? todo.tags : [],
  };

  if (normalized.list === 'trash' || normalized.list.startsWith('project:')) {
    return normalized;
  }

  const todayIso = getTodayIso();

  if (
    normalized.scheduledDate === todayIso ||
    (normalized.dueDate && normalized.dueDate <= todayIso)
  ) {
    normalized.list = 'today';
  }

  return normalized;
}

export { normalizeTodo };

function listFromSection(section, projectSlug) {
  if (section === 'today') return 'today';
  if (section === 'trash') return 'trash';
  if (section === 'project' && projectSlug) {
    return `project:${projectSlug}`;
  }
  return 'inbox';
}

function classifyTaskForWrite(todo, todayIso) {
  const normalized = normalizeTodo(todo);

  if (normalized.list === 'trash') return 'trash';
  if (normalized.list.startsWith('project:')) return 'project';
  if (normalized.list === 'today') return 'today';
  if (normalized.scheduledDate && normalized.scheduledDate > todayIso) {
    return 'scheduled';
  }
  return 'inbox';
}

function formatTaskLine(todo) {
  const normalized = normalizeTodo(todo);
  const checkbox = normalized.done ? 'x' : ' ';
  const parts = [`id:${normalized.id}`];

  if (normalized.scheduledDate) {
    parts.push(`schedule:${normalized.scheduledDate}`);
  }
  if (normalized.dueDate) {
    parts.push(`due:${normalized.dueDate}`);
  }
  if (normalized.tags.length > 0) {
    parts.push(`tags:${normalized.tags.join(',')}`);
  }

  return `- [${checkbox}] ${normalized.text} <!-- ${parts.join(' ')} -->`;
}

function hasSectionStructure(content) {
  return /^# (Inbox|Today|Scheduled|Trash|Projects)\s*$/m.test(content);
}

function assignTodoId(metadata, seenIds, nextId) {
  let id = metadata.id ?? null;

  if (!id || seenIds.has(id)) {
    id = nextId;
  }
  while (seenIds.has(id)) {
    id += 1;
  }

  seenIds.add(id);
  return id;
}

function readTodosLegacy(content) {
  const todos = [];
  const seenIds = new Set();
  let nextId = 1;

  for (const line of content.split('\n')) {
    const match = line.match(TASK_LINE);
    if (!match) continue;

    const done = match[1] === 'x';
    const text = match[2].trim();
    const metadata = parseMetadata(match[3]);
    const id = assignTodoId(metadata, seenIds, nextId);
    nextId = Math.max(nextId, id + 1);

    todos.push(
      normalizeTodo({
        id,
        text,
        done,
        list: metadata.list || 'inbox',
        scheduledDate: metadata.scheduledDate || null,
        dueDate: metadata.dueDate || null,
        tags: metadata.tags || [],
      }),
    );
  }

  return todos;
}

async function readTodosStructured(content) {
  const projects = await readProjects();
  const nameToSlug = new Map(projects.map((project) => [project.name, project.slug]));
  const todos = [];
  const seenIds = new Set();
  let nextId = 1;
  let section = 'inbox';
  let projectSlug = null;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    if (SYSTEM_SECTIONS.has(trimmed)) {
      section = SYSTEM_SECTIONS.get(trimmed);
      projectSlug = null;
      continue;
    }

    if (section === 'projects' && trimmed.startsWith('## ')) {
      const projectName = trimmed.slice(3).trim();
      projectSlug =
        nameToSlug.get(projectName) || slugifyProjectName(projectName);
      section = 'project';
      continue;
    }

    const match = line.match(TASK_LINE);
    if (!match) continue;

    const done = match[1] === 'x';
    const text = match[2].trim();
    const metadata = parseMetadata(match[3]);
    const id = assignTodoId(metadata, seenIds, nextId);
    nextId = Math.max(nextId, id + 1);

    todos.push(
      normalizeTodo({
        id,
        text,
        done,
        list: listFromSection(section, projectSlug),
        scheduledDate: metadata.scheduledDate || null,
        dueDate: metadata.dueDate || null,
        tags: metadata.tags || [],
      }),
    );
  }

  return todos;
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

  if (!hasSectionStructure(content)) {
    return readTodosLegacy(content);
  }

  return readTodosStructured(content);
}

export async function writeTodos(todos) {
  const projects = await readProjects();
  const todayIso = getTodayIso();
  const normalized = todos.map(normalizeTodo);
  const groups = {
    inbox: [],
    today: [],
    scheduled: [],
    trash: [],
    projects: new Map(),
  };

  for (const todo of normalized) {
    const bucket = classifyTaskForWrite(todo, todayIso);

    if (bucket === 'project') {
      const slug = todo.list.slice('project:'.length);
      if (!groups.projects.has(slug)) {
        groups.projects.set(slug, []);
      }
      groups.projects.get(slug).push(todo);
      continue;
    }

    groups[bucket].push(todo);
  }

  const lines = [];

  function appendSection(title, sectionTasks) {
    lines.push(title, '');
    for (const task of sectionTasks) {
      lines.push(formatTaskLine(task));
    }
    lines.push('');
  }

  appendSection('# Inbox', groups.inbox);
  appendSection('# Today', groups.today);
  appendSection('# Scheduled', groups.scheduled);
  appendSection('# Trash', groups.trash);

  lines.push('# Projects', '');

  const writtenSlugs = new Set();

  for (const project of projects) {
    writtenSlugs.add(project.slug);
    lines.push(`## ${project.name}`, '');
    for (const task of groups.projects.get(project.slug) || []) {
      lines.push(formatTaskLine(task));
    }
    lines.push('');
  }

  for (const [slug, sectionTasks] of groups.projects) {
    if (writtenSlugs.has(slug)) continue;
    lines.push(`## ${slug}`, '');
    for (const task of sectionTasks) {
      lines.push(formatTaskLine(task));
    }
    lines.push('');
  }

  await fs.writeFile(TODOS_FILE, `${lines.join('\n').trimEnd()}\n`, 'utf-8');
}
