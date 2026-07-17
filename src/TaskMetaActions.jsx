import { useEffect, useRef, useState } from 'react';
import DatePicker, { formatDisplayDate } from './DatePicker';
import { CalendarIcon, DueDateIcon, TagIcon } from './icons';
import { EISENHOWER_PRIORITIES, getTagLabel } from './tags';

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

function TagSelectButton({ tags, onTagsChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selectedTag = tags[0];
  const selectedLabel = selectedTag ? getTagLabel(selectedTag) : null;

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
    if (tags.includes(value)) {
      onTagsChange([]);
    } else {
      onTagsChange([value]);
    }
    setOpen(false);
  }

  return (
    <div className="list-picker-wrap tag-picker-wrap" ref={wrapRef}>
      <button
        type="button"
        className={
          'add-action-btn' +
          (selectedLabel ? ' add-action-btn-label add-action-btn-selected' : '')
        }
        title="Tag"
        aria-label="Tag"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <TagIcon />
        {selectedLabel}
      </button>
      {open && (
        <div className="list-dropdown tag-dropdown" role="listbox" aria-label="Select tag">
          {EISENHOWER_PRIORITIES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={tags.includes(option.value)}
              className={
                'list-dropdown-option' +
                (tags.includes(option.value) ? ' selected' : '')
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

export default function TaskMetaActions({
  scheduledDate,
  onScheduledDateChange,
  dueDate,
  onDueDateChange,
  tags = [],
  onTagsChange,
  disabled = false,
  showSubmit = false,
  submitLabel = 'Save',
}) {
  return (
    <div className="add-form-actions">
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
      <TagSelectButton
        tags={tags}
        onTagsChange={onTagsChange}
        disabled={disabled}
      />
      {showSubmit && (
        <button type="submit" className="add-submit-btn" disabled={disabled}>
          {submitLabel}
        </button>
      )}
    </div>
  );
}
