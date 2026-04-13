const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory store ───────────────────────────────────────────────
const ADMIN = { username: 'admin', password: 'admin123' };
const adminSessions = new Set();
const instances = []; // array of form instances
const formSessions = {}; // slug -> token

// ─── Helpers ───────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]
    || req.headers['x-admin-token'];
  if (!adminSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
}

// ─── ADMIN: login / logout ─────────────────────────────────────────
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    const token = uuidv4();
    adminSessions.add(token);
    return res.json({ ok: true, token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/admin/logout', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) adminSessions.delete(token);
  res.json({ ok: true });
});

// ─── ADMIN: list instances ─────────────────────────────────────────
app.get('/admin/forms', requireAdmin, (req, res) => {
  res.json({ instances });
});

// ─── ADMIN: get single instance ───────────────────────────────────
app.get('/admin/forms/:instanceId', requireAdmin, (req, res) => {
  const inst = instances.find(i => i.instanceId === req.params.instanceId);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  res.json(inst);
});

// ─── ADMIN: create instance ────────────────────────────────────────
app.post('/admin/forms/create', requireAdmin, (req, res) => {
  const { username, password, createdBy, clientName, clientEmail, notes, language } = req.body;
  if (!username || !password || !clientName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const instanceId = uuidv4();
  const baseSlug = slugify(clientName + '-' + Date.now());
  const slug = baseSlug;
  const instance = {
    instanceId,
    slug,
    username,
    password,
    createdBy,
    clientName,
    clientEmail,
    notes,
    language: language || 'es',
    status: 'active',
    createdAt: new Date().toISOString(),
    completedAt: null,
    link: `${req.protocol}://${req.get('host')}/f/${slug}`,
  };
  instances.push(instance);
  res.json({ instanceId, slug, link: instance.link, language: instance.language });
});

// ─── PUBLIC: status ────────────────────────────────────────────────
app.get('/f/:slug/status', (req, res) => {
  const inst = instances.find(i => i.slug === req.params.slug);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  res.json({ status: inst.status, language: inst.language });
});

// ─── PUBLIC: login ─────────────────────────────────────────────────
app.post('/f/:slug/login', (req, res) => {
  const inst = instances.find(i => i.slug === req.params.slug);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  if (inst.status !== 'active') return res.status(403).json({ error: 'Unavailable' });
  const { username, password } = req.body;
  if (username !== inst.username || password !== inst.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = uuidv4();
  formSessions[inst.slug] = token;
  res.json({ ok: true, token });
});

// ─── PUBLIC: submit ────────────────────────────────────────────────
app.post('/f/:slug/submit', (req, res) => {
  const inst = instances.find(i => i.slug === req.params.slug);
  if (!inst) return res.status(404).json({ error: 'Not found' });
  if (inst.status !== 'active') return res.status(403).json({ error: 'Unavailable' });
  inst.status = 'completed';
  inst.completedAt = new Date().toISOString();
  inst.formData = req.body;
  res.json({ ok: true });
});

// ─── PUBLIC: logout ────────────────────────────────────────────────
app.post('/f/:slug/logout', (req, res) => {
  delete formSessions[req.params.slug];
  res.json({ ok: true });
});

// ─── Fallback: serve form.html for /f/:slug routes ────────────────
app.get('/f/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

// ─── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Supra Forms running at http://localhost:${PORT}`);
  console.log(`   Admin:   http://localhost:${PORT}/login.html`);
  console.log(`   Usuario: admin`);
  console.log(`   Clave:   admin123\n`);
});
