// notification-app-fe/src/components/NotificationCard.jsx
import './NotificationCard.css';

const TYPE_LABELS = {
  Placement: { emoji: '💼', className: 'badge--placement' },
  Result: { emoji: '📄', className: 'badge--result' },
  Event: { emoji: '🎉', className: 'badge--event' },
};

/**
 * Displays a single notification with its type badge, title, message, and timestamp.
 */
export function NotificationCard({ notification }) {
  const { title, message, type, isRead, createdAt } = notification;
  const label = TYPE_LABELS[type] || { emoji: '🔔', className: '' };

  const date = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={`notification-card ${isRead ? 'notification-card--read' : 'notification-card--unread'}`}>
      {!isRead && <span className="notification-card__dot" aria-label="Unread" />}

      <div className="notification-card__header">
        <span className={`notification-card__badge ${label.className}`}>
          {label.emoji} {type}
        </span>
        <span className="notification-card__date">{date}</span>
      </div>

      <h3 className="notification-card__title">{title}</h3>
      <p className="notification-card__message">{message}</p>
    </div>
  );
}
