// notification-app-fe/src/components/NotificationFilter.jsx
import './NotificationFilter.css';

const FILTERS = ['All', 'Placement', 'Result', 'Event'];

/**
 * A row of filter buttons. Calls onChange(type) when a button is clicked.
 */
export function NotificationFilter({ value, onChange }) {
  return (
    <div className="filter-group" role="group" aria-label="Filter notifications by type">
      {FILTERS.map((type) => (
        <button
          key={type}
          className={`filter-btn ${value === type ? 'filter-btn--active' : ''}`}
          onClick={() => onChange(type)}
          aria-pressed={value === type}
        >
          {type}
        </button>
      ))}
    </div>
  );
}