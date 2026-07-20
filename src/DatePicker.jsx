import { useState } from 'react';
import { toIsoDate } from './lib/dates';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getMondayBasedWeekday(date) {
  return (date.getDay() + 6) % 7;
}

export default function DatePicker({ selectedDate, onSelect }) {
  const initialView = selectedDate ?? new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());

  const todayKey = toIsoDate(new Date());
  const selectedKey = selectedDate ? toIsoDate(selectedDate) : null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = getMondayBasedWeekday(new Date(viewYear, viewMonth, 1));
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    undefined,
    { month: 'short', year: 'numeric' },
  );

  function shiftMonth(offset) {
    const next = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function selectDay(day) {
    onSelect(new Date(viewYear, viewMonth, day));
  }

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(<div key={`empty-${i}`} className="date-picker-cell empty" />);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewYear, viewMonth, day);
    const key = toIsoDate(date);
    const isToday = key === todayKey;
    const isSelected = key === selectedKey;
    const isWeekend = getMondayBasedWeekday(date) >= 5;

    cells.push(
      <button
        key={day}
        type="button"
        className={
          'date-picker-day' +
          (isWeekend ? ' weekend' : '') +
          (isToday ? ' today' : '') +
          (isSelected ? ' selected' : '')
        }
        onClick={() => selectDay(day)}
      >
        {day}
      </button>,
    );
  }

  return (
    <div className="dropdown-panel date-picker" role="dialog" aria-label="Choose a date">
      <div className="date-picker-header">
        <button
          type="button"
          className="date-picker-nav"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
        >
          ‹
        </button>
        <span className="date-picker-month">{monthLabel}</span>
        <button
          type="button"
          className="date-picker-nav"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
        >
          ›
        </button>
      </div>
      <div className="date-picker-weekdays">
        {WEEKDAYS.map((weekday, index) => (
          <span
            key={weekday}
            className={
              'date-picker-weekday' + (index >= 5 ? ' weekend' : '')
            }
          >
            {weekday}
          </span>
        ))}
      </div>
      <div className="date-picker-grid">{cells}</div>
    </div>
  );
}
