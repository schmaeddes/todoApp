import { normalizeTags } from '../tags';
import {
  getProjectSlugFromList,
  isProjectList,
  toProjectList,
} from '../projects';
import {
  getTodayDate,
  getTomorrowDate,
  normalizeIsoDate,
  toIsoDate,
} from './dates';

export function resolveTaskPlacement({ list, scheduledDate, dueDate }) {
  const today = toIsoDate(new Date());
  const schedule = normalizeIsoDate(scheduledDate);
  const due = normalizeIsoDate(dueDate);
  const resolvedList = list || 'inbox';

  if (resolvedList === 'trash' || resolvedList === 'sometime' || isProjectList(resolvedList)) {
    return { list: resolvedList, scheduledDate: schedule };
  }

  if (schedule === today || (due && due <= today)) {
    return { list: 'today', scheduledDate: schedule };
  }

  return { list: resolvedList, scheduledDate: schedule };
}

export function normalizeTask(task) {
  const normalized = {
    id: task.id,
    text: String(task.text || '').trim(),
    done: Boolean(task.done),
    list: task.list || 'inbox',
    scheduledDate: normalizeIsoDate(task.scheduledDate),
    dueDate: normalizeIsoDate(task.dueDate),
    tags: normalizeTags(task.tags),
  };

  return {
    ...normalized,
    ...resolveTaskPlacement(normalized),
  };
}

export function createEmptyTaskMeta() {
  return {
    list: 'inbox',
    scheduledDate: null,
    dueDate: null,
    tags: [],
  };
}

export function createNewTaskMetaForView(activeView, activeProject = null) {
  const meta = createEmptyTaskMeta();

  if (activeView === 'today') {
    meta.list = 'today';
    meta.scheduledDate = getTodayDate();
  } else if (activeView === 'project' && activeProject) {
    meta.list = toProjectList(activeProject.slug);
  } else if (activeView === 'scheduled') {
    meta.scheduledDate = getTomorrowDate();
  } else if (activeView === 'sometime') {
    meta.list = 'sometime';
  }

  return meta;
}

function sortTasksWithDoneLast(tasks) {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      if (a.task.done !== b.task.done) {
        return a.task.done ? 1 : -1;
      }
      return a.index - b.index;
    })
    .map(({ task }) => task);
}

export function classifyProjectTaskTiming(task, today = toIsoDate(new Date())) {
  const schedule = normalizeIsoDate(task.scheduledDate);
  const due = normalizeIsoDate(task.dueDate);

  if (schedule === today || (due && due <= today)) {
    return 'today';
  }

  if (schedule && schedule > today) {
    return 'scheduled';
  }

  return 'sometime';
}

export function getTodayTasks(tasks, today = toIsoDate(new Date())) {
  return tasks.filter((task) => {
    if (task.list === 'trash') {
      return false;
    }

    if (task.list === 'today') {
      return true;
    }

    if (isProjectList(task.list)) {
      return classifyProjectTaskTiming(task, today) === 'today';
    }

    return false;
  });
}

export function getScheduledTasks(tasks, today = toIsoDate(new Date())) {
  return tasks.filter((task) => {
    if (task.list === 'trash') {
      return false;
    }

    if (isProjectList(task.list)) {
      return classifyProjectTaskTiming(task, today) === 'scheduled';
    }

    return Boolean(task.scheduledDate && task.scheduledDate > today);
  });
}

export function getSometimeTasks(tasks, today = toIsoDate(new Date())) {
  return tasks.filter((task) => {
    if (task.list === 'trash') {
      return false;
    }

    if (isProjectList(task.list)) {
      return classifyProjectTaskTiming(task, today) === 'sometime';
    }

    return (
      task.list === 'sometime' &&
      (!task.scheduledDate || task.scheduledDate <= today)
    );
  });
}

