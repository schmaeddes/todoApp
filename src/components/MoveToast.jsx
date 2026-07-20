export default function MoveToast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className={'move-toast' + (toast.visible ? ' is-visible' : '')}
      role="status"
      aria-live="polite"
    >
      <span className="move-toast-task">{toast.taskText}</span>
      {' moved to '}
      <span className="move-toast-list">{toast.listLabel}</span>
    </div>
  );
}
