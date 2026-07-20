import TaskModal from '../TaskModal';

export default function AppModals({
  isOpen,
  mode,
  editingTask,
  editingProject,
  activeView,
  activeProject,
  projects,
  loading,
  onClose,
  onSave,
  onDeleteTask,
}) {
  if (!isOpen || !mode) return null;

  return (
    <TaskModal
      mode={mode}
      task={editingTask}
      project={editingProject}
      activeView={activeView}
      activeProject={activeProject}
      projects={projects}
      disabled={loading}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDeleteTask}
    />
  );
}
