import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  startGame,
  getState,
  chat,
  submitCode,
  surrenderLevel,
  getLeaderboard,
} from './game.js';
import { getWinningAttacks, getEventStats, getFullExport } from './db.js';

if (fs.existsSync(path.join(process.cwd(), '.env'))) {
  process.loadEnvFile();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/start', (req, res) => {
  const { nickname } = req.body;
  if (!nickname || !nickname.trim()) {
    return res.status(400).json({ error: 'Введи ник' });
  }
  const sessionId = startGame(nickname);
  res.json({ sessionId, state: getState(sessionId) });
});

app.get('/api/state', (req, res) => {
  const sessionId = req.query.sessionId;
  const state = getState(sessionId);
  if (!state) return res.status(404).json({ error: 'Сессия не найдена' });
  res.json(state);
});

app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!sessionId || !message || !message.trim()) {
    return res.status(400).json({ error: 'Нужны sessionId и message' });
  }
  try {
    const result = await chat(sessionId, message.trim().slice(0, 1000));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Ошибка бота' });
  }
});

app.post('/api/submit', (req, res) => {
  const { sessionId, code } = req.body;
  if (!sessionId || !code) {
    return res.status(400).json({ error: 'Нужны sessionId и code' });
  }
  try {
    const result = submitCode(sessionId, code);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Ошибка проверки кода' });
  }
});

app.post('/api/surrender', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Нужен sessionId' });
  }
  try {
    res.json(surrenderLevel(sessionId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Ошибка' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  res.json(getLeaderboard());
});

function checkAdmin(req, res) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(503).json({ error: 'ADMIN_PASSWORD не задан в .env' });
    return false;
  }
  if (req.query.password !== adminPassword) {
    res.status(403).json({ error: 'Неверный пароль' });
    return false;
  }
  return true;
}

app.get('/api/admin/stats', (req, res) => {
  if (!checkAdmin(req, res)) return;
  res.json({ stats: getEventStats(), attacks: getWinningAttacks() });
});

app.get('/api/admin/export', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const rows = getFullExport();
  const headers = [
    'nickname', 'levels_completed', 'total_score', 'finished', 'total_seconds',
    'l1_points', 'l1_seconds', 'l2_points', 'l2_seconds',
    'l3_points', 'l3_seconds', 'l4_points', 'l4_seconds',
    'l5_points', 'l5_seconds',
  ];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
  res.send('﻿' + csv); // BOM for Excel UTF-8
});

app.listen(PORT, () => {
  console.log(`School 21 Code Heist запущена: http://localhost:${PORT}`);
});
