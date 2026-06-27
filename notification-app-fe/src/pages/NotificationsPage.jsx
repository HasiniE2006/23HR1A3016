// notification-app-fe/src/pages/NotificationsPage.jsx
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationFilter } from '../components/NotificationFilter';
import { PriorityInbox } from '../components/PriorityInbox';
import './NotificationsPage.css';

/**
 * Main page: lists notifications fetched from the backend.
 * Supports type filtering and pagination.
 */
export function NotificationsPage() {
  const {
    notifications,
    total,
    totalPages,
    loading,
    error,
    filter,
    setFilter,
    page,
    setPage,
  } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <main className="notifications-page">
      <header className="notifications-page__header">
        <div className="notifications-page__title-row">
          <span className="notifications-page__icon" aria-hidden="true">🔔</span>
          <h1 className="notifications-page__title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="notifications-page__badge">{unreadCount}</span>
          )}
        </div>
        <p className="notifications-page__subtitle">
          {total} notification{total !== 1 ? 's' : ''} found
        </p>
      </header>

      <hr className="notifications-page__divider" />

      <PriorityInbox />

      <NotificationFilter value={filter} onChange={handleFilterChange} />

      <section className="notifications-page__list" aria-live="polite">
        {loading && (
          <div className="notifications-page__spinner" role="status" aria-label="Loading">
            <div className="spinner" />
            <p>Loading notifications…</p>
          </div>
        )}

        {!loading && error && (
          <div className="notifications-page__error" role="alert">
            <span>⚠️</span> Failed to load notifications: {error}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="notifications-page__empty">
            <span>📭</span>
            <p>No notifications found.</p>
          </div>
        )}

        {!loading && !error && notifications.map((n) => (
          <NotificationCard key={n.id} notification={n} />
        ))}
      </section>

      {!loading && totalPages > 1 && (
        <nav className="pagination" aria-label="Notification pages">
          <button
            className="pagination__btn"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination__btn ${p === page ? 'pagination__btn--active' : ''}`}
              onClick={() => handlePageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}

          <button
            className="pagination__btn"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            Next →
          </button>
        </nav>
      )}
    </main>
  );
}
