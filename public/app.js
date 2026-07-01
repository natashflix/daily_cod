const screens = {
  start: document.getElementById('screen-start'),
  game: document.getElementById('screen-game'),
  victory: document.getElementById('screen-victory'),
  leaderboard: document.getElementById('screen-leaderboard'),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
}

let sessionId = localStorage.getItem('codeHeistSession') || null;
let overallBaseline = null; // ms timestamp: when overall timer started, computed client-side
let levelBaseline = null;
let maxScore = 0;
let tickHandle = null;

function fmt(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function tick() {
  if (overallBaseline == null) return;
  const totalSec = (Date.now() - overallBaseline) / 1000;
  const levelSec = (Date.now() - levelBaseline) / 1000;
  document.getElementById('timer-total').textContent = fmt(totalSec);
  document.getElementById('timer-level').textContent = fmt(levelSec);
}

function startTicking() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(tick, 1000);
  tick();
}

function renderChat(history) {
  const win = document.getElementById('chat-window');
  win.innerHTML = '';
  for (const msg of history) {
    const div = document.createElement('div');
    div.className = `bubble ${msg.role === 'user' ? 'user' : 'assistant'}`;
    div.textContent = msg.content;
    win.appendChild(div);
  }
  win.scrollTop = win.scrollHeight;
}

function appendBubble(role, content) {
  const win = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = `bubble ${role === 'user' ? 'user' : 'assistant'}`;
  div.textContent = content;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

async function applyState(state) {
  maxScore = state.maxScore;
  document.getElementById('level-title').textContent = state.levelTitle ?? '';
  document.getElementById('level-intro').textContent = state.levelIntro ?? '';
  document.getElementById('score').textContent = state.score;
  renderChat(state.history);

  const now = Date.now();
  overallBaseline = now - state.elapsedSeconds * 1000;
  levelBaseline = now - state.levelElapsedSeconds * 1000;
  startTicking();
}

async function refreshState() {
  const res = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) {
    localStorage.removeItem('codeHeistSession');
    sessionId = null;
    showScreen('start');
    return;
  }
  const state = await res.json();
  await applyState(state);
}

document.getElementById('btn-start').addEventListener('click', async () => {
  const nickname = document.getElementById('nickname').value.trim();
  const errEl = document.getElementById('start-error');
  errEl.textContent = '';
  if (!nickname) {
    errEl.textContent = 'Введи ник';
    return;
  }
  const res = await fetch('/api/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) {
    errEl.textContent = 'Не получилось начать игру';
    return;
  }
  const data = await res.json();
  sessionId = data.sessionId;
  localStorage.setItem('codeHeistSession', sessionId);
  await applyState(data.state);
  showScreen('game');
});

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;
  appendBubble('user', message);
  input.value = '';
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, message }),
  });
  const data = await res.json();
  appendBubble('assistant', data.reply ?? data.error ?? 'Ошибка');
});

document.getElementById('btn-submit').addEventListener('click', async () => {
  const input = document.getElementById('code-input');
  const code = input.value.trim();
  const feedback = document.getElementById('submit-feedback');
  if (!code) return;
  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, code }),
  });
  const data = await res.json();
  if (!data.correct) {
    feedback.textContent = 'Неверный код, пробуй ещё.';
    feedback.className = 'bad';
    return;
  }
  input.value = '';
  if (data.gameComplete) {
    await showVictory();
    return;
  }
  feedback.textContent = `Верно! +${data.pointsEarned} очков. Следующий уровень открыт.`;
  feedback.className = 'ok';
  await refreshState();
});

async function showVictory() {
  clearInterval(tickHandle);
  const finalRes = await fetch(`/api/state?sessionId=${encodeURIComponent(sessionId)}`);
  const finalState = await finalRes.json();
  document.getElementById('final-score').textContent = finalState.score;
  document.getElementById('final-max').textContent = finalState.maxScore;
  document.getElementById('final-time').textContent = fmt(finalState.elapsedSeconds);
  showScreen('victory');
}

document.getElementById('btn-surrender').addEventListener('click', async () => {
  if (!confirm('Сдаться и перейти на следующий уровень? Очки за этот уровень не начислятся, решение не покажем.')) {
    return;
  }
  const res = await fetch('/api/surrender', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  const data = await res.json();
  document.getElementById('code-input').value = '';
  document.getElementById('submit-feedback').textContent = '';
  if (data.gameComplete) {
    await showVictory();
    return;
  }
  await refreshState();
});

async function loadLeaderboard() {
  const res = await fetch('/api/leaderboard');
  const rows = await res.json();
  const tbody = document.querySelector('#leaderboard-table tbody');
  tbody.innerHTML = '';
  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const cells = [
      String(i + 1),
      row.nickname + (row.finished ? ' 🏆' : ''),
      `${row.levelsCompleted}/5`,
      String(row.score),
      fmt(row.totalSeconds),
    ];
    for (const text of cells) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
}

document.getElementById('nav-leaderboard').addEventListener('click', async () => {
  await loadLeaderboard();
  showScreen('leaderboard');
});
document.getElementById('btn-show-leaderboard').addEventListener('click', async () => {
  await loadLeaderboard();
  showScreen('leaderboard');
});
document.getElementById('btn-back').addEventListener('click', () => {
  showScreen(sessionId ? 'game' : 'start');
});

(async function init() {
  if (sessionId) {
    await refreshState();
    showScreen('game');
  } else {
    showScreen('start');
  }
})();
