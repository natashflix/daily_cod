import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'game.db');

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    session_id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    current_level INTEGER NOT NULL DEFAULT 1,
    level_start_at INTEGER NOT NULL,
    messages_this_level INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS level_results (
    session_id TEXT NOT NULL,
    level_id INTEGER NOT NULL,
    seconds_spent INTEGER NOT NULL,
    points INTEGER NOT NULL,
    completed_at INTEGER NOT NULL,
    PRIMARY KEY (session_id, level_id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    level_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export function createPlayer(sessionId, nickname) {
  const now = Date.now();
  db.prepare(
    `INSERT INTO players (session_id, nickname, started_at, level_start_at)
     VALUES (?, ?, ?, ?)`,
  ).run(sessionId, nickname, now, now);
}

export function getPlayer(sessionId) {
  return db.prepare(`SELECT * FROM players WHERE session_id = ?`).get(sessionId);
}

export function setPlayerLevel(sessionId, level, levelStartAt) {
  db.prepare(
    `UPDATE players SET current_level = ?, level_start_at = ?, messages_this_level = 0 WHERE session_id = ?`,
  ).run(level, levelStartAt, sessionId);
}

export function incrementMessageCount(sessionId) {
  db.prepare(
    `UPDATE players SET messages_this_level = messages_this_level + 1 WHERE session_id = ?`,
  ).run(sessionId);
}

export function finishPlayer(sessionId) {
  db.prepare(`UPDATE players SET finished_at = ? WHERE session_id = ?`).run(
    Date.now(),
    sessionId,
  );
}

export function addLevelResult(sessionId, levelId, secondsSpent, points) {
  db.prepare(
    `INSERT OR REPLACE INTO level_results (session_id, level_id, seconds_spent, points, completed_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(sessionId, levelId, secondsSpent, points, Date.now());
}

export function getLevelResults(sessionId) {
  return db
    .prepare(`SELECT * FROM level_results WHERE session_id = ? ORDER BY level_id`)
    .all(sessionId);
}

export function addChatMessage(sessionId, levelId, role, content) {
  db.prepare(
    `INSERT INTO chat_history (session_id, level_id, role, content, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(sessionId, levelId, role, content, Date.now());
}

export function getChatHistory(sessionId, levelId) {
  return db
    .prepare(
      `SELECT role, content FROM chat_history
       WHERE session_id = ? AND level_id = ? ORDER BY id ASC`,
    )
    .all(sessionId, levelId);
}

export function getLeaderboard() {
  return db
    .prepare(
      `SELECT
         p.nickname,
         p.started_at,
         p.finished_at,
         p.current_level,
         COALESCE(SUM(r.points), 0) AS score,
         COUNT(r.level_id) AS levels_completed
       FROM players p
       LEFT JOIN level_results r ON r.session_id = p.session_id
       GROUP BY p.session_id
       ORDER BY levels_completed DESC, score DESC, p.started_at ASC`,
    )
    .all();
}

export default db;
