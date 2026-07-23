import TaskItem from '../TaskItem';

export default function TaskListView({
  activeView,
  loading,
  visibleTasks,
  emptyMessage,
  remaining,
  draggedTaskId,
  dragOverTaskId,
  onEdit,
  onToggle,
  onMoveToInbox,
  onMoveToToday,
  onDeletePermanently,
  onRearrangeStart,
}) {
  return (
    <>
      <ul
        className={'task-list' + (draggedTaskId !== null ? ' is-dragging' : '')}
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
                activeView === 'inbox' ||
                activeView === 'scheduled' ||
                activeView === 'sometime'
              }
              isDragging={draggedTaskId === task.id}
              isDragOver={
                dragOverTaskId === task.id && draggedTaskId !== task.id
              }
              disabled={loading}
              onEdit={onEdit}
              onToggle={onToggle}
              onMoveToInbox={onMoveToInbox}
              onMoveToToday={onMoveToToday}
              onDeletePermanently={onDeletePermanently}
              onRearrangeStart={onRearrangeStart}
            />
          ))
        )}
      </ul>

      {!loading && visibleTasks.length > 0 && (
        <p className="count">
          {remaining} of {visibleTasks.length} remaining
        </p>
      )}
    </>
  );
}
