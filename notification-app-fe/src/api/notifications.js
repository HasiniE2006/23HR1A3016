const BASE_URL = 'http://localhost:3001';

/**
 * Fetch paginated notifications from the backend.
 * @param {object} params
 * @param {string} [params.type]  - filter type: All | Placement | Result | Event
 * @param {number} [params.page]  - 1-indexed page number
 * @param {number} [params.limit] - items per page
 */
export async function fetchNotifications({ type = 'All', page = 1, limit = 5 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (type && type !== 'All') params.set('type', type);

  const res = await fetch(`${BASE_URL}/notifications?${params.toString()}`);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json(); // { notifications, total, page, totalPages }
}

/**
 * Fetch the top 10 highest-priority unread notifications.
 * Returns { notifications, total } where each item has a priorityScore field.
 */
export async function fetchPriorityInbox() {
  const res = await fetch(`${BASE_URL}/notifications/priority-inbox`);
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json(); // { notifications, total }
}
