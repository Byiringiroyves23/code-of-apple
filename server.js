server.js
// server.js
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'data', 'users.db');
const db = new sqlite3.Database(dbPath);

// Helper: runQuery returns a Promise
function runQuery(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function getOne(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Signup
app.post('/api/signup', async (req, res) => {
  const { username, password, email, telephone } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'username, password and email required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await runQuery(
      `INSERT INTO users (id, username, email, telephone, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [id, username, email, telephone || '', hash]
    );
    return res.json({ success: true, id });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'username or email already exists' });
    }
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const user = await getOne(`SELECT * FROM users WHERE username = ?`, [username]);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    // In a real app return a session / JWT. Here return a simple success.
    return res.json({ success: true, user: { id: user.id, username: user.username, email: user.email }});
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Request password reset — returns a "reset token" (in a real app you'd email this)
app.post('/api/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const user = await getOne(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(404).json({ error: 'user not found' });
    const token = uuidv4();
    await runQuery(`UPDATE users SET reset_token = ? WHERE id = ?`, [token, user.id]);
    // Return token for demo (simulate email). In production email the token link.
    return res.json({ success: true, reset_token: token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Reset password using token
app.post('/api/reset', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'token and new_password required' });
  try {
    const user = await getOne(`SELECT * FROM users WHERE reset_token = ?`, [token]);
    if (!user) return res.status(400).json({ error: 'invalid token' });
    const hash = await bcrypt.hash(new_password, 10);
    await runQuery(`UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?`, [hash, user.id]);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
});

// Fallback to index.html for SPA-ish pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
