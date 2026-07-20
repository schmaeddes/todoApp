import { NavLink } from 'react-router-dom';
import { getProjectTaskCounts, getTodayTaskCounts } from '../lib/taskCounts';
import { getVisibleTasks } from '../lib/tasks';
import {
  InboxIcon,
  ProjectsIcon,
  ScheduledIcon,
  SettingsIcon,
  TodayIcon,
  TrashIcon,
} from '../icons';
import SidebarCountBadge from './SidebarCountBadge';

function sidebarLinkClass(isActive, extra = '') {
  return 'sidebar-btn' + extra + (isActive ? ' active' : '');
}

export default function Sidebar({ tasks, projects, loading, onAddProject }) {
  const inboxCount = getVisibleTasks(tasks, 'inbox').filter(
    (task) => !task.done,
  ).length;
  const { onTime: todayOnTimeCount, overdue: todayOverdueCount } =
    getTodayTaskCounts(tasks);

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div className="sidebar-main-nav">
          <NavLink
            to="/inbox"
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <InboxIcon />
            Inbox
            {inboxCount > 0 && (
              <span className="sidebar-count">{inboxCount}</span>
            )}
          </NavLink>
          <NavLink
            to="/today"
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <TodayIcon />
            Today
            <SidebarCountBadge
              onTimeCount={todayOnTimeCount}
              overdueCount={todayOverdueCount}
            />
          </NavLink>
          <NavLink
            to="/scheduled"
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <ScheduledIcon />
            Scheduled
          </NavLink>
          <NavLink
            to="/trash"
            className={({ isActive }) => sidebarLinkClass(isActive)}
          >
            <TrashIcon />
            Trash
          </NavLink>
        </div>
        <hr className="sidebar-divider" />
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">
            <ProjectsIcon />
            Projects
          </span>
          <button
            type="button"
            className="sidebar-add-btn"
            title="Add project"
            aria-label="Add project"
            onClick={onAddProject}
            disabled={loading}
          >
            +
          </button>
        </div>
        <div className="sidebar-projects-list">
          {projects.map((project) => {
            const { onTime, overdue } = getProjectTaskCounts(tasks, project.slug);

            return (
              <NavLink
                key={project.id}
                to={`/projects/${project.slug}`}
                className={({ isActive }) =>
                  sidebarLinkClass(isActive, ' sidebar-btn--nested')
                }
              >
                {project.name}
                <SidebarCountBadge
                  onTimeCount={onTime}
                  overdueCount={overdue}
                />
              </NavLink>
            );
          })}
        </div>
      </nav>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          sidebarLinkClass(isActive, ' sidebar-btn--settings')
        }
      >
        <SettingsIcon />
        Settings
      </NavLink>
    </aside>
  );
}
