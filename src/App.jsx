import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { fetchTodos, saveTodos } from './api';
import { createEmptyTaskMeta, createNewTaskMetaForView, getTaskDestinationLabel, getTodayDate, getVisibleTasks, getViewTitle, syncScheduleWithList, toIsoDate } from './dates';
import {
  InboxIcon,
  ScheduledIcon,
  TodayIcon,
  TrashIcon,
} from './icons';
import TaskItem from './TaskItem';
import TaskMetaActions from './TaskMetaActions';

const emptyDraft = createEmptyTaskMeta();

const VIEW_ICONS = {
  inbox: InboxIcon,
  today: TodayIcon,
  scheduled: ScheduledIcon,
  trash: TrashIcon,
};

const VALID_VIEWS = new Set(['inbox', 'today', 'scheduled', 'trash']);

export default function App() {
  const { view } = useParams();
  const activeView = VALID_VIEWS.has(view) ? view : null;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskMeta, setNewTaskMeta] = useState(emptyDraft);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const nextId = useRef(1);
  const inputRef = useRef(null);
  const readyToSave = useRef(false);
  const skipNextSave = useRef(true);
  const dragStateRef = useRef(null);
  const toastFadeOutRef = useRef(null);
  const toastRemoveRef = useRef(null);
  const [moveToast, setMoveToast] = useState(null);

  function showMoveToast(taskText, listLabel) {
    if (toastFadeOutRef.current) clearTimeout(toastFadeOutRef.current);
    if (toastRemoveRef.current) clearTimeout(toastRemoveRef.current);

    const id = Date.now();
    setMoveToast({ id, taskText, listLabel, visible: false });

    requestAnimationFrame(() => {
      setMoveToast({ id, taskText, listLabel, visible: true });
    });

    toastFadeOutRef.current = setTimeout(() => {
      setMoveToast((current) =>
        current?.id === id ? { ...current, visible: false } : current,
      );
    }, 3300);

    toastRemoveRef.current = setTimeout(() => {
      setMoveToast((current) => (current?.id === id ? null : current));
    }, 3600);
  }

  useEffect(() => {
    return () => {
      if (toastFadeOutRef.current) clearTimeout(toastFadeOutRef.current);
      if (toastRemoveRef.current) clearTimeout(toastRemoveRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showAddForm) return;
    inputRef.current?.focus();
  }, [showAddForm]);

  useEffect(() => {
    if (!showAddForm) {
      setNewTaskMeta(createEmptyTaskMeta());
      return;
    }

    setNewTaskMeta(createNewTaskMetaForView(activeView));
  }, [showAddForm, activeView]);

  useEffect(() => {
    setShowAddForm(false);

    if (activeView === 'trash') {
      setEditingTaskId(null);
    }
  }, [activeView]);

  useEffect(() => {
    fetchTodos()
      .then((data) => {
        setTasks(data);
        nextId.current =
          data.reduce((max, task) => Math.max(max, task.id), 0) + 1;
        readyToSave.current = true;
        skipNextSave.current = true;
      })
      .catch(() => setError('Could not load todos.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!readyToSave.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    saveTodos(tasks).catch(() => setError('Could not save todos.'));
  }, [tasks]);

  function addTask(text, meta = emptyDraft) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTask = {
      id: nextId.current++,
      text: trimmed,
      done: false,
      list: meta.list || 'inbox',
      scheduledDate: toIsoDate(
        syncScheduleWithList(meta.list || 'inbox', meta.scheduledDate),
      ),
      dueDate: toIsoDate(meta.dueDate),
    };

    setTasks((prev) => [...prev, newTask]);

    const destination = getTaskDestinationLabel(newTask);
    if (destination !== 'Inbox') {
      showMoveToast(trimmed, destination);
    }

    setError(null);
  }

  function updateTask(id, updates) {
    const existing = tasks.find((task) => task.id === id);
    if (!existing) return;

    const list = updates.list || existing.list || 'inbox';
    const scheduledDate =
      'scheduledDate' in updates
        ? updates.scheduledDate
        : list === 'today'
          ? toIsoDate(getTodayDate())
          : existing.scheduledDate;

    const updated = {
      ...existing,
      ...updates,
      list,
      scheduledDate,
      dueDate: 'dueDate' in updates ? updates.dueDate : existing.dueDate,
    };

    const previousDestination = getTaskDestinationLabel(existing);
    const nextDestination = getTaskDestinationLabel(updated);

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? updated : task)),
    );
    setEditingTaskId(null);
    setError(null);

    if (previousDestination !== nextDestination) {
      showMoveToast(updated.text, nextDestination);
    }
  }

  function moveTaskToTrash(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    setTasks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, list: 'trash' } : item,
      ),
    );
    if (editingTaskId === id) {
      setEditingTaskId(null);
    }
    showMoveToast(task.text, 'Trash');
    setError(null);
  }

  function moveTaskToInbox(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const restored = { ...task, list: 'inbox' };

    setTasks((prev) =>
      prev.map((item) => (item.id === id ? restored : item)),
    );
    showMoveToast(restored.text, getTaskDestinationLabel(restored));
    setError(null);
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
    setError(null);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const meta = { ...newTaskMeta };
    if (activeView === 'today' || activeView === 'scheduled') {
      meta.scheduledDate = meta.scheduledDate || getTodayDate();
    }

    addTask(inputRef.current.value, meta);
    inputRef.current.value = '';
    setNewTaskMeta(createNewTaskMetaForView(activeView));
    inputRef.current.focus();
  }

  function handleEdit(taskId) {
    setShowAddForm(false);
    setEditingTaskId((current) => (current === taskId ? null : taskId));
  }

  function reorderTasks(draggedId, targetId) {
    if (draggedId === targetId) return;

    setTasks((prev) => {
      const draggedIndex = prev.findIndex((task) => task.id === draggedId);
      const targetIndex = prev.findIndex((task) => task.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return prev;
      }

      const next = [...prev];
      const [movedTask] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, movedTask);
      return next;
    });
    setError(null);
  }

  function handleRearrangeStart(event, taskId) {
    if (loading || editingTaskId === taskId) return;

    event.preventDefault();
    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    handle.setPointerCapture(pointerId);

    dragStateRef.current = { draggedId: taskId, overId: taskId };
    setDraggedTaskId(taskId);
    setDragOverTaskId(taskId);

    function updateOver(clientX, clientY) {
      const element = document.elementFromPoint(clientX, clientY);
      const card = element?.closest('[data-task-id]');
      if (!card) return;

      const overId = Number(card.dataset.taskId);
      if (Number.isNaN(overId)) return;

      dragStateRef.current = { draggedId: taskId, overId };
      setDragOverTaskId(overId);
    }

    function handlePointerMove(moveEvent) {
      if (moveEvent.pointerId !== pointerId) return;
      updateOver(moveEvent.clientX, moveEvent.clientY);
    }

    function finishDrag(endEvent) {
      if (endEvent.pointerId !== pointerId) return;

      const state = dragStateRef.current;
      if (state && state.draggedId !== state.overId) {
        reorderTasks(state.draggedId, state.overId);
      }

      dragStateRef.current = null;
      setDraggedTaskId(null);
      setDragOverTaskId(null);

      if (handle.hasPointerCapture(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
  }

  const visibleTasks = getVisibleTasks(tasks, activeView);
  const remaining = visibleTasks.filter((task) => !task.done).length;

  const emptyMessage =
    activeView === 'trash'
      ? 'Trash is empty.'
      : activeView === 'today'
        ? 'No tasks for today.'
        : activeView === 'scheduled'
          ? 'No scheduled tasks.'
          : 'No tasks yet. Tap + to add one.';

  const ViewIcon = VIEW_ICONS[activeView] || InboxIcon;

  if (!activeView) {
    return <Navigate to="/inbox" replace />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              'sidebar-btn' + (isActive ? ' active' : '')
            }
          >
            <InboxIcon />
            Inbox
          </NavLink>
          <NavLink
            to="/today"
            className={({ isActive }) =>
              'sidebar-btn' + (isActive ? ' active' : '')
            }
          >
            <TodayIcon />
            Today
          </NavLink>
          <NavLink
            to="/scheduled"
            className={({ isActive }) =>
              'sidebar-btn' + (isActive ? ' active' : '')
            }
          >
            <ScheduledIcon />
            Scheduled
          </NavLink>
          <NavLink
            to="/trash"
            className={({ isActive }) =>
              'sidebar-btn' + (isActive ? ' active' : '')
            }
          >
            <TrashIcon />
            Trash
          </NavLink>
        </nav>
      </aside>

      <main className="main">
        <header className="header">
          <h1 className="view-title">
            <span className={`view-title-icon view-title-icon--${activeView}`}>
              <ViewIcon />
            </span>
            {getViewTitle(activeView)}
          </h1>
          {activeView !== 'trash' && (
            <button
              type="button"
              className="add-toggle-btn"
              title={showAddForm ? 'Close' : 'Add task'}
              aria-label={showAddForm ? 'Close add form' : 'Add task'}
              aria-expanded={showAddForm}
              onClick={() => setShowAddForm((open) => !open)}
              disabled={loading}
            >
              {showAddForm ? '×' : '+'}
            </button>
          )}
        </header>

        {error && <p className="error">{error}</p>}

        {showAddForm && activeView !== 'trash' && (
          <form className="add-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              placeholder="What needs to be done?"
              autoComplete="off"
              disabled={loading}
            />
            <TaskMetaActions
              list={newTaskMeta.list}
              onListChange={(list) =>
                setNewTaskMeta((prev) => ({
                  ...prev,
                  list,
                  scheduledDate: syncScheduleWithList(list, prev.scheduledDate),
                }))
              }
              scheduledDate={newTaskMeta.scheduledDate}
              onScheduledDateChange={(scheduledDate) =>
                setNewTaskMeta((prev) => ({ ...prev, scheduledDate }))
              }
              dueDate={newTaskMeta.dueDate}
              onDueDateChange={(dueDate) =>
                setNewTaskMeta((prev) => ({ ...prev, dueDate }))
              }
              tags={newTaskMeta.tags}
              disabled={loading}
              showSubmit
              submitLabel="Add"
            />
          </form>
        )}

        <ul
          className={
            'task-list' + (draggedTaskId !== null ? ' is-dragging' : '')
          }
        >
          {loading ? (
            <li className="empty">Loading todos...</li>
          ) : visibleTasks.length === 0 ? (
            <li className="empty">{emptyMessage}</li>
          ) : (
            visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isTrashView={activeView === 'trash'}
                isEditing={editingTaskId === task.id}
                isDragging={draggedTaskId === task.id}
                isDragOver={
                  dragOverTaskId === task.id && draggedTaskId !== task.id
                }
                disabled={loading}
                onEdit={handleEdit}
                onSave={(updates) => updateTask(task.id, updates)}
                onToggle={toggleTask}
                onRemove={moveTaskToTrash}
                onMoveToInbox={moveTaskToInbox}
                onRearrangeStart={handleRearrangeStart}
              />
            ))
          )}
        </ul>

        {!loading && visibleTasks.length > 0 && (
          <p className="count">
            {remaining} of {visibleTasks.length} remaining
          </p>
        )}
      </main>

      {moveToast && (
        <div
          className={'move-toast' + (moveToast.visible ? ' is-visible' : '')}
          role="status"
          aria-live="polite"
        >
          <span className="move-toast-task">{moveToast.taskText}</span>
          {' moved to '}
          <span className="move-toast-list">{moveToast.listLabel}</span>
        </div>
      )}
    </div>
  );
}
