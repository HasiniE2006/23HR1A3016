// notification-app-be/src/index.js
//
// Environment variables (set in .env or shell):
//   EVAL_API_TOKEN  – Bearer token for the official evaluation API (required)
//   PORT            – HTTP port to listen on (default: 3001)

'use strict';

// ── Load .env ───────────────────────────────────────────────────────────────
// Node 22 does not auto-load .env; use --env-file flag OR the snippet below.
// We use a minimal inline reader so no extra library is needed.
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    });
}

// ── Dependencies ─────────────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const { requestLogger, errorLogger, logEvent } = require('../../logging-middleware');
const { sortByPriority, getTopPriorityUnread } = require('./priorityCalculator');

// ── Constants ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// Official evaluation API base URL
const EVAL_API_BASE = 'http://4.224.186.213/evaluation-service';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the Authorization header value for the evaluation API.
 * Reads EVAL_API_TOKEN from environment at call-time so the server can be
 * started before the token is set and the token can be rotated without restart.
 */
function getAuthHeader() {
  const token = process.env.EVAL_API_TOKEN || '';
  return token ? `Bearer ${token}` : '';
}

/**
 * Maps the external API notification shape to the internal shape expected by
 * the priority calculator and the frontend.
 *
 * External shape (observed):
 *   { id, title, message, notification_type, created_at, is_read?, ... }
 *
 * Internal shape:
 *   { id, title, message, type, isRead, createdAt }
 */
function normalizeNotification(raw) {
  return {
    id: raw.id ?? raw._id,
    title: raw.title ?? '',
    message: raw.message ?? raw.body ?? '',
    type: raw.notification_type ?? raw.type ?? 'Event',
    isRead: Boolean(raw.is_read ?? raw.isRead ?? false),
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Fetches notifications from the official evaluation API.
 *
 * @param {object} params
 * @param {number} [params.page=1]
 * @param {number} [params.limit=5]
 * @param {string} [params.notification_type]  – e.g. 'Placement', 'Result', 'Event'
 * @returns {Promise<{ notifications: Array, total: number, page: number, totalPages: number }>}
 */
async function fetchFromEvalAPI({ page = 1, limit = 5, notification_type } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (notification_type && notification_type !== 'All') {
    params.set('notification_type', notification_type);
  }

  const url = `${EVAL_API_BASE}/notifications?${params.toString()}`;
  const authHeader = getAuthHeader();

  logEvent('OutgoingApiRequest', `GET ${url} (page=${page}, limit=${limit}, type=${notification_type || 'All'})`);

  if (!authHeader) {
    logEvent('ApiError', 'EVAL_API_TOKEN is not set — request will fail authentication');
  }

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    logEvent('ApiError', `Evaluation API responded ${res.status}: ${body}`);
    throw new Error(`Evaluation API error: ${res.status} – ${body}`);
  }

  const raw = await res.json();

  logEvent('ApiSuccess', `Evaluation API responded 200 — raw payload keys: ${Object.keys(raw).join(', ')}`);

  // ── Normalise response shape ──────────────────────────────────────────────
  // The API may return: { data: [...] } or { notifications: [...] } or [...]
  let items = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (Array.isArray(raw.data)) {
    items = raw.data;
  } else if (Array.isArray(raw.notifications)) {
    items = raw.notifications;
  } else {
    logEvent('ApiWarning', `Unrecognised payload shape. Full response: ${JSON.stringify(raw).slice(0, 300)}`);
  }

  const normalised = items.map(normalizeNotification);

  // Pagination metadata — use what the API returns, or derive from array length
  const total = raw.total ?? raw.totalCount ?? normalised.length;
  const totalPages = raw.totalPages ?? raw.total_pages ?? Math.ceil(total / limit);

  return { notifications: normalised, total, page, totalPages };
}

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' })); // allow Vite dev server
app.use(express.json());
app.use(requestLogger);

// ── Routes ─────────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', evalApiBase: EVAL_API_BASE, tokenConfigured: Boolean(process.env.EVAL_API_TOKEN) });
});

/**
 * GET /notifications
 *
 * Query params (forwarded to evaluation API):
 *   notification_type  – Placement | Result | Event  (maps from legacy "type" too)
 *   page               – 1-indexed page number (default: 1)
 *   limit              – items per page (default: 5)
 *
 * Results are sorted by priority score before being returned to the frontend.
 */
app.get('/notifications', async (req, res, next) => {
  try {
    logEvent('IncomingRequest', `GET /notifications query=${JSON.stringify(req.query)}`);

    // Accept both "type" (frontend) and "notification_type" (API)
    const notification_type = req.query.notification_type || req.query.type || 'All';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 5);

    logEvent('NotificationFetch', `Proxying to evaluation API: type=${notification_type}, page=${page}, limit=${limit}`);

    const result = await fetchFromEvalAPI({ page, limit, notification_type });

    // Apply priority ordering on the fetched page
    result.notifications = sortByPriority(result.notifications);

    logEvent('NotificationFetch', `Returning ${result.notifications.length} notifications (total=${result.total}, pages=${result.totalPages})`);

    res.json(result);
  } catch (err) {
    logEvent('ApiError', `GET /notifications failed: ${err.message}`);
    next(err);
  }
});

/**
 * GET /notifications/priority-inbox
 *
 * Fetches a large batch from the evaluation API, applies the min-heap algorithm
 * to extract the top 10 unread notifications by priority score.
 */
app.get('/notifications/priority-inbox', async (req, res, next) => {
  try {
    logEvent('IncomingRequest', 'GET /notifications/priority-inbox');
    logEvent('NotificationFetch', 'Fetching batch from evaluation API for priority inbox calculation');

    // Fetch enough records for a meaningful priority calculation.
    // Use limit=50 to give the min-heap a large pool; adjust if the API caps lower.
    const result = await fetchFromEvalAPI({ page: 1, limit: 50, notification_type: 'All' });

    const top = getTopPriorityUnread(result.notifications, 10);

    logEvent('NotificationFetch', `Priority inbox computed: ${top.length} items from pool of ${result.notifications.length}`);

    res.json({ notifications: top, total: top.length });
  } catch (err) {
    logEvent('ApiError', `GET /notifications/priority-inbox failed: ${err.message}`);
    next(err);
  }
});

// Client-side log receiver — fronted logs arrive here and are written via logEvent
app.post('/client-log', (req, res, next) => {
  try {
    const { tag = 'FrontendLog', message = '' } = req.body || {};
    logEvent(tag, message);
    res.status(204).end();
  } catch (err) {
    logEvent('ApiError', `POST /client-log failed: ${err.message}`);
    next(err);
  }
});

// ── Error handling ─────────────────────────────────────────────────────────────
app.use(errorLogger);
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  logEvent('ServerStart', `Notification backend listening on http://localhost:${PORT}`);
  logEvent('ServerStart', `Evaluation API base: ${EVAL_API_BASE}`);
  if (!process.env.EVAL_API_TOKEN) {
    logEvent('ConfigWarning', 'EVAL_API_TOKEN is not set — set it in notification-app-be/.env before making API calls');
  }
});