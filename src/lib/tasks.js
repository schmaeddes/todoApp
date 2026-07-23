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

export function getTodayTasks(tasks) {
  return tasks.filter((task) => task.list === 'today');
}

export function getVisibleTasks(tasks, activeView, activeProject = null) {
  const today = toIsoDate(new Date());
  let visible;

  switch (activeView) {
    case 'trash':
      visible = tasks.filter((task) => task.list === 'trash');
      break;
    case 'scheduled':
      visible = tasks.filter(
        (task) =>
          task.list !== 'trash' &&
          !isProjectList(task.list) &&
          task.scheduledDate &&
          task.scheduledDate > today,
      );
      break;
    case 'sometime':
      visible = tasks.filter(
        (task) =>
          task.list === 'sometime' &&
          (!task.scheduledDate || task.scheduledDate <= today),
      );
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
