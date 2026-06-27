// notification-app-fe/src/components/PriorityInbox.jsx
import { useState, useEffect } from 'react';
import { fetchPriorityInbox } from '../api/notifications';
import './PriorityInbox.css';

/**
 * PriorityInbox – shows the top 10 highest-priority unread notifications.
 * Collapsed by default; expands on click. Lives above the main filter row.
 */
export function PriorityInbox() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPriorityInbox()
      .then((data) => {
        if (!cancelled) setItems(data.notifications ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || error || items.length === 0) return null;

  return (
    <div className="priority-inbox">
      <button
        className="priority-inbox__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="priority-inbox__toggle-label">
          ⚡ Priority Inbox
          <span className="priority-inbox__count">{items.length}</span>
        </span>
        <span className="priority-inbox__chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ul className="priority-inbox__list" aria-label="Priority inbox">
          {items.map((n) => (
            <li key={n.id} className="priority-inbox__item">
              <span className={`priority-inbox__type priority-inbox__type--${n.type.toLowerCase()}`}>
                {n.type}
              </span>
              <span className="priority-inbox__title">{n.title}</span>
              <span className="priority-inbox__score" title="Priority score">
                {Math.round(n.priorityScore)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
