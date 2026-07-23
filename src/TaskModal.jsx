import { useEffect, useRef, useState } from 'react';
import {
  getTodayDate,
  getTomorrowDate,
  parseIsoDate,
  toIsoDate,
} from './lib/dates';
import { createNewTaskMetaForView, getDestinationSelectValue } from './lib/tasks';
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
  project = null,
  activeView,
  activeProject = null,
  projects = [],
  disabled,
  onClose,
  onSave,
  onDelete,
  onDeleteProject,
}) {
  const textInputRef = useRef(null);
  const isAdd = mode === 'add';
  const isAddProject = mode === 'add-project';
  const isEditProject = mode === 'edit-project';
  const isProjectModal = isAddProject || isEditProject;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draft, setDraft] = useState(() =>
    isProjectModal
      ? { text: isEditProject ? project?.name || '' : '' }
      : isAdd
        ? createAddDraft(activeView, activeProject)
        : createDraftFromTask(task),
  );

  useEffect(() => {
    setShowDeleteConfirm(false);
    setDraft(
      isProjectModal
        ? { text: isEditProject ? project?.name || '' : '' }
        : isAdd
          ? createAddDraft(activeView, activeProject)
          : createDraftFromTask(task),
    );
  }, [mode, task, project, activeView, activeProject, isAdd, isProjectModal, isEditProject]);

  useEffect(() => {
    textInputRef.current?.focus();
    if (isEditProject || (!isAdd && !isAddProject)) {
      textInputRef.current?.select();
    }
  }, [isAdd, isAddProject, isEditProject]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
          return;
        }
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, showDeleteConfirm]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = draft.text.trim();
    if (!trimmed) return;

    if (isProjectModal) {
      onSave({ name: trimmed });
      if (isAddProject) {
        setDraft({ text: '' });
        requestAnimationFrame(() => textInputRef.current?.focus());
      }
      return;
    }

    const destination = getDestinationSelectValue({
      list: draft.list,
      scheduledDate: draft.scheduledDate,
      dueDate: draft.dueDate,
    });
    let scheduledDate = draft.scheduledDate;
    const todayIso = toIsoDate(new Date());

    if (destination === 'scheduled') {
      if (!scheduledDate || toIsoDate(scheduledDate) <= todayIso) {
        scheduledDate = getTomorrowDate();
      }
    } else if (destination === 'today' && !scheduledDate) {
      scheduledDate = getTodayDate();
    }

    onSave({
      text: trimmed,
      list: draft.list || 'inbox',
      scheduledDate: toIsoDate(scheduledDate),
      dueDate: toIsoDate(draft.dueDate),
      tags: draft.tags,
    });

    if (isAdd) {
      setDraft(createAddDraft(activeView, activeProject));
      requestAnimationFrame(() => textInputRef.current?.focus());
    }
  }

  function handleListChange(nextList) {
    setDraft((prev) => {
      const todayIso = toIsoDate(new Date());
      const currentSchedule = toIsoDate(prev.scheduledDate);

      if (nextList === 'scheduled') {
        return {
          ...prev,
          list: 'inbox',
          scheduledDate:
            currentSchedule && currentSchedule > todayIso
              ? prev.scheduledDate
              : getTomorrowDate(),
        };
      }

      if (nextList === 'today') {
        return {
          ...prev,
          list: 'today',
          scheduledDate: getTodayDate(),
        };
      }

      if (nextList === 'inbox') {
        return {
          ...prev,
          list: 'inbox',
          scheduledDate:
            currentSchedule && currentSchedule > todayIso ? null : prev.scheduledDate,
        };
      }

      if (nextList === 'sometime') {
        return {
          ...prev,
          list: 'sometime',
          scheduledDate:
            currentSchedule && currentSchedule > todayIso ? null : prev.scheduledDate,
        };
      }

      return {
        ...prev,
        list: nextList,
        scheduledDate:
          currentSchedule && currentSchedule > todayIso ? null : prev.scheduledDate,
      };
    });
  }

  function handleScheduledDateChange(scheduledDate) {
    setDraft((prev) => {
      const todayIso = toIsoDate(new Date());
      const nextSchedule = toIsoDate(scheduledDate);

      if (nextSchedule && nextSchedule > todayIso) {
        return { ...prev, scheduledDate, list: 'inbox' };
      }

      return { ...prev, scheduledDate };
    });
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
            {isAddProject
              ? 'Add project'
              : isEditProject
                ? 'Edit project'
                : isAdd
                  ? 'Add task'
                  : 'Edit task'}
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

          {!isProjectModal && (
            <TaskMetaActions
              list={draft.list || 'inbox'}
              onListChange={handleListChange}
              projects={projects}
              scheduledDate={draft.scheduledDate}
              onScheduledDateChange={handleScheduledDateChange}
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

          {isProjectModal && (
            <div className="add-form-actions">
              <button type="submit" className="add-submit-btn" disabled={disabled}>
                {isEditProject ? 'Save' : 'Add'}
              </button>
            </div>
          )}

          {isEditProject && onDeleteProject && (
            <button
              type="button"
              className="modal-delete-btn"
              disabled={disabled}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete project
            </button>
          )}

          {!isAdd && !isProjectModal && onDelete && (
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

        {showDeleteConfirm && (
          <div
            className="confirm-dialog-backdrop"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="confirm-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-project-title"
              aria-describedby="delete-project-description"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 id="delete-project-title">Delete project?</h3>
              <p id="delete-project-description">
                All remaining tasks in this project will be moved to trash. Their
                titles will be prefixed with the project name.
              </p>
              <div className="confirm-dialog-actions">
                <button
                  type="button"
                  className="confirm-dialog-cancel"
                  disabled={disabled}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-dialog-delete"
                  disabled={disabled}
                  onClick={onDeleteProject}
                >
                  Delete project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
