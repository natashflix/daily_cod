import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  startGame,
  getState,
  chat,
  submitCode,
  getLeaderboard,
} from './game.js';

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

app.get('/api/leaderboard', (req, res) => {
  res.json(getLeaderboard());
});

app.listen(PORT, () => {
  console.log(`School 21 Code Heist запущена: http://localhost:${PORT}`);
});
