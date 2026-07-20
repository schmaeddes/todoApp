import { useEffect, useRef, useState } from 'react';
import {
  createNewTaskMetaForView,
  getTodayDate,
  parseIsoDate,
  toIsoDate,
} from './dates';
import { toProjectList } from './projects';
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

function createAddDraft(activeView, activeProject = null) {
  return {
    ...createNewTaskMetaForView(activeView, activeProject),
    text: '',
  };
}

export default function TaskModal({
  mode,
  task,
  activeView,
  activeProject = null,
  disabled,
  onClose,
  onSave,
  onDelete,
}) {
  const textInputRef = useRef(null);
  const isAdd = mode === 'add';
  const isAddProject = mode === 'add-project';
  const [draft, setDraft] = useState(() =>
    isAddProject ? { text: '' } : isAdd ? createAddDraft(activeView, activeProject) : createDraftFromTask(task),
  );

  useEffect(() => {
    setDraft(
      isAddProject
        ? { text: '' }
        : isAdd
          ? createAddDraft(activeView, activeProject)
          : createDraftFromTask(task),
    );
  }, [mode, task, activeView, activeProject, isAdd, isAddProject]);

  useEffect(() => {
    textInputRef.current?.focus();
    if (!isAdd && !isAddProject) {
      textInputRef.current?.select();
    }
  }, [isAdd, isAddProject]);

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

    if (isAddProject) {
      onSave({ name: trimmed });
      setDraft({ text: '' });
      requestAnimationFrame(() => textInputRef.current?.focus());
      return;
    }

    let list = draft.list || 'inbox';
    let scheduledDate = draft.scheduledDate;

    if (isAdd) {
      if (activeView === 'today') {
        list = 'today';
        scheduledDate = null;
      } else if (activeView === 'project' && activeProject) {
        list = toProjectList(activeProject.slug);
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
      setDraft(createAddDraft(activeView, activeProject));
      requestAnimationFrame(() => textInputRef.current?.focus());
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={isAdd || isAddProject ? undefined : onClose}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="task-modal-title">
            {isAddProject ? 'Add project' : isAdd ? 'Add task' : 'Edit task'}
          </h2>
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
            placeholder={
              isAddProject ? 'What is the project called?' : 'What needs to be done?'
            }
            value={draft.text}
            autoComplete="off"
            disabled={disabled}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, text: event.target.value }))
            }
          />

          {!isAddProject && (
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
          )}

          {isAddProject && (
            <div className="add-form-actions">
              <button type="submit" className="add-submit-btn" disabled={disabled}>
                Add
              </button>
            </div>
          )}

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
