import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_FILE = path.join(__dirname, '..', 'projects.md');

const PROJECT_LINE = /^- (.+?)(?: <!-- (.+?) -->)?\s*$/;

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

  const slugMatch = comment.match(/slug:([\w-]+)/);
  if (slugMatch) metadata.slug = slugMatch[1];

  return metadata;
}

function normalizeProject(project) {
  const name = String(project.name || '').trim();
  return {
    id: project.id,
    name,
    slug: project.slug || slugifyProjectName(name),
  };
}

export { normalizeProject };

function formatMetadata(project) {
  const normalized = normalizeProject(project);
  return ` <!-- id:${normalized.id} slug:${normalized.slug} -->`;
}

export async function readProjects() {
  let content;

  try {
    content = await fs.readFile(PROJECTS_FILE, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeProjects([]);
      return [];
    }
    throw err;
  }

  const projects = [];
  const seenIds = new Set();
  let nextId = 1;

  for (const line of content.split('\n')) {
    const match = line.match(PROJECT_LINE);
    if (!match) continue;

    const name = match[1].trim();
    const metadata = parseMetadata(match[2]);
    let id = metadata.id ?? null;

    if (!id || seenIds.has(id)) {
      id = nextId;
    }
    while (seenIds.has(id)) {
      id += 1;
    }

    seenIds.add(id);
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

export async function writeProjects(projects) {
  const lines = ['# Projects', ''];

  for (const project of projects) {
    const normalized = normalizeProject(project);
    lines.push(`- ${normalized.name}${formatMetadata(normalized)}`);
  }

  lines.push('');
  await fs.writeFile(PROJECTS_FILE, lines.join('\n'), 'utf-8');
}
