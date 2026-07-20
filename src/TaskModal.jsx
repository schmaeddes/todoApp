import { useEffect, useRef, useState } from 'react';
import {
  createNewTaskMetaForView,
  getTodayDate,
  parseIsoDate,
  toIsoDate,
} from './dates';
import TaskMetaActions from './TaskMetaActions';

function createDraftFromTask(task) {
  return {
    text: task.text,
    list: task.list || 'inbox',
    scheduledDate: parseIsoDate(task.scheduledDate),
    dueDate: parseIsoDate(task.dueDate),
    tags: task.tags || [],
  };
}

function createAddDraft(activeView) {
  return {
    ...createNewTaskMetaForView(activeView),
    text: '',
  };
}

export default function TaskModal({
  mode,
  task,
  activeView,
  disabled,
  onClose,
  onSave,
  onDelete,
}) {
  const textInputRef = useRef(null);
  const isAdd = mode === 'add';
  const [draft, setDraft] = useState(() =>
    isAdd ? createAddDraft(activeView) : createDraftFromTask(task),
  );

  useEffect(() => {
    setDraft(
      isAdd ? createAddDraft(activeView) : createDraftFromTask(task),
    );
  }, [mode, task, activeView, isAdd]);

  useEffect(() => {
    textInputRef.current?.focus();
    if (!isAdd) {
      textInputRef.current?.select();
    }
  }, [isAdd]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = draft.text.trim();
    if (!trimmed) return;

    let list = draft.list || 'inbox';
    let scheduledDate = draft.scheduledDate;

    if (isAdd) {
      if (activeView === 'today') {
        list = 'today';
        scheduledDate = null;
      } else if (activeView === 'scheduled') {
        scheduledDate = scheduledDate || getTodayDate();
      }
    }

    onSave({
      text: trimmed,
      list,
      scheduledDate: toIsoDate(scheduledDate),
      dueDate: toIsoDate(draft.dueDate),
      tags: draft.tags,
    });

    if (isAdd) {
      setDraft(createAddDraft(activeView));
      requestAnimationFrame(() => textInputRef.current?.focus());
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={isAdd ? undefined : onClose}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="task-modal-title">{isAdd ? 'Add task' : 'Edit task'}</h2>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            ref={textInputRef}
            className="modal-input"
            type="text"
            placeholder="What needs to be done?"
            value={draft.text}
            autoComplete="off"
            disabled={disabled}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, text: event.target.value }))
            }
          />

          <TaskMetaActions
            scheduledDate={draft.scheduledDate}
            onScheduledDateChange={(scheduledDate) =>
              setDraft((prev) => ({ ...prev, scheduledDate }))
            }
            dueDate={draft.dueDate}
            onDueDateChange={(dueDate) =>
              setDraft((prev) => ({ ...prev, dueDate }))
            }
            tags={draft.tags}
            onTagsChange={(tags) => setDraft((prev) => ({ ...prev, tags }))}
            disabled={disabled}
            showSubmit
            submitLabel={isAdd ? 'Add' : 'Save'}
          />

          {!isAdd && onDelete && (
            <button
              type="button"
              className="modal-delete-btn"
              disabled={disabled}
              onClick={onDelete}
            >
              Move to trash
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
