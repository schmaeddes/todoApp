import { Navigate } from 'react-router-dom';
import AppModals from './components/AppModals';
import MoveToast from './components/MoveToast';
import SettingsPage from './components/SettingsPage';
import Sidebar from './components/Sidebar';
import TaskListView from './components/TaskListView';
import ViewHeader from './components/ViewHeader';
import useActiveView from './hooks/useActiveView';
import useAppBootstrap from './hooks/useAppBootstrap';
import useMoveToast from './hooks/useMoveToast';
import useProjectStore from './hooks/useProjectStore';
import useTaskModal, {
  createTaskModalHandlers,
  resolveTaskModalState,
} from './hooks/useTaskModal';
import useTodoStore from './hooks/useTodoStore';

export default function App() {
  const {
    tasks,
    projects,
    loading,
    error,
    setError,
    commitTasks,
    commitProjects,
    nextTaskId,
    nextProjectId,
  } = useAppBootstrap();

  const { moveToast, showMoveToast } = useMoveToast();

  const {
    modal,
    openAddTask,
    openAddProject,
    openEditTask,
    openEditProject,
    closeTaskModal,
  } = useTaskModal();

  const {
    activeView,
    activeProject,
    redirectTo,
    visibleTasks,
    remaining,
    emptyMessage,
  } = useActiveView({ tasks, projects, loading });

  const { addProject, renameProject, deleteProject } = useProjectStore({
    projects,
    commitProjects,
    commitTasks,
    nextProjectId,
    setError,
    closeTaskModal,
  });

  const {
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
  } = useTodoStore({
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
  });

  const { editingTask, editingProject, isOpen, mode } = resolveTaskModalState(
    modal,
    tasks,
    projects,
  );

  const { handleSave, handleDeleteTask, handleDeleteProject } = createTaskModalHandlers({
    modal,
    addProject,
    renameProject,
    deleteProject,
    addTask,
    updateTask,
    moveTaskToTrash,
    closeTaskModal,
  });

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="app">
      <Sidebar
        tasks={tasks}
        projects={projects}
        loading={loading}
        onAddProject={openAddProject}
      />

      <main className="main">
        <ViewHeader
          activeView={activeView}
          activeProject={activeProject}
          loading={loading}
          onAddTask={openAddTask}
          onEditProject={openEditProject}
        />

        {error && <p className="error">{error}</p>}

        {activeView === 'settings' ? (
          <SettingsPage />
        ) : (
          <TaskListView
            activeView={activeView}
            loading={loading}
            visibleTasks={visibleTasks}
            emptyMessage={emptyMessage}
            remaining={remaining}
            draggedTaskId={draggedTaskId}
            dragOverTaskId={dragOverTaskId}
            onEdit={openEditTask}
            onToggle={toggleTask}
            onMoveToInbox={moveTaskToInbox}
            onMoveToToday={moveTaskToToday}
            onDeletePermanently={deleteTaskPermanently}
            onRearrangeStart={handleRearrangeStart}
          />
        )}
      </main>

      <AppModals
        isOpen={isOpen}
        mode={mode}
        editingTask={editingTask}
        editingProject={editingProject}
        activeView={activeView}
        activeProject={activeProject}
        projects={projects}
        loading={loading}
        onClose={closeTaskModal}
        onSave={handleSave}
        onDeleteTask={mode === 'edit' ? handleDeleteTask : undefined}
        onDeleteProject={mode === 'edit-project' ? handleDeleteProject : undefined}
      />

      <MoveToast toast={moveToast} />
    </div>
  );
}
