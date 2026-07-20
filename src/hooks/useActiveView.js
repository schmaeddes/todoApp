import { useLocation, useParams } from 'react-router-dom';
import { getVisibleTasks } from '../lib/tasks';
import { getEmptyMessage, resolveActiveView } from '../lib/views';

export default function useActiveView({ tasks, projects, loading }) {
  const { view, projectSlug } = useParams();
  const { pathname } = useLocation();

  const { activeView, activeProject, redirectTo } = resolveActiveView({
    view,
    projectSlug,
    pathname,
    projects,
    loading,
  });

  const visibleTasks = getVisibleTasks(tasks, activeView, activeProject);
  const remaining = visibleTasks.filter((task) => !task.done).length;
  const emptyMessage = getEmptyMessage(activeView);

  return {
    activeView,
    activeProject,
    redirectTo,
    visibleTasks,
    remaining,
    emptyMessage,
  };
}
