import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function resolveTaskModalState(modal, tasks, projects) {
  if (!modal) {
    return {
      editingTask: null,
      editingProject: null,
      isOpen: false,
      mode: null,
      editingTaskId: null,
    };
  }

  switch (modal.type) {
    case 'add-task':
      return {
        editingTask: null,
        editingProject: null,
        isOpen: true,
        mode: 'add',
        editingTaskId: null,
      };
    case 'add-project':
      return {
        editingTask: null,
        editingProject: null,
        isOpen: true,
        mode: 'add-project',
        editingTaskId: null,
      };
    case 'edit-task': {
      const editingTask = tasks.find((task) => task.id === modal.taskId) ?? null;
      return {
        editingTask,
        editingProject: null,
        isOpen: Boolean(editingTask),
        mode: 'edit',
        editingTaskId: modal.taskId,
      };
    }
    case 'edit-project': {
      const editingProject =
        projects.find((project) => project.id === modal.projectId) ?? null;
      return {
        editingTask: null,
        editingProject,
        isOpen: Boolean(editingProject),
        mode: 'edit-project',
        editingTaskId: null,
      };
    }
    default:
      return {
        editingTask: null,
        editingProject: null,
        isOpen: false,
        mode: null,
        editingTaskId: null,
      };
  }
}

export function createTaskModalHandlers({
  modal,
  addProject,
  renameProject,
  deleteProject,
  addTask,
  updateTask,
  moveTaskToTrash,
  closeTaskModal,
  navigate,
}) {
  function handleSave(data) {
    if (!modal) return;

    switch (modal.type) {
      case 'add-project': {
        const project = addProject(data.name);
        if (project) {
          closeTaskModal();
          navigate(`/projects/${project.slug}`);
        }
        break;
      }
      case 'edit-project':
        renameProject(modal.projectId, data.name);
        break;
      case 'add-task':
        addTask(data.text, data);
        break;
      case 'edit-task':
        updateTask(modal.taskId, data);
        break;
      default:
        break;
    }
  }

  function handleDeleteTask() {
    if (modal?.type !== 'edit-task') return;

    moveTaskToTrash(modal.taskId);
    closeTaskModal();
  }

  function handleDeleteProject() {
    if (modal?.type !== 'edit-project') return;

    deleteProject(modal.projectId);
  }

  return { handleSave, handleDeleteTask, handleDeleteProject };
}

export default function useTaskModal() {
  const { view, projectSlug } = useParams();
  const [modal, setModal] = useState(null);

  useEffect(() => {
    setModal(null);
  }, [view, projectSlug]);

  function openAddTask() {
    setModal({ type: 'add-task' });
  }

  function openAddProject() {
    setModal({ type: 'add-project' });
  }

  function openEditTask(taskId) {
    setModal({ type: 'edit-task', taskId });
  }

  function openEditProject(projectId) {
    setModal({ type: 'edit-project', projectId });
  }

  function closeTaskModal() {
    setModal(null);
  }

  return {
    modal,
    openAddTask,
    openAddProject,
    openEditTask,
    openEditProject,
    closeTaskModal,
  };
}
