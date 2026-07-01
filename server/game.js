import crypto from 'node:crypto';
import { LEVELS, TOTAL_LEVELS, MAX_SCORE, getLevel } from './levels.js';
import { runLevel1, runLevel2, runLevel3, runLevel4, runLevel5 } from './ruleBot.js';
import * as db from './db.js';

const MAX_MESSAGES_PER_LEVEL = 50;

export function startGame(nickname) {
  const sessionId = crypto.randomUUID();
  const cleanNick = nickname.trim().slice(0, 24) || 'Аноним';
  db.createPlayer(sessionId, cleanNick);
  return sessionId;
}

function pointsForLevel(basePoints, secondsSpent) {
  const floor = Math.round(basePoints * 0.1);
  return Math.max(floor, basePoints - secondsSpent);
}

export function getState(sessionId) {
  const player = db.getPlayer(sessionId);
  if (!player) return null;

  const finished = player.current_level > TOTAL_LEVELS;
  const level = finished ? null : getLevel(player.current_level);
  const now = Date.now();
  const results = db.getLevelResults(sessionId);
  const score = results.reduce((sum, r) => sum + r.points, 0);

  return {
    nickname: player.nickname,
    currentLevel: player.current_level,
    totalLevels: TOTAL_LEVELS,
    levelTitle: level?.title ?? null,
    levelIntro: level?.intro ?? null,
    finished,
    elapsedSeconds: Math.floor((now - player.started_at) / 1000),
    levelElapsedSeconds: finished
      ? 0
      : Math.floor((now - player.level_start_at) / 1000),
    score,
    maxScore: MAX_SCORE,
    history: finished ? [] : db.getChatHistory(sessionId, player.current_level),
  };
}

export function chat(sessionId, message) {
  const player = db.getPlayer(sessionId);
  if (!player) throw new Error('Сессия не найдена. Начни игру заново.');
  if (player.current_level > TOTAL_LEVELS) {
    return { reply: 'Игра уже пройдена! Загляни в таблицу лидеров.' };
  }
  if (player.messages_this_level >= MAX_MESSAGES_PER_LEVEL) {
    return {
      reply:
        'Лимит сообщений на этом уровне исчерпан. Подумай над тем, что уже узнал, и вводи код.',
    };
  }

  const level = getLevel(player.current_level);
  db.addChatMessage(sessionId, level.id, 'user', message);
  db.incrementMessageCount(sessionId);

  const fns = { 1: runLevel1, 2: runLevel2, 3: runLevel3, 4: runLevel4, 5: (m) => runLevel5(m) };
  const reply = (fns[level.id] ?? runLevel3)(message, level.code);

  db.addChatMessage(sessionId, level.id, 'assistant', reply);
  return { reply };
}

export function submitCode(sessionId, submittedCode) {
  const player = db.getPlayer(sessionId);
  if (!player) throw new Error('Сессия не найдена. Начни игру заново.');
  if (player.current_level > TOTAL_LEVELS) {
    return { correct: false, gameComplete: true };
  }

  const level = getLevel(player.current_level);
  const normalize = (s) => s.trim().toUpperCase().replace(/\s+/g, '-');
  const correct = normalize(submittedCode) === normalize(level.code);

  if (!correct) {
    return { correct: false };
  }

  const secondsSpent = Math.floor((Date.now() - player.level_start_at) / 1000);
  const points = pointsForLevel(level.basePoints, secondsSpent);
  db.addLevelResult(sessionId, level.id, secondsSpent, points);

  const nextLevelId = level.id + 1;
  const gameComplete = nextLevelId > TOTAL_LEVELS;

  if (gameComplete) {
    db.setPlayerLevel(sessionId, nextLevelId, Date.now());
    db.finishPlayer(sessionId);
  } else {
    db.setPlayerLevel(sessionId, nextLevelId, Date.now());
  }

  const next = gameComplete ? null : getLevel(nextLevelId);
  return {
    correct: true,
    pointsEarned: points,
    gameComplete,
    nextLevel: next
      ? { id: next.id, title: next.title, intro: next.intro, basePoints: next.basePoints }
      : null,
  };
}

// Сдаться: переводит на следующий уровень без начисления очков и без
// показа решения. Сдавшийся уровень не записывается в level_results,
// поэтому не считается пройденным. На последнем уровне — финиш игры.
export function surrenderLevel(sessionId) {
  const player = db.getPlayer(sessionId);
  if (!player) throw new Error('Сессия не найдена. Начни игру заново.');
  if (player.current_level > TOTAL_LEVELS) {
    return { surrendered: true, gameComplete: true, nextLevel: null };
  }

  const level = getLevel(player.current_level);
  const nextLevelId = level.id + 1;
  const gameComplete = nextLevelId > TOTAL_LEVELS;

  db.setPlayerLevel(sessionId, nextLevelId, Date.now());
  if (gameComplete) {
    db.finishPlayer(sessionId);
  }

  const next = gameComplete ? null : getLevel(nextLevelId);
  return {
    surrendered: true,
    gameComplete,
    nextLevel: next
      ? { id: next.id, title: next.title, intro: next.intro, basePoints: next.basePoints }
      : null,
  };
}

export function getLeaderboard() {
  return db.getLeaderboard().map((row) => ({
    nickname: row.nickname,
    score: row.score,
    levelsCompleted: row.levels_completed,
    finished: row.finished_at != null,
    totalSeconds: row.finished_at
      ? Math.floor((row.finished_at - row.started_at) / 1000)
      : Math.floor((Date.now() - row.started_at) / 1000),
  }));
}
