const PROJECT_LIST_PREFIX = 'project:';

export function slugifyProjectName(name) {
  const slug = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'project';
}

export function createUniqueProjectSlug(name, projects) {
  const base = slugifyProjectName(name);
  const usedSlugs = new Set(projects.map((project) => project.slug));
  let slug = base;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export function normalizeProject(project) {
  return {
    id: project.id,
    name: String(project.name || '').trim(),
    slug: project.slug || slugifyProjectName(project.name),
  };
}

export function toProjectList(slug) {
  return `${PROJECT_LIST_PREFIX}${slug}`;
}

export function isProjectList(list) {
  return typeof list === 'string' && list.startsWith(PROJECT_LIST_PREFIX);
}

export function getProjectSlugFromList(list) {
  return isProjectList(list) ? list.slice(PROJECT_LIST_PREFIX.length) : null;
}

export function getProjectTaskCount(tasks, slug) {
  const list = toProjectList(slug);
  return tasks.filter((task) => task.list === list).length;
}

export function prependProjectNameToTaskText(projectName, taskText) {
  const prefix = `[${projectName}] `;
  if (taskText.startsWith(prefix)) {
    return taskText;
  }
  return `${prefix}${taskText}`;
}

export function getListLabel(list, projects = []) {
  if (list === 'inbox') return 'Inbox';
  if (list === 'today') return 'Today';

  if (isProjectList(list)) {
    const slug = getProjectSlugFromList(list);
    const project = projects.find((item) => item.slug === slug);
    return project?.name || 'Project';
  }

  return 'Inbox';
}
