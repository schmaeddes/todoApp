import { normalizeTags } from './tags';

export function toIsoDate(date) {
  if (!date) return null;
  if (typeof date === 'string') {
    return normalizeIsoDate(date);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeIsoDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

export function formatIsoDate(iso) {
  if (!iso) return null;

  const [, month, day] = iso.split('-');
  return `${day.padStart(2, '0')}.${month.padStart(2, '0')}`;
}

export function isOverdue(iso) {
  if (!iso) return false;
  return iso < toIsoDate(new Date());
}

export function resolveTaskPlacement({ list, scheduledDate, dueDate }) {
  const today = toIsoDate(new Date());
  const schedule = normalizeIsoDate(scheduledDate);
  const due = normalizeIsoDate(dueDate);
  const resolvedList = list || 'inbox';

  if (resolvedList === 'trash') {
    return { list: 'trash', scheduledDate: schedule };
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

export function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function parseIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function createNewTaskMetaForView(activeView) {
  const meta = createEmptyTaskMeta();

  if (activeView === 'today') {
    meta.list = 'today';
  } else if (activeView === 'scheduled') {
    meta.scheduledDate = getTodayDate();
  }

  return meta;
}

export function getVisibleTasks(tasks, activeView) {
  const today = toIsoDate(new Date());

  switch (activeView) {
    case 'trash':
      return tasks.filter((task) => task.list === 'trash');
    case 'scheduled':
      return tasks.filter(
        (task) =>
          task.list !== 'trash' &&
          task.scheduledDate &&
          task.scheduledDate > today,
      );
    case 'today':
      return getTodayTasks(tasks);
    case 'inbox':
    default:
      return tasks.filter(
        (task) =>
          (task.list || 'inbox') === 'inbox' && !task.scheduledDate,
      );
  }
}

export function getTodayTasks(tasks) {
  return tasks.filter((task) => task.list === 'today');
}

export function getTodayTaskCounts(tasks) {
  const todayTasks = getTodayTasks(tasks);

  return todayTasks.reduce(
    (counts, task) => {
      if (task.dueDate && isOverdue(task.dueDate)) {
        counts.overdue += 1;
      } else {
        counts.onTime += 1;
      }
      return counts;
    },
    { onTime: 0, overdue: 0 },
  );
}

export function getViewTitle(activeView, date = new Date()) {
  switch (activeView) {
    case 'today':
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    case 'scheduled':
      return 'Scheduled';
    case 'trash':
      return 'Trash';
    case 'inbox':
    default:
      return 'Inbox';
  }
}

export function getTaskDestinationLabel(task) {
  if (task.list === 'trash') return 'Trash';
  if (task.list === 'today') return 'Today';

  const today = toIsoDate(new Date());
  if (task.scheduledDate === today) return 'Today';
  if (task.dueDate && task.dueDate <= today) return 'Today';
  if (task.scheduledDate && task.scheduledDate > today) {
    return 'Scheduled';
  }

  return 'Inbox';
}
