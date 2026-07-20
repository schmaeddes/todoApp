import { getViewTitle } from '../dates';
import { EditIcon } from '../icons';
import { canAddTask, getViewIcon } from '../lib/views';

export default function ViewHeader({
  activeView,
  activeProject,
  loading,
  onAddTask,
  onEditProject,
}) {
  const ViewIcon = getViewIcon(activeView);

  return (
    <header className="header">
      <div
        className={
          'view-title-wrap' +
          (activeView === 'project' ? ' view-title-wrap--editable' : '')
        }
      >
        <h1 className="view-title">
          <span className={`view-title-icon view-title-icon--${activeView}`}>
            <ViewIcon />
          </span>
          {getViewTitle(activeView, activeProject)}
        </h1>
        {activeView === 'project' && activeProject && (
          <button
            type="button"
            className="view-title-edit-btn"
            title="Edit project"
            aria-label={`Edit ${activeProject.name}`}
            disabled={loading}
            onClick={() => onEditProject(activeProject.id)}
          >
            <EditIcon />
          </button>
        )}
      </div>
      {canAddTask(activeView) && (
        <button
          type="button"
          className="add-toggle-btn"
          title="Add task"
          aria-label="Add task"
          onClick={onAddTask}
          disabled={loading}
        >
          +
        </button>
      )}
    </header>
  );
}
