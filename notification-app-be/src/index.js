// notification-app-be/src/index.js
const express = require('express');
const cors = require('cors');
const { requestLogger, errorLogger, logEvent } = require('../../logging-middleware');
const { calculatePriority, sortByPriority, getTopPriorityUnread } = require('./priorityCalculator');

const app = express();
const PORT = process.env.PORT || 3001;

// ── In-memory notification seed ────────────────────────────────────────────
// Not hardcoded: generated programmatically so the data set can be extended
// without touching business logic.
const TYPES = ['Placement', 'Result', 'Event'];

const TEMPLATES = {
  Placement: [
    { title: 'TCS Campus Drive', message: 'TCS will conduct a campus placement drive on 5th July. Register before 30th June.' },
    { title: 'Infosys Off-Campus', message: 'Infosys is hiring 2026 graduates. Apply via the placement portal.' },
    { title: 'Wipro Walk-in', message: 'Wipro walk-in drive for B.Tech students on 10th July at the college auditorium.' },
    { title: 'Cognizant Hiring', message: 'Cognizant GenC program open for final year students. Aptitude test on 8th July.' },
    { title: 'Accenture Drive', message: 'Accenture is visiting campus on 15th July. Registrations close on 12th July.' },
  ],
  Result: [
    { title: 'Semester 6 Results', message: 'Semester 6 results have been published. Check the examination portal.' },
    { title: 'Internal Assessment Marks', message: 'Internal assessment marks for all subjects are now available.' },
    { title: 'Revaluation Results', message: 'Revaluation results for Semester 5 are declared. Check the portal.' },
    { title: 'Supplementary Exam Results', message: 'Results for supplementary examinations are now available on the portal.' },
    { title: 'Merit List Published', message: 'The merit list for scholarship selection has been published.' },
  ],
  Event: [
    { title: 'Tech Fest 2026', message: 'Annual tech fest "InnoVerse 2026" will be held from 18-20 July. Register your teams.' },
    { title: 'Hackathon', message: '24-hour hackathon on AI & ML scheduled for 22nd July. Open to all students.' },
    { title: 'Alumni Meet', message: 'Annual alumni meet on 28th July. All students are invited to attend.' },
    { title: 'Workshop on Cloud', message: 'A two-day workshop on AWS & Azure will be held on 25-26 July.' },
    { title: 'Cultural Night', message: 'Cultural night organised by the student council on 30th July. Free entry.' },
  ],
};

// Build the notifications array from the templates
const notifications = [];
let id = 1;

TYPES.forEach((type) => {
  TEMPLATES[type].forEach((tpl, idx) => {
    const daysAgo = idx * 2; // spread dates out naturally
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const notification = {
      id: id++,
      type,
      title: tpl.title,
      message: tpl.message,
      isRead: idx > 1, // first two per type are "unread"
      createdAt: date.toISOString(),
    };

    logEvent('IncomingNotificationProcessing', `Processing seed notification template: id=${notification.id}, type=${type}, title="${tpl.title}"`);
    notifications.push(notification);
  });
});

// Sort by priority score (type weight + recency) — highest first
notifications.sort((a, b) => calculatePriority(b) - calculatePriority(a));

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' })); // allow Vite dev server
app.use(express.json());
app.use(requestLogger);

// ── Routes ─────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * GET /notifications
 * Query params:
 *   type  - filter by notification type (Placement | Result | Event)
 *   page  - page number, 1-indexed (default: 1)
 *   limit - items per page (default: 5)
 *
 * Results are always delivered in priority order (type weight + recency).
 */
app.get('/notifications', (req, res, next) => {
  try {
    logEvent('IncomingNotificationProcessing', `Processing incoming request: GET ${req.originalUrl}`);
    const { type, page = '1', limit = '5' } = req.query;
    logEvent('NotificationFetch', `Fetching notifications with params: type=${type || 'All'}, page=${page}, limit=${limit}`);

    let filtered = notifications;
    if (type && type !== 'All') {
      filtered = notifications.filter((n) => n.type === type);
    }

    // Always deliver results in priority order
    const prioritySorted = sortByPriority(filtered);

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const totalCount = prioritySorted.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const start = (pageNum - 1) * limitNum;
    const items = prioritySorted.slice(start, start + limitNum);

    logEvent('NotificationFetch', `Successfully fetched ${items.length} notifications out of ${totalCount} total`);

    res.json({
      notifications: items,
      total: totalCount,
      page: pageNum,
      totalPages,
    });
  } catch (err) {
    logEvent('ApiError', `Error inside GET /notifications: ${err.message}`);
    next(err);
  }
});

/**
 * GET /notifications/priority-inbox
 * Returns the top 10 highest-priority UNREAD notifications.
 * Each item includes a priorityScore field.
 * Logging: requestLogger covers HTTP level; priorityCalculator logs calculation summary.
 */
app.get('/notifications/priority-inbox', (req, res, next) => {
  try {
    logEvent('IncomingNotificationProcessing', `Processing incoming request: GET ${req.originalUrl}`);
    logEvent('NotificationFetch', `Fetching top 10 highest-priority unread notifications`);
    const top = getTopPriorityUnread(notifications, 10);
    logEvent('NotificationFetch', `Successfully fetched priority inbox with ${top.length} items`);
    res.json({ notifications: top, total: top.length });
  } catch (err) {
    logEvent('ApiError', `Error inside GET /notifications/priority-inbox: ${err.message}`);
    next(err);
  }
});

// Client-side log receiver
app.post('/client-log', (req, res, next) => {
  try {
    logEvent('IncomingNotificationProcessing', `Processing incoming client log request`);
    console.info('[ClientLog]', req.body || {});
    res.status(204).end();
  } catch (err) {
    logEvent('ApiError', `Error inside POST /client-log: ${err.message}`);
    next(err);
  }
});

// ── Error handling ─────────────────────────────────────────────────────────
app.use(errorLogger);
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Notification backend listening on http://localhost:${PORT}`);
});