import {
  InboxIcon,
  ProjectIcon,
  ProjectsIcon,
  ScheduledIcon,
  SettingsIcon,
  TodayIcon,
  TrashIcon,
} from '../icons';
import { formatTitleDate } from './dates';

export const VIEW_ICONS = {
  inbox: InboxIcon,
  today: TodayIcon,
  scheduled: ScheduledIcon,
  trash: TrashIcon,
  projects: ProjectsIcon,
  project: ProjectIcon,
  settings: SettingsIcon,
};

export const VALID_VIEWS = new Set([
  'inbox',
  'today',
  'scheduled',
  'trash',
  'projects',
  'settings',
]);

export function getViewIcon(activeView) {
  return VIEW_ICONS[activeView] || InboxIcon;
}

export function getEmptyMessage(activeView) {
  switch (activeView) {
    case 'trash':
      return 'Trash is empty.';
    case 'today':
      return 'No tasks for today.';
    case 'scheduled':
      return 'No scheduled tasks.';
    case 'projects':
      return 'No projects yet. Tap + next to Projects to create one.';
    case 'project':
      return 'No tasks yet. Tap + to add one.';
    default:
      return 'No tasks yet. Tap + to add one.';
  }
}

export function canAddTask(activeView) {
  return activeView !== 'trash' && activeView !== 'projects' && activeView !== 'settings';
}

export function getViewTitle(activeView, activeProject = null, date = new Date()) {
  switch (activeView) {
    case 'today':
      return formatTitleDate(date);
    case 'scheduled':
      return 'Scheduled';
    case 'trash':
      return 'Trash';
    case 'projects':
      return 'Projects';
    case 'project':
      return activeProject?.name || 'Project';
    case 'settings':
      return 'Settings';
    case 'inbox':
    default:
      return 'Inbox';
  }
}

export function resolveActiveView({ view, projectSlug, pathname, projects, loading }) {
  const activeProject = projectSlug
    ? projects.find((project) => project.slug === projectSlug) ?? null
    : null;

  let activeView = null;
  if (projectSlug) {
    activeView = activeProject || loading ? 'project' : null;
  } else if (pathname === '/projects') {
    activeView = 'projects';
  } else if (view && VALID_VIEWS.has(view)) {
    activeView = view;
  }

  let redirectTo = null;
  if (!loading && projectSlug && !activeProject) {
    redirectTo = '/projects';
  } else if (!activeView) {
    redirectTo = '/inbox';
  }

  return { activeView, activeProject, redirectTo };
}
