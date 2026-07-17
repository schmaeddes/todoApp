import { useEffect, useRef, useState } from 'react';
import DatePicker, { formatDisplayDate } from './DatePicker';
import { CalendarIcon, DueDateIcon, TagIcon } from './icons';

const LIST_OPTIONS = [
  { value: 'inbox', label: 'inbox' },
  { value: 'today', label: 'Today' },
];

function ListSelectButton({ list, onListChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current =
    LIST_OPTIONS.find((option) => option.value === list) || LIST_OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(value) {
    onListChange(value);
    setOpen(false);
  }

  return (
    <div className="list-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        className="add-action-btn add-action-btn-label add-action-btn-selected"
        title="List"
        aria-label="List"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {current.label}
      </button>
      {open && (
        <div className="list-dropdown" role="listbox" aria-label="Select list">
          {LIST_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={list === option.value}
              className={
                'list-dropdown-option' +
                (list === option.value ? ' selected' : '')
              }
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateActionButton({
  label,
  date,
  onChange,
  onClear,
  icon,
  disabled,
  variant = 'schedule',
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSelect(selected) {
    onChange(selected);
    setOpen(false);
  }

  function handleClear(event) {
    event.stopPropagation();
    onClear();
    setOpen(false);
  }

  return (
    <div className="calendar-picker-wrap" ref={wrapRef}>
      {date ? (
        <div
          className={
            'calendar-selected' +
            (variant === 'due'
              ? ' calendar-selected-due'
              : ' calendar-selected-active')
          }
        >
          <button
            type="button"
            className="add-action-btn add-action-btn-label calendar-date-btn"
            title={formatDisplayDate(date)}
            aria-label={formatDisplayDate(date)}
            aria-expanded={open}
            disabled={disabled}
            onClick={() => setOpen((isOpen) => !isOpen)}
          >
            {icon}
            {formatDisplayDate(date)}
          </button>
          <button
            type="button"
            className="calendar-clear-btn"
            title={`Clear ${label}`}
            aria-label={`Clear ${label}`}
            disabled={disabled}
            onClick={handleClear}
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="add-action-btn"
          title={label}
          aria-label={label}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          {icon}
        </button>
      )}
      {open && <DatePicker selectedDate={date} onSelect={handleSelect} />}
    </div>
  );
}

export default function TaskMetaActions({
  list,
  onListChange,
  scheduledDate,
  onScheduledDateChange,
  dueDate,
  onDueDateChange,
  tags = [],
  disabled = false,
  showSubmit = false,
  submitLabel = 'Save',
}) {
  return (
    <div className="add-form-actions">
      <ListSelectButton
        list={list}
        onListChange={onListChange}
        disabled={disabled}
      />
      <DateActionButton
        label="Schedule"
        date={scheduledDate}
        onChange={onScheduledDateChange}
        onClear={() => onScheduledDateChange(null)}
        icon={<CalendarIcon />}
        disabled={disabled}
      />
      <DateActionButton
        label="Due date"
        date={dueDate}
        onChange={onDueDateChange}
        onClear={() => onDueDateChange(null)}
        icon={<DueDateIcon />}
        disabled={disabled}
        variant="due"
      />
      <button
        type="button"
        className={
          'add-action-btn' + (tags.length > 0 ? ' add-action-btn-selected' : '')
        }
        title="Tag"
        aria-label="Tag"
        disabled={disabled}
      >
        <TagIcon />
      </button>
      {showSubmit && (
        <button type="submit" className="add-submit-btn" disabled={disabled}>
          {submitLabel}
        </button>
      )}
    </div>
  );
}
