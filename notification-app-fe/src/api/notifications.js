const BASE_URL = 'http://localhost:3001';

/**
 * Sends a client log to the backend logging middleware.
 * @param {string} tag     - The category/tag of the log event
 * @param {string} message - Detailed log message
 */
export async function logClientEvent(tag, message) {
  try {
    await fetch(`${BASE_URL}/client-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tag, message }),
    });
  } catch (err) {
    console.error('Failed to send client log to backend:', err);
  }
}

/**
 * Fetch paginated notifications from the backend.
 * @param {object} params
 * @param {string} [params.type]  - filter type: All | Placement | Result | Event
 * @param {number} [params.page]  - 1-indexed page number
 * @param {number} [params.limit] - items per page
 */
export async function fetchNotifications({ type = 'All', page = 1, limit = 5 } = {}) {
  await logClientEvent('FrontendApiCall', `fetchNotifications initiated: type=${type}, page=${page}, limit=${limit}`);
  const params = new URLSearchParams({ page, limit });
  if (type && type !== 'All') params.set('type', type);

  try {
    const res = await fetch(`${BASE_URL}/notifications?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    await logClientEvent('FrontendApiSuccess', `fetchNotifications successfully completed. Items fetched: ${data.notifications?.length || 0}`);
    return data;
  } catch (err) {
    await logClientEvent('FrontendApiError', `fetchNotifications failed: ${err.message}`);
    throw err;
  }
}

/**
 * Fetch the top 10 highest-priority unread notifications.
 * Returns { notifications, total } where each item has a priorityScore field.
 */
export async function fetchPriorityInbox() {
  await logClientEvent('FrontendApiCall', 'fetchPriorityInbox initiated');
  try {
    const res = await fetch(`${BASE_URL}/notifications/priority-inbox`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }
    const data = await res.json();
    await logClientEvent('FrontendApiSuccess', `fetchPriorityInbox successfully completed. Items fetched: ${data.notifications?.length || 0}`);
    return data;
  } catch (err) {
    await logClientEvent('FrontendApiError', `fetchPriorityInbox failed: ${err.message}`);
    throw err;
  }
}
