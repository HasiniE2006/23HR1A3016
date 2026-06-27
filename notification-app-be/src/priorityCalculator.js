// notification-app-be/src/priorityCalculator.js
// Reusable priority scoring utility for notifications.
// Imported by route handlers; logs through the existing logging middleware.

const { logEvent } = require('../../logging-middleware');

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
 *   recencyScore: 0-50 (50 = today, -5 per day, min 0)
 *
 * Maximum possible score : 150  (new Placement today)
 * Minimum possible score :  20  (old Event)
 *
 * @param {{ type: string, createdAt: string }} notification
 * @returns {number}
 */
function calculatePriority(notification) {
  const typeWeight = TYPE_WEIGHTS[notification.type] ?? 0;
  const recencyScore = getRecencyScore(notification.createdAt);
  const score = typeWeight + recencyScore;
  logEvent('PriorityCalculation', `Notification ID=${notification.id} (Type=${notification.type}, Title="${notification.title}") calculated: weight=${typeWeight}, recencyScore=${recencyScore.toFixed(2)}, totalScore=${score.toFixed(2)}`);
  return score;
}

/**
 * Sorts an array of notifications by priority score, highest first.
 * Does not mutate the original array.
 * Used by GET /notifications for paginated, priority-ordered results.
 * @param {Array} notifications
 * @returns {Array}
 */
function sortByPriority(notifications) {
  logEvent('PriorityRanking', `Sorting ${notifications.length} notifications by priority score`);
  const sorted = [...notifications].sort(
    (a, b) => calculatePriority(b) - calculatePriority(a)
  );
  logEvent('PriorityRanking', `Sorted results (top 3): ${sorted.slice(0, 3).map(n => `[ID=${n.id}, Score=${n.priorityScore || ''}]`).join(', ')}`);
  return sorted;
}

// ── Min-Heap ──────────────────────────────────────────────────────────────
// A fixed-size min-heap keyed by priorityScore.
//
// Why a min-heap for finding the TOP K?
//   The heap root always holds the LOWEST score inside the current top-K
//   window. When a new notification arrives we need only one comparison:
//   if its score beats the root (the current worst-of-the-best), we evict
//   the root and insert the newcomer. The heap stays bounded at K at all
//   times — no revisiting of previously processed items.
//
// Core operations:
//   push(item)  O(log K)  bubble new leaf up to its correct position
//   pop()       O(log K)  pull root out, sift last element down
//
// Time complexity of getTopPriorityUnread  (N = pool size, K = limit = 10):
//
//   Previous approach  →  filter O(N) + map O(N) + sort O(N log N) + slice O(K)
//                      =  O(N log N)   grows with every new notification
//
//   Min-heap approach  →  single scan O(N), each item costs at most O(log K)
//                      =  O(N log K)
//                      =  O(N)         because K = 10 is a constant
//
// Space: O(K)  — heap never grows beyond the limit.

class MinHeap {
  constructor() {
    this._data = [];
  }

  get size() {
    return this._data.length;
  }

  // Root is always the item with the LOWEST priorityScore.
  get min() {
    return this._data[0];
  }

  // Insert item and restore heap property upward.  O(log K)
  push(item) {
    this._data.push(item);
    this._bubbleUp(this._data.length - 1);
  }

  // Remove and return the minimum item, restore heap property downward.  O(log K)
  pop() {
    const top = this._data[0];
    const last = this._data.pop();        // detach the last leaf
    if (this._data.length > 0) {
      this._data[0] = last;               // promote it to root
      this._siftDown(0);                  // restore heap property
    }
    return top;
  }

  // Swap child with parent while child has a smaller score.
  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._data[parent].priorityScore <= this._data[i].priorityScore) break;
      [this._data[parent], this._data[i]] = [this._data[i], this._data[parent]];
      i = parent;
    }
  }

  // Swap root with its smallest child until heap property holds.
  _siftDown(i) {
    const n = this._data.length;
    while (true) {
      let smallest = i;
      const left  = 2 * i + 1;
      const right = 2 * i + 2;

      if (left  < n && this._data[left].priorityScore  < this._data[smallest].priorityScore) smallest = left;
      if (right < n && this._data[right].priorityScore < this._data[smallest].priorityScore) smallest = right;

      if (smallest === i) break;
      [this._data[smallest], this._data[i]] = [this._data[i], this._data[smallest]];
      i = smallest;
    }
  }

  // Return all items sorted highest-first.
  // O(K log K) — with K = 10 this is negligible.
  toSortedDesc() {
    return [...this._data].sort((a, b) => b.priorityScore - a.priorityScore);
  }
}

/**
 * Returns the top `limit` unread notifications by priority score.
 *
 * Uses a fixed-size min-heap for O(N log K) time instead of O(N log N).
 * Handles a continuous stream of incoming notifications efficiently:
 * each new item costs at most one push + one pop — O(log K) — regardless
 * of how large the total pool grows.
 *
 * @param {Array}  notifications - full pool of notifications
 * @param {number} [limit=10]   - heap capacity (max items returned)
 * @returns {Array} top `limit` unread items, highest-priority first,
 *                  each decorated with a rounded `priorityScore` field
 */
function getTopPriorityUnread(notifications, limit = 10) {
  logEvent('PriorityRanking', `Ranking top unread notifications via Min-Heap scan from a pool of ${notifications.length} items`);
  const heap = new MinHeap();

  for (const n of notifications) {
    if (n.isRead) continue;   // skip read items — one comparison, no heap work

    const score = Math.round(calculatePriority(n) * 100) / 100;

    if (heap.size < limit) {
      // Heap not yet full — always insert.
      heap.push({ ...n, priorityScore: score });
    } else if (score > heap.min.priorityScore) {
      // This item outscores the current worst-of-the-best — swap it in.
      heap.pop();
      heap.push({ ...n, priorityScore: score });
    }
    // Otherwise: below the threshold — zero heap operations, constant cost.
  }

  const result = heap.toSortedDesc();

  // Log through stdout using logEvent helper
  logEvent(
    'PriorityRanking',
    `Min-heap scan completed: pool=${notifications.length} top=${result.length} limit=${limit} complexity=O(N log K) K=${limit}. Results: ${result.map(n => `[ID=${n.id}, Score=${n.priorityScore}]`).join(', ')}`
  );

  return result;
}

module.exports = { calculatePriority, sortByPriority, getTopPriorityUnread };
