import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], chats: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });
  const db = loadDb();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: 'Username exists' });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), username, passwordHash: hash, createdAt: new Date().toISOString() };
  db.users.push(user);
  saveDb(db);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

function replyFor(message) {
  const m = message.toLowerCase();
  if (m.includes('code')) return 'Code Assistant: break problem into input/output, edge cases, then implement and test.';
  if (m.includes('image')) return 'Image Assistant: give subject, style, camera, lighting, and color palette.';
  return `IARS processed: ${message}`;
}

app.post('/api/assistant/chat', auth, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const db = loadDb();
  const key = String(req.user.id);
  db.chats[key] = db.chats[key] || [];
  const userMsg = { role: 'user', content: message, time: new Date().toISOString() };
  const aiMsg = { role: 'assistant', content: replyFor(message), time: new Date().toISOString() };
  db.chats[key].push(userMsg, aiMsg);
  saveDb(db);
  res.json({ reply: aiMsg.content });
});

app.get('/api/assistant/history', auth, (req, res) => {
  const db = loadDb();
  res.json({ messages: db.chats[String(req.user.id)] || [] });
});

app.listen(PORT, () => console.log(`IARS server running on :${PORT}`));
