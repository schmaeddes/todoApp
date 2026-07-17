import { useEffect, useRef, useState } from 'react';
import { toIsoDate, formatIsoDate, isOverdue, syncScheduleWithList } from './dates';
import { EditIcon, InboxIcon, RearrangeIcon, CalendarIcon, DueDateIcon } from './icons';
import TaskMetaActions from './TaskMetaActions';

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export default function TaskItem({
  task,
  isTrashView = false,
  isEditing,
  isDragging = false,
  isDragOver = false,
  disabled,
  onEdit,
  onSave,
  onToggle,
  onRemove,
  onMoveToInbox,
  onRearrangeStart,
}) {
  const textInputRef = useRef(null);
  const [draft, setDraft] = useState({
    text: task.text,
    list: task.list || 'inbox',
    scheduledDate: null,
    dueDate: null,
    tags: task.tags || [],
  });

  useEffect(() => {
    if (!isEditing) return;

    setDraft({
      text: task.text,
      list: task.list || 'inbox',
      scheduledDate: parseDate(task.scheduledDate),
      dueDate: parseDate(task.dueDate),
      tags: task.tags || [],
    });
  }, [isEditing, task]);

  useEffect(() => {
    if (!isEditing) return;
    textInputRef.current?.focus();
    textInputRef.current?.select();
  }, [isEditing]);

  function handleSave(event) {
    event.preventDefault();
    if (!isEditing) return;
    const trimmed = draft.text.trim();
    if (!trimmed) return;

    onSave({
      text: trimmed,
      list: draft.list || 'inbox',
      scheduledDate: toIsoDate(draft.scheduledDate),
      dueDate: toIsoDate(draft.dueDate),
    });
  }

  const displayScheduledDate = isEditing
    ? toIsoDate(draft.scheduledDate)
    : task.scheduledDate;
  const displayDueDate = isEditing ? toIsoDate(draft.dueDate) : task.dueDate;

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
      <form className="task-form" onSubmit={handleSave}>
        <div className="task-item">
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => onToggle(task.id)}
          />
          {isEditing ? (
            <input
              ref={textInputRef}
              className="task-text-input"
              type="text"
              value={draft.text}
              disabled={disabled}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, text: event.target.value }))
              }
            />
          ) : (
            <span className="task-text">{task.text}</span>
          )}
          {!isEditing && (displayScheduledDate || displayDueDate) && (
            <span className="task-dates" aria-label="Task dates">
              {displayScheduledDate && (
                <span className="task-date-item" title="Scheduled">
                  <CalendarIcon />
                  {formatIsoDate(displayScheduledDate)}
                </span>
              )}
              {displayDueDate && (
                <span
                  className={
                    'task-date-item' +
                    (isOverdue(displayDueDate) ? ' overdue' : '')
                  }
                  title={isOverdue(displayDueDate) ? 'Overdue' : 'Due date'}
                >
                  <DueDateIcon />
                  {formatIsoDate(displayDueDate)}
                </span>
              )}
            </span>
          )}
          {isTrashView ? (
            <div className="task-actions">
              <button
                type="button"
                className="move-btn"
                title="Move to inbox"
                aria-label="Move to inbox"
                disabled={disabled}
                onClick={() => onMoveToInbox(task.id)}
              >
                <InboxIcon />
              </button>
            </div>
          ) : (
            <div className="task-actions">
              <button
                type="button"
                className="edit-btn"
                title="Edit"
                aria-label="Edit task"
                aria-expanded={isEditing}
                onClick={() => onEdit(task.id)}
              >
                <EditIcon />
              </button>
              {!isEditing && (
                <span
                  className="rearrange-btn"
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                  onPointerDown={(event) => onRearrangeStart(event, task.id)}
                >
                  <RearrangeIcon />
                </span>
              )}
              {isEditing && (
                <button
                  type="button"
                  className="delete-btn"
                  title="Move to trash"
                  aria-label="Move to trash"
                  onClick={() => onRemove(task.id)}
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing && !isTrashView && (
          <div className="task-edit">
            <TaskMetaActions
              list={draft.list}
              onListChange={(list) =>
                setDraft((prev) => ({
                  ...prev,
                  list,
                  scheduledDate: syncScheduleWithList(list, prev.scheduledDate),
                }))
              }
              scheduledDate={draft.scheduledDate}
              onScheduledDateChange={(scheduledDate) =>
                setDraft((prev) => ({ ...prev, scheduledDate }))
              }
              dueDate={draft.dueDate}
              onDueDateChange={(dueDate) =>
                setDraft((prev) => ({ ...prev, dueDate }))
              }
              tags={draft.tags}
              disabled={disabled}
              showSubmit
              submitLabel="Save"
            />
          </div>
        )}
      </form>
    </li>
  );
}
