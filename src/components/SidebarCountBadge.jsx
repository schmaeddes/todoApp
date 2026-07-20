export default function SidebarCountBadge({ onTimeCount, overdueCount }) {
  if (onTimeCount <= 0 && overdueCount <= 0) {
    return null;
  }

  return (
    <span className="sidebar-counts">
      {onTimeCount > 0 && (
        <span className="sidebar-count">{onTimeCount}</span>
      )}
      {onTimeCount > 0 && overdueCount > 0 && (
        <span className="sidebar-count-separator" aria-hidden="true">
          |
        </span>
      )}
      {overdueCount > 0 && (
        <span className="sidebar-count sidebar-count--overdue">
          {overdueCount}
        </span>
      )}
    </span>
  );
}
