import { useEffect, useRef, useState } from 'react';
import { NavLink, Navigate, useParams } from 'react-router-dom';
import { fetchTodos, saveTodos } from './api';
import { createEmptyTaskMeta, getTaskDestinationLabel, getTodayTaskCounts, getVisibleTasks, getViewTitle, normalizeTask, resolveTaskPlacement, toIsoDate } from './dates';
import { normalizeTags } from './tags';
import {
  InboxIcon,
  ScheduledIcon,
  TodayIcon,
  TrashIcon,
} from './icons';
import TaskItem from './TaskItem';
import TaskModal from './TaskModal';

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
  const [taskModal, setTaskModal] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const nextId = useRef(1);
  const readyToSave = useRef(false);
  const skipNextSave = useRef(true);
  const saveQueueRef = useRef(Promise.resolve());
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
    setTaskModal(null);
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

  function persistTasks(nextTasks) {
    if (!readyToSave.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    saveQueueRef.current = saveQueueRef.current
      .then(() => saveTodos(nextTasks))
      .catch(() => setError('Could not save todos.'));
  }

  function commitTasks(updater) {
    setTasks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistTasks(next);
      return next;
    });
  }

  function addTask(text, meta = createEmptyTaskMeta()) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTask = normalizeTask({
      id: nextId.current++,
      text: trimmed,
      done: false,
      list: meta.list || 'inbox',
      scheduledDate: toIsoDate(meta.scheduledDate),
      dueDate: toIsoDate(meta.dueDate),
      tags: normalizeTags(meta.tags),
    });

    commitTasks((prev) => [...prev, newTask]);

    const destination = getTaskDestinationLabel(newTask);
    if (destination !== 'Inbox') {
      showMoveToast(trimmed, destination);
    }

    setError(null);
  }

  function updateTask(id, updates, { closeEdit = true } = {}) {
    let updated = null;
    let previousDestination = null;
    let nextDestination = null;

    commitTasks((prev) => {
      const existing = prev.find((task) => task.id === id);
      if (!existing) return prev;

      const list = updates.list || existing.list || 'inbox';
      const scheduledDate =
        'scheduledDate' in updates
          ? updates.scheduledDate
          : existing.scheduledDate;

      const dueDate =
        'dueDate' in updates ? updates.dueDate : existing.dueDate;

      const placement = resolveTaskPlacement({ list, scheduledDate, dueDate });

      updated = normalizeTask({
        ...existing,
        ...updates,
        list: placement.list,
        scheduledDate: placement.scheduledDate,
        dueDate,
        tags: normalizeTags(
          'tags' in updates ? updates.tags : existing.tags,
        ),
      });

      previousDestination = getTaskDestinationLabel(existing);
      nextDestination = getTaskDestinationLabel(updated);

      return prev.map((task) => (task.id === id ? updated : task));
    });

    if (!updated) return;

    if (closeEdit) {
      setTaskModal(null);
    }
    setError(null);

    if (previousDestination !== nextDestination) {
      showMoveToast(updated.text, nextDestination);
    }
  }

  function moveTaskToTrash(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    commitTasks((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, list: 'trash' } : item,
      ),
    );
    if (taskModal === id) {
      setTaskModal(null);
    }
    showMoveToast(task.text, 'Trash');
    setError(null);
  }

  function moveTaskToInbox(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const restored = { ...task, list: 'inbox' };

    commitTasks((prev) =>
      prev.map((item) => (item.id === id ? restored : item)),
    );
    showMoveToast(restored.text, getTaskDestinationLabel(restored));
    setError(null);
  }

  function moveTaskToToday(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const updated = { ...task, list: 'today' };

    commitTasks((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
    showMoveToast(updated.text, 'Today');
    setError(null);
  }

  function deleteTaskPermanently(id) {
    if (taskModal === id) {
      setTaskModal(null);
    }

    commitTasks((prev) => prev.filter((item) => item.id !== id));
    setError(null);
  }

  function toggleTask(id) {
    commitTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
    setError(null);
  }

  function handleModalSave(data) {
    if (taskModal === 'add') {
      addTask(data.text, data);
      return;
    }

    if (typeof taskModal === 'number') {
      updateTask(taskModal, data);
    }
  }

  function handleEdit(taskId) {
    setTaskModal(taskId);
  }

  function closeTaskModal() {
    setTaskModal(null);
  }

  function reorderTasks(draggedId, targetId) {
    if (draggedId === targetId) return;

    commitTasks((prev) => {
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
    if (loading || taskModal === taskId) return;

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
  const inboxCount = getVisibleTasks(tasks, 'inbox').length;
  const { onTime: todayOnTimeCount, overdue: todayOverdueCount } =
    getTodayTaskCounts(tasks);

  const emptyMessage =
    activeView === 'trash'
      ? 'Trash is empty.'
      : activeView === 'today'
        ? 'No tasks for today.'
        : activeView === 'scheduled'
          ? 'No scheduled tasks.'
          : 'No tasks yet. Tap + to add one.';

  const ViewIcon = VIEW_ICONS[activeView] || InboxIcon;
  const editingTask =
    typeof taskModal === 'number'
      ? tasks.find((task) => task.id === taskModal)
      : null;

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
            {inboxCount > 0 && (
              <span className="sidebar-count">{inboxCount}</span>
            )}
          </NavLink>
          <NavLink
            to="/today"
            className={({ isActive }) =>
              'sidebar-btn' + (isActive ? ' active' : '')
            }
          >
            <TodayIcon />
            Today
            {(todayOnTimeCount > 0 || todayOverdueCount > 0) && (
              <span className="sidebar-counts">
                {todayOnTimeCount > 0 && (
                  <span className="sidebar-count">{todayOnTimeCount}</span>
                )}
                {todayOnTimeCount > 0 && todayOverdueCount > 0 && (
                  <span className="sidebar-count-separator" aria-hidden="true">
                    |
                  </span>
                )}
                {todayOverdueCount > 0 && (
                  <span className="sidebar-count sidebar-count--overdue">
                    {todayOverdueCount}
                  </span>
                )}
              </span>
            )}
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
              title="Add task"
              aria-label="Add task"
              onClick={() => setTaskModal('add')}
              disabled={loading}
            >
              +
            </button>
          )}
        </header>

        {error && <p className="error">{error}</p>}

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
                showMoveToToday={
                  activeView === 'inbox' || activeView === 'scheduled'
                }
                isDragging={draggedTaskId === task.id}
                isDragOver={
                  dragOverTaskId === task.id && draggedTaskId !== task.id
                }
                disabled={loading}
                onEdit={handleEdit}
                onToggle={toggleTask}
                onMoveToInbox={moveTaskToInbox}
                onMoveToToday={moveTaskToToday}
                onDeletePermanently={deleteTaskPermanently}
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

      {taskModal && (taskModal === 'add' || editingTask) && (
        <TaskModal
          mode={taskModal === 'add' ? 'add' : 'edit'}
          task={editingTask}
          activeView={activeView}
          disabled={loading}
          onClose={closeTaskModal}
          onSave={handleModalSave}
          onDelete={
            typeof taskModal === 'number'
              ? () => {
                  moveTaskToTrash(taskModal);
                  setTaskModal(null);
                }
              : undefined
          }
        />
      )}

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
