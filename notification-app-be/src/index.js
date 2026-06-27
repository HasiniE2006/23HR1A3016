// notification-app-be/src/index.js
//
// Environment variables (set in .env):
//   EVAL_API_TOKEN      – Current Bearer token (auto-refreshed at runtime)
//   EVAL_CLIENT_ID      – clientID for token refresh
//   EVAL_CLIENT_SECRET  – clientSecret for token refresh
//   EVAL_ACCESS_CODE    – accessCode for token refresh
//   EVAL_EMAIL          – email for token refresh
//   EVAL_NAME           – name for token refresh
//   EVAL_ROLL_NO        – rollNo for token refresh
//   PORT                – HTTP port (default: 3001)

'use strict';

// ── Load .env ────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
function loadEnvFile() {
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val; // always overwrite so refreshed tokens take effect
    });
}
loadEnvFile();

// ── Dependencies ──────────────────────────────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const { requestLogger, errorLogger, logEvent } = require('../../logging-middleware');
const { sortByPriority, getTopPriorityUnread }  = require('./priorityCalculator');

// ── Constants ─────────────────────────────────────────────────────────────────
const app          = express();
const PORT         = process.env.PORT || 3001;
const EVAL_API_BASE = 'http://4.224.186.213/evaluation-service';

// ── Token manager (in-memory cache + auto-refresh) ────────────────────────────

let _cachedToken    = process.env.EVAL_API_TOKEN || '';
let _tokenExpiresAt = 0; // Unix ms

/** Decode exp from a JWT payload without verifying signature. */
function jwtExpMs(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString()
    );
    const exp = payload.MapClaims?.exp ?? payload.exp;
    return exp ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

// Seed the expiry from the initial token
if (_cachedToken) {
  _tokenExpiresAt = jwtExpMs(_cachedToken);
}

/**
 * Fetch a fresh access_token from the evaluation auth endpoint using the
 * credentials stored in environment variables.
 */
