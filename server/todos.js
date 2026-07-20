import fs from 'fs/promises';
import { LEGACY_PROJECTS_FILE, TODOS_FILE } from './paths.js';

const TASK_LINE =
  /^- \[( |x)\] (.+?)(?: <!-- (.+?) -->)?\s*$/;

const PROJECT_HEADER =
  /^## (.+?)(?: <!-- (.+?) -->)?\s*$/;

const LEGACY_PROJECT_LINE = /^- (.+?)(?: <!-- (.+?) -->)?\s*$/;

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

function parseTaskMetadata(comment) {
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

function parseProjectMetadata(comment) {
  const metadata = {};

  if (!comment) return metadata;

  const idMatch = comment.match(/id:(\d+)/);
  if (idMatch) metadata.id = parseInt(idMatch[1], 10);

  const slugMatch = comment.match(/slug:([\w-]+)/);
  if (slugMatch) metadata.slug = slugMatch[1];

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

function normalizeProject(project) {
  const name = String(project.name || '').trim();
  return {
    id: project.id,
    name,
    slug: project.slug || slugifyProjectName(name),
  };
}

export { normalizeProject, normalizeTodo };

function assignId(metadata, seenIds, nextId) {
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

function hasSectionStructure(content) {
  return /^# (Inbox|Today|Scheduled|Trash|Projects)\s*$/m.test(content);
}

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

function formatProjectHeader(project) {
  const normalized = normalizeProject(project);
  return `## ${normalized.name} <!-- id:${normalized.id} slug:${normalized.slug} -->`;
}

function parseLegacyProjectsMd(content) {
  const projects = [];
  const seenIds = new Set();
  let nextId = 1;

  for (const line of content.split('\n')) {
    const match = line.match(LEGACY_PROJECT_LINE);
    if (!match) continue;

    const name = match[1].trim();
    const metadata = parseProjectMetadata(match[2]);
    const id = assignId(metadata, seenIds, nextId);
    nextId = Math.max(nextId, id + 1);

    projects.push(
      normalizeProject({
        id,
        name,
        slug: metadata.slug || slugifyProjectName(name),
      }),
    );
  }

  return projects;
}

function parseProjectsFromContent(content) {
  const projects = [];
  const seenIds = new Set();
  let nextId = 1;
  let inProjectsSection = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    if (trimmed === '# Projects') {
      inProjectsSection = true;
      continue;
    }

    if (!inProjectsSection) continue;

    const match = trimmed.match(PROJECT_HEADER);
    if (!match) continue;

    const name = match[1].trim();
    const metadata = parseProjectMetadata(match[2]);
    const id = assignId(metadata, seenIds, nextId);
    nextId = Math.max(nextId, id + 1);

    projects.push(
      normalizeProject({
        id,
        name,
        slug: metadata.slug || slugifyProjectName(name),
      }),
    );
  }

  return projects;
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
    const metadata = parseTaskMetadata(match[3]);
    const id = assignId(metadata, seenIds, nextId);
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

function readTodosStructured(content) {
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
      const match = trimmed.match(PROJECT_HEADER);
      if (!match) continue;

      const projectName = match[1].trim();
      const metadata = parseProjectMetadata(match[2]);
      projectSlug = metadata.slug || slugifyProjectName(projectName);
      section = 'project';
      continue;
    }

    const match = line.match(TASK_LINE);
    if (!match) continue;

    const done = match[1] === 'x';
    const text = match[2].trim();
    const metadata = parseTaskMetadata(match[3]);
    const id = assignId(metadata, seenIds, nextId);
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

function parseTodosFromContent(content) {
  if (!hasSectionStructure(content)) {
    return readTodosLegacy(content);
  }

  return readTodosStructured(content);
}

async function writeTodosFile(todos, projects) {
  const todayIso = getTodayIso();
  const normalized = todos.map(normalizeTodo);
  const normalizedProjects = projects.map(normalizeProject);
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

  for (const project of normalizedProjects) {
    writtenSlugs.add(project.slug);
    lines.push(formatProjectHeader(project), '');
    for (const task of groups.projects.get(project.slug) || []) {
      lines.push(formatTaskLine(task));
    }
    lines.push('');
  }

  for (const [slug, sectionTasks] of groups.projects) {
    if (writtenSlugs.has(slug)) continue;
    lines.push(`## ${slug} <!-- slug:${slug} -->`, '');
    for (const task of sectionTasks) {
      lines.push(formatTaskLine(task));
    }
    lines.push('');
  }

  await fs.writeFile(TODOS_FILE, `${lines.join('\n').trimEnd()}\n`, 'utf-8');
}

async function migrateLegacyProjectsFile(content) {
  let legacyContent;

  try {
    legacyContent = await fs.readFile(LEGACY_PROJECTS_FILE, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') return content;
    throw err;
  }

  const legacyProjects = parseLegacyProjectsMd(legacyContent);
  const projects = hasSectionStructure(content)
    ? parseProjectsFromContent(content)
    : [];
  const existingSlugs = new Set(projects.map((project) => project.slug));
  const merged = [...projects];

  for (const project of legacyProjects) {
    if (!existingSlugs.has(project.slug)) {
      merged.push(project);
      existingSlugs.add(project.slug);
    }
  }

  const todos = parseTodosFromContent(content);
  await writeTodosFile(todos, merged);
  await fs.unlink(LEGACY_PROJECTS_FILE);

  return fs.readFile(TODOS_FILE, 'utf-8');
}

async function readTodosContent() {
  let content;

  try {
    content = await fs.readFile(TODOS_FILE, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeTodosFile([], []);
      return fs.readFile(TODOS_FILE, 'utf-8');
    }
    throw err;
  }

  return migrateLegacyProjectsFile(content);
}

export async function readProjects() {
  const content = await readTodosContent();
  return hasSectionStructure(content)
    ? parseProjectsFromContent(content)
    : [];
}

export async function readTodos() {
  const content = await readTodosContent();
  return parseTodosFromContent(content);
}

export async function writeTodos(todos) {
  const content = await readTodosContent();
  const projects = hasSectionStructure(content)
    ? parseProjectsFromContent(content)
    : [];
  await writeTodosFile(todos, projects);
}

export async function writeProjects(projects) {
  const content = await readTodosContent();
  const todos = parseTodosFromContent(content);
  await writeTodosFile(todos, projects);
}