export function getVisibleTasks(tasks, activeView, activeProject = null) {
  const today = toIsoDate(new Date());
  let visible;

  switch (activeView) {
    case 'trash':
      visible = tasks.filter((task) => task.list === 'trash');
      break;
    case 'scheduled':
      visible = getScheduledTasks(tasks, today);
      break;
    case 'sometime':
      visible = getSometimeTasks(tasks, today);
      break;
    case 'today':
      visible = getTodayTasks(tasks);
      break;
    case 'project':
      visible = tasks.filter(
        (task) =>
          activeProject &&
          task.list === toProjectList(activeProject.slug),
      );
      break;
    case 'projects':
      visible = [];
      break;
    case 'settings':
      visible = [];
      break;
    case 'inbox':
    default:
      visible = tasks.filter(
        (task) =>
          (task.list || 'inbox') === 'inbox' &&
          !task.scheduledDate &&
          !isProjectList(task.list),
      );
  }

  return sortTasksWithDoneLast(visible);
}

export const PROJECT_TASK_SECTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'sometime', label: 'Sometime' },
];

export function groupProjectTasksByTiming(tasks) {
  const groups = PROJECT_TASK_SECTIONS.map((section) => ({
    ...section,
    tasks: [],
  }));

  for (const task of tasks) {
    const timing = classifyProjectTaskTiming(task);
    const group = groups.find((item) => item.id === timing);
    if (group) {
      group.tasks.push(task);
    }
  }

  return groups
    .map((group) => ({
      ...group,
      tasks: sortTasksWithDoneLast(group.tasks),
    }))
    .filter((group) => group.tasks.length > 0);
}

export function groupStandardAndProjectTasks(tasks, projects = []) {
  const standardTasks = sortTasksWithDoneLast(
    tasks.filter((task) => !isProjectList(task.list)),
  );
  const projectTasksBySlug = new Map();

  for (const task of tasks) {
    if (!isProjectList(task.list)) {
      continue;
    }

    const slug = getProjectSlugFromList(task.list);
    if (!projectTasksBySlug.has(slug)) {
      projectTasksBySlug.set(slug, []);
    }
    projectTasksBySlug.get(slug).push(task);
  }

  const groups = [];

  if (standardTasks.length > 0) {
    groups.push({
      id: 'standard',
      kind: 'standard',
      label: null,
      tasks: standardTasks,
    });
  }

  for (const project of projects) {
    const projectTasks = projectTasksBySlug.get(project.slug);
    if (!projectTasks?.length) {
      continue;
    }

    groups.push({
      id: toProjectList(project.slug),
      kind: 'project',
      label: project.name,
      tasks: sortTasksWithDoneLast(projectTasks),
    });
    projectTasksBySlug.delete(project.slug);
  }

  for (const [slug, projectTasks] of projectTasksBySlug) {
    groups.push({
      id: toProjectList(slug),
      kind: 'project',
      label: slug,
      tasks: sortTasksWithDoneLast(projectTasks),
    });
  }

  return groups;
}

export function getDestinationSelectValue({ list, scheduledDate, dueDate }) {
  if (list === 'today') return 'today';
  if (list === 'sometime') return 'sometime';

  if (isProjectList(list)) {
    return list;
  }

  const today = toIsoDate(new Date());
  const schedule = normalizeIsoDate(scheduledDate);

  if (schedule && schedule > today) {
    return 'scheduled';
  }

  if (schedule === today || (dueDate && normalizeIsoDate(dueDate) <= today)) {
    return 'today';
  }

  return 'inbox';
}

export function getTaskDestinationLabel(task, projects = []) {
  if (task.list === 'trash') return 'Trash';
  if (task.list === 'today') return 'Today';
  if (task.list === 'sometime') return 'Sometime';

  if (isProjectList(task.list)) {
    const slug = getProjectSlugFromList(task.list);
    const project = projects.find((item) => item.slug === slug);
    return project?.name || 'Project';
  }

  const today = toIsoDate(new Date());
  if (task.scheduledDate === today) return 'Today';
  if (task.dueDate && task.dueDate <= today) return 'Today';
  if (task.scheduledDate && task.scheduledDate > today) {
    return 'Scheduled';
  }

  return 'Inbox';
}