async function refreshToken() {
  const body = {
    email:        process.env.EVAL_EMAIL        || '',
    name:         process.env.EVAL_NAME         || '',
    rollNo:       process.env.EVAL_ROLL_NO      || '',
    accessCode:   process.env.EVAL_ACCESS_CODE  || '',
    clientID:     process.env.EVAL_CLIENT_ID    || '',
    clientSecret: process.env.EVAL_CLIENT_SECRET || '',
  };

  if (!body.clientID || !body.clientSecret) {
    logEvent('ConfigWarning', 'Cannot auto-refresh token: EVAL_CLIENT_ID / EVAL_CLIENT_SECRET not set in .env');
    return null;
  }

  logEvent('TokenRefresh', 'Requesting new access token from evaluation auth endpoint…');

  const res = await fetch(`${EVAL_API_BASE}/auth`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    logEvent('TokenRefresh', `Auth endpoint returned ${res.status}: ${text}`);
    return null;
  }

  const data = await res.json();
  const newToken = data.access_token;

  if (!newToken) {
    logEvent('TokenRefresh', `Auth response missing access_token: ${JSON.stringify(data)}`);
    return null;
  }

  _cachedToken    = newToken;
  _tokenExpiresAt = jwtExpMs(newToken);

  // Persist to .env so a server restart still has a valid token
  try {
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (/^EVAL_API_TOKEN=/m.test(envContent)) {
      envContent = envContent.replace(/^EVAL_API_TOKEN=.*/m, `EVAL_API_TOKEN=${newToken}`);
    } else {
      envContent += `\nEVAL_API_TOKEN=${newToken}`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
  } catch (e) {
    logEvent('TokenRefresh', `Warning: could not persist token to .env: ${e.message}`);
  }

  logEvent('TokenRefresh', `New token obtained — expires at ${new Date(_tokenExpiresAt).toISOString()}`);
  return newToken;
}

/**
 * Returns a valid Bearer token, refreshing automatically if the current one
 * is within 60 seconds of expiry or already expired.
 */
async function getValidToken() {
  const nowMs = Date.now();
  const bufferMs = 60 * 1000; // 60 second buffer

  if (_cachedToken && _tokenExpiresAt > nowMs + bufferMs) {
    return _cachedToken; // Still valid
  }

  logEvent('TokenRefresh', 'Token expired or nearing expiry — auto-refreshing…');
  const fresh = await refreshToken();
  return fresh || _cachedToken; // Fall back to cached if refresh fails
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Maps the external API notification shape to the internal shape expected by
 * the priority calculator and the frontend.
 *
 * The evaluation API returns:  { ID, Type, Message, Timestamp }
 * Internal shape expected:     { id, title, message, type, isRead, createdAt }
 */
function normalizeNotification(raw) {
  // Support both uppercase (evaluation API) and lowercase (legacy) field names
  const id        = raw.ID        ?? raw.id        ?? raw._id   ?? null;
  const type      = raw.Type      ?? raw.notification_type ?? raw.type ?? 'Event';
  const message   = raw.Message   ?? raw.message   ?? raw.body  ?? '';
  const timestamp = raw.Timestamp ?? raw.created_at ?? raw.createdAt ?? new Date().toISOString();

  return {
    id,
    // Use the Message as the title (API has no separate title field)
    title:     message,
    message,
    type,
    isRead:    Boolean(raw.is_read ?? raw.isRead ?? false),
    createdAt: timestamp,
  };
}


/**
 * Fetches notifications from the official evaluation API.
 * Automatically refreshes the Bearer token if it has expired.
 */
async function fetchFromEvalAPI(req, { page = 1, limit = 5, notification_type } = {}) {
  // Enforce the API's limit constraints: min=5, max=10
  const safeLimit = Math.min(10, Math.max(5, limit));

  const params = new URLSearchParams({ page, limit: safeLimit });
  if (notification_type && notification_type !== 'All') {
    params.set('notification_type', notification_type);
  }

  const url = `${EVAL_API_BASE}/notifications?${params.toString()}`;

  logEvent('OutgoingApiRequest', `GET ${url} (page=${page}, limit=${safeLimit}, type=${notification_type || 'All'})`);

  // Prefer client-supplied Authorization header; fall back to managed token
  let authHeader = (req && req.headers.authorization) || '';
  if (!authHeader) {
    const token = await getValidToken();
    authHeader  = token ? `Bearer ${token}` : '';
  }

  if (!authHeader) {
    logEvent('ApiError', 'No auth token available — set EVAL_CLIENT_ID + EVAL_CLIENT_SECRET in .env for auto-refresh');
  }

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      Accept:        'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    logEvent('ApiError', `Evaluation API responded ${res.status}: ${body}`);

    let cleanMessage = body;
    try {
      const json = JSON.parse(body);
      cleanMessage = json.message || json.error || body;
    } catch { /* not JSON */ }

    // If 401 and we have refresh credentials, try once more with a fresh token
    if (res.status === 401 && (process.env.EVAL_CLIENT_ID || '')) {
      logEvent('TokenRefresh', 'Got 401 — attempting token refresh and retry…');
      const fresh = await refreshToken();
      if (fresh) {
        return fetchFromEvalAPI(null, { page, limit: safeLimit, notification_type }); // retry without req to use new token
      }
    }

    const err = new Error(cleanMessage);
    err.status = res.status;
    throw err;
  }

  const raw = await res.json();
  logEvent('ApiSuccess', `Evaluation API responded 200 — keys: ${Object.keys(raw).join(', ')}`);

  // Normalise response shape
  let items = [];
  if (Array.isArray(raw))                   items = raw;
  else if (Array.isArray(raw.data))         items = raw.data;
  else if (Array.isArray(raw.notifications)) items = raw.notifications;
  else {
    logEvent('ApiWarning', `Unrecognised payload shape: ${JSON.stringify(raw).slice(0, 300)}`);
  }

  const normalised = items.map(normalizeNotification);
  const total      = raw.total ?? raw.totalCount ?? normalised.length;
  const totalPages = raw.totalPages ?? raw.total_pages ?? Math.ceil(total / safeLimit);

  return { notifications: normalised, total, page, totalPages };
}

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(requestLogger);

// ── Routes ─────────────────────────────────────────────────────────────────────

// Health check — shows token status without exposing the token itself
app.get('/health', async (req, res) => {
  const nowMs  = Date.now();
  const hasCredentials = Boolean(process.env.EVAL_CLIENT_ID && process.env.EVAL_CLIENT_SECRET);
  res.json({
    status:           'ok',
    evalApiBase:      EVAL_API_BASE,
    tokenConfigured:  Boolean(_cachedToken),
    tokenExpired:     _tokenExpiresAt > 0 && _tokenExpiresAt < nowMs,
    tokenExpiresAt:   _tokenExpiresAt ? new Date(_tokenExpiresAt).toISOString() : null,
    autoRefreshReady: hasCredentials,
  });
});

/**
 * GET /notifications
 *
 * Query params forwarded to evaluation API:
 *   notification_type  – Placement | Result | Event
 *   page               – 1-indexed (default: 1)
 *   limit              – items per page (default: 5, min: 5)
 *
 * Results are sorted by priority score before being returned.
 */
app.get('/notifications', async (req, res, next) => {
  try {
    logEvent('IncomingRequest', `GET /notifications query=${JSON.stringify(req.query)}`);

    const notification_type = req.query.notification_type || req.query.type || 'All';
    const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
    const limit = Math.min(10, Math.max(5, parseInt(req.query.limit, 10) || 5));

    logEvent('NotificationFetch', `Proxying: type=${notification_type}, page=${page}, limit=${limit}`);

    const result = await fetchFromEvalAPI(req, { page, limit, notification_type });
    result.notifications = sortByPriority(result.notifications);

    logEvent('NotificationFetch', `Returning ${result.notifications.length} items (total=${result.total}, pages=${result.totalPages})`);

    res.json(result);
  } catch (err) {
    logEvent('ApiError', `GET /notifications failed: ${err.message}`);
    next(err);
  }
});

/**
 * GET /notifications/priority-inbox
 *
 * Fetches a large batch, applies min-heap to extract top 10 unread by priority.
 */
app.get('/notifications/priority-inbox', async (req, res, next) => {
  try {
    logEvent('IncomingRequest', 'GET /notifications/priority-inbox');
    logEvent('NotificationFetch', 'Fetching batch for priority inbox calculation');

    const result = await fetchFromEvalAPI(req, { page: 1, limit: 10, notification_type: 'All' });
    const top    = getTopPriorityUnread(result.notifications, 10);

    logEvent('NotificationFetch', `Priority inbox: ${top.length} items from pool of ${result.notifications.length}`);

    res.json({ notifications: top, total: top.length });
  } catch (err) {
    logEvent('ApiError', `GET /notifications/priority-inbox failed: ${err.message}`);
    next(err);
  }
});

// Client-side log receiver
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

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logEvent('ServerStart', `Notification backend listening on http://localhost:${PORT}`);
  logEvent('ServerStart', `Evaluation API base: ${EVAL_API_BASE}`);

  const hasCredentials = Boolean(process.env.EVAL_CLIENT_ID && process.env.EVAL_CLIENT_SECRET);

  if (!_cachedToken) {
    logEvent('ConfigWarning', 'No EVAL_API_TOKEN in .env — token will be fetched on first request');
  } else {
    const expStr = _tokenExpiresAt ? new Date(_tokenExpiresAt).toISOString() : 'unknown';
    logEvent('ServerStart', `Token loaded — expires at ${expStr}`);
  }

  if (hasCredentials) {
    logEvent('ServerStart', 'Auto-refresh enabled: token will renew automatically before expiry');
  } else {
    logEvent('ConfigWarning', 'EVAL_CLIENT_ID/EVAL_CLIENT_SECRET not set — auto-refresh disabled');
  }
});