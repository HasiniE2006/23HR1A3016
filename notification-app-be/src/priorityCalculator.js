// notification-app-be/src/priorityCalculator.js
// Reusable priority scoring utility for notifications.
// Imported by route handlers; logs through the existing logging middleware
// by writing to stdout (requestLogger already covers HTTP-level logging).

// ── Type weights ──────────────────────────────────────────────────────────
// Business rule: Placement > Result > Event
const TYPE_WEIGHTS = {
  Placement: 100,
  Result: 60,
  Event: 20,
};

// ── Recency scoring ───────────────────────────────────────────────────────
// A notification from today scores MAX_RECENCY points.
// Score decays by DECAY_PER_DAY for each calendar day of age, floored at 0.
const MAX_RECENCY = 50;
const DECAY_PER_DAY = 5;

/**
 * Returns a recency score between 0 and MAX_RECENCY.
 * @param {string} createdAt - ISO date string
 * @returns {number}
 */
function getRecencyScore(createdAt) {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.max(0, MAX_RECENCY - ageDays * DECAY_PER_DAY);
}

/**
 * Calculates the composite priority score for a single notification.
 *
 * Score = typeWeight + recencyScore
 *   typeWeight  : Placement=100, Result=60, Event=20
 *   recencyScore: 0–50 (50 = today, -5 per day, min 0)
 *
 * Maximum possible score : 150  (new Placement)
 * Minimum possible score :  20  (old Event)
 *
 * @param {{ type: string, createdAt: string }} notification
 * @returns {number}
 */
function calculatePriority(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.type] ?? 0;
  const recencyScore = getRecencyScore(notification.createdAt);
  return typeWeight + recencyScore;
}

/**
 * Sorts an array of notifications by priority score, highest first.
 * Does not mutate the original array.
 * @param {Array} notifications
 * @returns {Array}
 */
function sortByPriority(notifications) {
  return [...notifications].sort(
    (a, b) => calculatePriority(b) - calculatePriority(a)
  );
}

/**
 * Returns the top N unread notifications sorted by priority score.
 * Logs a summary line so the existing logging middleware captures it.
 *
 * @param {Array}  notifications - full pool of notifications
 * @param {number} [limit=10]   - how many to return
 * @returns {Array}
 */
function getTopPriorityUnread(notifications, limit = 10) {
  const unread = notifications.filter((n) => !n.isRead);

  const scored = unread.map((n) => ({
    ...n,
    priorityScore: Math.round(calculatePriority(n) * 100) / 100,
  }));

  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const top = scored.slice(0, limit);

  // Log through stdout — picked up by the requestLogger middleware context
  console.log(
    `[PriorityCalculator] pool=${notifications.length} unread=${unread.length} top=${top.length} limit=${limit}`
  );

  return top;
}

module.exports = { calculatePriority, sortByPriority, getTopPriorityUnread };
