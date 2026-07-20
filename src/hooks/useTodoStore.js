import { useRef, useState } from 'react';
import {
  createEmptyTaskMeta,
  getTaskDestinationLabel,
  getVisibleTasks,
  normalizeTask,
  resolveTaskPlacement,
  toIsoDate,
} from '../dates';
import { normalizeTags } from '../tags';

export default function useTodoStore({
  tasks,
  projects,
  commitTasks,
  nextTaskId,
  setError,
  showMoveToast,
  activeView,
  activeProject,
  loading,
  modal,
  closeTaskModal,
}) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const dragStateRef = useRef(null);

  function addTask(text, meta = createEmptyTaskMeta()) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newTask = normalizeTask({
      id: nextTaskId.current++,
      text: trimmed,
      done: false,
      list: meta.list || 'inbox',
      scheduledDate: toIsoDate(meta.scheduledDate),
      dueDate: toIsoDate(meta.dueDate),
      tags: normalizeTags(meta.tags),
    });

    commitTasks((prev) => [...prev, newTask]);

    const destination = getTaskDestinationLabel(newTask, projects);
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

      previousDestination = getTaskDestinationLabel(existing, projects);
      nextDestination = getTaskDestinationLabel(updated, projects);

      return prev.map((task) => (task.id === id ? updated : task));
    });

    if (!updated) return;

    if (closeEdit) {
      closeTaskModal();
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
    if (modal?.type === 'edit-task' && modal.taskId === id) {
      closeTaskModal();
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
    showMoveToast(restored.text, getTaskDestinationLabel(restored, projects));
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
    if (modal?.type === 'edit-task' && modal.taskId === id) {
      closeTaskModal();
    }

    commitTasks((prev) => prev.filter((item) => item.id !== id));
    setError(null);
  }

  function toggleTask(id) {
    commitTasks((prev) => {
      const taskIndex = prev.findIndex((task) => task.id === id);
      if (taskIndex === -1) return prev;

      const task = prev[taskIndex];
      const willBeDone = !task.done;
      const next = prev.map((item) =>
        item.id === id ? { ...item, done: willBeDone } : item,
      );

      if (!willBeDone) {
        return next;
      }

      const visibleIds = new Set(
        getVisibleTasks(next, activeView, activeProject).map((item) => item.id),
      );
      if (!visibleIds.has(id)) {
        return next;
      }

      const reordered = [...next];
      const [movedTask] = reordered.splice(taskIndex, 1);

      let insertIndex = reordered.length;
      for (let i = reordered.length - 1; i >= 0; i -= 1) {
        if (visibleIds.has(reordered[i].id)) {
          insertIndex = i + 1;
          break;
        }
      }

      reordered.splice(insertIndex, 0, movedTask);
      return reordered;
    });
    setError(null);
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
    if (loading || (modal?.type === 'edit-task' && modal.taskId === taskId)) {
      return;
    }

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

  return {
    draggedTaskId,
    dragOverTaskId,
    addTask,
    updateTask,
    moveTaskToTrash,
    moveTaskToInbox,
    moveTaskToToday,
    deleteTaskPermanently,
    toggleTask,
    handleRearrangeStart,
  };
}
