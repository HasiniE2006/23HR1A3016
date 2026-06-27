// notification-app-fe/src/api/notifications.js
// All notification data comes from the backend proxy which calls the
// official evaluation API. No static or mock data is used anywhere.

const BASE_URL = 'http://localhost:3001';

/**
 * Posts a structured log event to the backend /client-log endpoint.
 * The backend writes it via the logging middleware (logEvent).
 * Failures are silently swallowed so logging never breaks the app.
 *
 * @param {string} tag     – event category, e.g. 'FrontendApiCall'
 * @param {string} message – human-readable detail
 */
export async function logClientEvent(tag, message) {
  try {
    await fetch(`${BASE_URL}/client-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, message }),
    });
  } catch {
    // Logging must never crash the UI — fail silently
  }
}

/**
 * Helper to fetch any stored authentication token from localStorage
 * and construct appropriate headers.
 */
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Fetch paginated notifications from the backend proxy.
 * The backend forwards the request to the official evaluation API with the
 * stored auth token, sorts results by priority, and returns them here.
 *
 * @param {object} params
 * @param {string} [params.type='All']  – 'All' | 'Placement' | 'Result' | 'Event'
 * @param {number} [params.page=1]      – 1-indexed page number
 * @param {number} [params.limit=5]     – items per page
 * @returns {Promise<{ notifications: Array, total: number, page: number, totalPages: number }>}
 */
export async function fetchNotifications({ type = 'All', page = 1, limit = 5 } = {}) {
  await logClientEvent(
    'FrontendApiCall',
    `fetchNotifications: type=${type}, page=${page}, limit=${limit}`,
  );

  const params = new URLSearchParams({ page, limit });
  // Forward the type as notification_type (the evaluation API's query param name)
  if (type && type !== 'All') params.set('notification_type', type);

  try {
    const res = await fetch(`${BASE_URL}/notifications?${params.toString()}`, {
      headers: {
        ...getAuthHeaders()
      }
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error || `Server responded with status ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    await logClientEvent(
      'FrontendApiSuccess',
      `fetchNotifications returned ${data.notifications?.length ?? 0} items (total=${data.total})`,
    );
    return data;
  } catch (err) {
    await logClientEvent('FrontendApiError', `fetchNotifications failed: ${err.message}`);
    throw err;
  }
}

/**
 * Fetch the top 10 highest-priority unread notifications.
 * The backend fetches a large pool from the evaluation API, runs the min-heap
 * algorithm, and returns the pre-ranked results.
 *
 * @returns {Promise<{ notifications: Array, total: number }>}
 */
export async function fetchPriorityInbox() {
  await logClientEvent('FrontendApiCall', 'fetchPriorityInbox initiated');
  try {
    const res = await fetch(`${BASE_URL}/notifications/priority-inbox`, {
      headers: {
        ...getAuthHeaders()
      }
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = body.error || `Server responded with status ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();
    await logClientEvent(
      'FrontendApiSuccess',
      `fetchPriorityInbox returned ${data.notifications?.length ?? 0} items`,
    );
    return data;
  } catch (err) {
    await logClientEvent('FrontendApiError', `fetchPriorityInbox failed: ${err.message}`);
    throw err;
  }
}
