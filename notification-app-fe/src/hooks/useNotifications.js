import { useState, useEffect } from 'react';
import { fetchNotifications } from '../api/notifications';

/**
 * Custom hook that fetches notifications whenever filter or page changes.
 * Returns data, pagination metadata, loading/error state, and setters.
 */
export function useNotifications() {
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotifications({ type: filter, page });
        if (!cancelled) {
          setNotifications(data.notifications ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [filter, page]); // re-fetch only when filter or page changes

  return { notifications, total, totalPages, loading, error, filter, setFilter, page, setPage };
}
