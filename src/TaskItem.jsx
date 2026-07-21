import { formatIsoDate, isOverdue } from './lib/dates';
import { EditIcon, InboxIcon, RearrangeIcon, TodayIcon, TrashIcon, CalendarIcon, DueDateIcon, ForwardIcon } from './icons';
import { getTaskPriority, getTagLabel } from './tags';

export default function TaskItem({
  task,
  isTrashView = false,
  showMoveToToday = false,
  isDragging = false,
  isDragOver = false,
  disabled,
  onEdit,
  onToggle,
  onMoveToInbox,
  onMoveToToday,
  onDeletePermanently,
  onRearrangeStart,
}) {
  const priority = getTaskPriority(task.tags);

  return (
    <li
      data-task-id={task.id}
      className={
        'task-card' +
        (task.done ? ' done' : '') +
        (isDragging ? ' dragging' : '') +
        (isDragOver ? ' drag-over' : '')
      }
    >
      <div className="task-item">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
        />
        {priority === 1 && (
          <span
            className="task-priority-mark"
            aria-label={getTagLabel(1)}
            title={getTagLabel(1)}
          >
            !
          </span>
        )}
        {priority === 2 && (
          <span
            className="task-priority-icon task-priority-icon--calendar"
            aria-label={getTagLabel(2)}
            title={getTagLabel(2)}
          >
            <CalendarIcon />
          </span>
        )}
        {priority === 3 && (
          <span
            className="task-priority-icon task-priority-icon--forward"
            aria-label={getTagLabel(3)}
            title={getTagLabel(3)}
          >
            <ForwardIcon />
          </span>
        )}
        <span className="task-text">{task.text}</span>
        {(task.scheduledDate || task.dueDate) && (
          <span className="task-dates" aria-label="Task dates">
            {task.scheduledDate && (
              <span className="task-date-item" title="Scheduled">
                <CalendarIcon />
                {formatIsoDate(task.scheduledDate)}
              </span>
            )}
            {task.dueDate && (
              <span
                className={
                  'task-date-item' + (isOverdue(task.dueDate) ? ' overdue' : '')
                }
                title={isOverdue(task.dueDate) ? 'Overdue' : 'Due date'}
              >
                <DueDateIcon />
                {formatIsoDate(task.dueDate)}
              </span>
            )}
          </span>
        )}
        {isTrashView ? (
          <div className="task-actions">
            <button
              type="button"
              className="task-action-btn task-action-btn--primary"
              title="Move to inbox"
              aria-label="Move to inbox"
              disabled={disabled}
              onClick={() => onMoveToInbox(task.id)}
            >
              <InboxIcon />
            </button>
            <button
              type="button"
              className="task-action-btn task-action-btn--danger"
              title="Delete permanently"
              aria-label="Delete permanently"
              disabled={disabled}
              onClick={() => onDeletePermanently(task.id)}
            >
              <TrashIcon />
            </button>
          </div>
        ) : (
          <div className="task-actions">
            {showMoveToToday && (
              <button
                type="button"
                className="task-action-btn task-action-btn--primary"
                title="Move to Today"
                aria-label="Move to Today"
                disabled={disabled}
                onClick={() => onMoveToToday(task.id)}
              >
                <TodayIcon />
              </button>
            )}
            <button
              type="button"
              className="task-action-btn task-action-btn--primary"
              title="Edit"
              aria-label="Edit task"
              onClick={() => onEdit(task.id)}
            >
              <EditIcon />
            </button>
            <span
              className="task-action-btn task-action-btn--grab"
              role="button"
              tabIndex={disabled ? -1 : 0}
              title="Drag to reorder"
              aria-label="Drag to reorder"
              onPointerDown={(event) => onRearrangeStart(event, task.id)}
            >
              <RearrangeIcon />
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
