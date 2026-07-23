import { ProjectIcon } from '../icons';
import TaskItem from '../TaskItem';
import { groupProjectTasksByTiming, groupStandardAndProjectTasks } from '../lib/tasks';

const GROUPED_MAIN_VIEWS = new Set(['today', 'scheduled', 'sometime']);

function getTaskGroups(activeView, visibleTasks, projects) {
  if (activeView === 'project') {
    return groupProjectTasksByTiming(visibleTasks);
  }

  if (GROUPED_MAIN_VIEWS.has(activeView)) {
    return groupStandardAndProjectTasks(visibleTasks, projects);
  }

  return [{ id: null, label: null, kind: 'flat', tasks: visibleTasks }];
}

export default function TaskListView({
  activeView,
  projects = [],
  loading,
  visibleTasks,
  emptyMessage,
  remaining,
  draggedTaskId,
  dragOverTaskId,
  onEdit,
  onToggle,
  onMoveToInbox,
  onMoveToToday,
  onDeletePermanently,
  onRearrangeStart,
}) {
  const taskGroups = getTaskGroups(activeView, visibleTasks, projects);

  function renderTask(task) {
    return (
      <TaskItem
        key={task.id}
        task={task}
        isTrashView={activeView === 'trash'}
        showMoveToToday={
          activeView === 'inbox' ||
          activeView === 'scheduled' ||
          activeView === 'sometime'
        }
        isDragging={draggedTaskId === task.id}
        isDragOver={dragOverTaskId === task.id && draggedTaskId !== task.id}
        disabled={loading}
        onEdit={onEdit}
        onToggle={onToggle}
        onMoveToInbox={onMoveToInbox}
        onMoveToToday={onMoveToToday}
        onDeletePermanently={onDeletePermanently}
        onRearrangeStart={onRearrangeStart}
      />
    );
  }

  function renderGroupHeading(group) {
    if (group.kind === 'project') {
      return (
        <h3 className="task-project-heading">
          <ProjectIcon />
          {group.label}
        </h3>
      );
    }

    if (group.label) {
      return <h3 className="task-timing-heading">{group.label}</h3>;
    }

    return null;
  }

  return (
    <>
      <ul
        className={'task-list' + (draggedTaskId !== null ? ' is-dragging' : '')}
      >
        {loading ? (
          <li className="empty">Loading todos...</li>
        ) : visibleTasks.length === 0 ? (
          <li className="empty">{emptyMessage}</li>
        ) : (
          taskGroups.map((group) => (
            <li key={group.id ?? 'flat'} className="task-timing-section">
              {renderGroupHeading(group)}
              <ul className="task-timing-group">
                {group.tasks.map((task) => renderTask(task))}
              </ul>
            </li>
          ))
        )}
      </ul>

      {!loading && visibleTasks.length > 0 && (
        <p className="count">
          {remaining} of {visibleTasks.length} remaining
        </p>
      )}
    </>
  );
}
