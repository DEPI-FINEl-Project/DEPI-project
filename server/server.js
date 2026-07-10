// AutoPortfolio AI backend
// -------------------------------------------------------------
// Small proxy server between the React frontend and the Google
// Gemini API. It exists for two reasons:
//
// 1. CORS: Gemini (like most LLM APIs) cannot be called directly
//    from a browser. Calls must go through a server.
// 2. Security: the Gemini API key lives only here, as an
//    environment variable. It is never sent to the browser.
//
// Google's free tier (no credit card required) is generous enough
// to run this whole feature at $0/month. Get a key at:
// https://aistudio.google.com/app/apikey
// -------------------------------------------------------------

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { db } from './db.js';
import { hashPassword, verifyPassword, signToken, authMiddleware } from './auth.js';

const app = express();
const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

if (!GEMINI_API_KEY) {
  console.warn(
    '⚠️  GEMINI_API_KEY is missing. Copy server/.env.example to server/.env and add your key ' +
    '(free, no credit card, from https://aistudio.google.com/app/apikey).'
  );
}

app.use(cors()); // allow the Vite dev server / your deployed frontend to call this API
app.use(express.json({ limit: '300kb' }));

// Same rules used everywhere: 3-10 login/signup attempts per window is plenty
// for a real user and slows down anyone trying to brute-force a password.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' }
});

function slugify(base) {
  return (
    String(base || 'user')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '') || 'user'
  );
}

function uniqueUsername(data, base) {
  const wanted = slugify(base);
  const taken = new Set(data.users.map((u) => u.username));
  if (!taken.has(wanted)) return wanted;
  let n = 2;
  while (taken.has(`${wanted}-${n}`)) n += 1;
  return `${wanted}-${n}`;
}

const DEFAULT_PORTFOLIO = {
  template: 'minimal',
  theme: 'light',
  accent: '#007b70',
  name: 'Your Name',
  role: 'Full-Stack Developer',
  tagline: 'I craft clean, performant digital experiences — from first idea to shipped product.',
  about: 'Write a short paragraph about who you are, the kind of work you love, and what you are looking for next.',
  email: 'you@example.com',
  location: '',
  website: '',
  github: '',
  skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
  projects: [
    { title: 'Project One', description: 'A short description of what this project does and the impact it had.', link: '', tags: ['React', 'Node'] },
    { title: 'Project Two', description: 'Explain the problem you solved and the result you delivered.', link: '', tags: ['TypeScript'] }
  ]
};

function publicUser(user) {
  return { name: user.name, email: user.email, username: user.username };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) return res.status(400).json({ error: 'That email address looks invalid.' });
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await db.mutate((data) => {
      if (data.users.some((u) => u.email === normalizedEmail)) {
        throw Object.assign(new Error('An account with this email already exists.'), { status: 409 });
      }
      const username = uniqueUsername(data, name || normalizedEmail.split('@')[0]);
      const record = {
        id: crypto.randomUUID(),
        name: String(name).trim(),
        email: normalizedEmail,
        username,
        passwordHash: hashPassword(String(password)),
        portfolio: { ...DEFAULT_PORTFOLIO, name: String(name).trim(), email: normalizedEmail },
        createdAt: new Date().toISOString()
      };
      data.users.push(record);
      return record;
    });

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not create account.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const normalizedEmail = String(email).trim().toLowerCase();
    const data = db.readDb();
    const user = data.users.find((u) => u.email === normalizedEmail);
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch {
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const data = db.readDb();
  const user = data.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(user) });
});

app.get('/api/auth/check-username/:username', (req, res) => {
  const data = db.readDb();
  const candidate = slugify(req.params.username);
  const available = !data.users.some((u) => u.username === candidate);
  res.json({ username: candidate, available });
});

app.put('/api/auth/username', authMiddleware, async (req, res) => {
  try {
    const candidate = slugify(req.body?.username);
    const user = await db.mutate((data) => {
      const taken = data.users.some((u) => u.username === candidate && u.id !== req.userId);
      if (taken) throw Object.assign(new Error('That link is already taken.'), { status: 409 });
      const record = data.users.find((u) => u.id === req.userId);
      if (!record) throw Object.assign(new Error('User not found.'), { status: 404 });
      record.username = candidate;
      return record;
    });
    res.json({ username: user.username });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.delete('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const existed = await db.mutate((data) => {
      const before = data.users.length;
      data.users = data.users.filter((u) => u.id !== req.userId);
      return data.users.length < before;
    });
    if (!existed) return res.status(404).json({ error: 'User not found.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Portfolio data (private read/write for the owner, public read-only by link)
// ---------------------------------------------------------------------------

app.get('/api/portfolio/me', authMiddleware, (req, res) => {
  const data = db.readDb();
  const user = data.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ portfolio: { ...DEFAULT_PORTFOLIO, ...user.portfolio }, username: user.username });
});

app.put('/api/portfolio/me', authMiddleware, async (req, res) => {
  try {
    await db.mutate((data) => {
      const user = data.users.find((u) => u.id === req.userId);
      if (!user) throw Object.assign(new Error('User not found.'), { status: 404 });
      user.portfolio = { ...DEFAULT_PORTFOLIO, ...user.portfolio, ...(req.body || {}) };
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/portfolio/public/:username', (req, res) => {
  const data = db.readDb();
  const user = data.users.find((u) => u.username === slugify(req.params.username));
  if (!user) return res.status(404).json({ error: 'No portfolio found for this link.' });
  res.json({ portfolio: { ...DEFAULT_PORTFOLIO, ...user.portfolio }, name: user.name });
});

// Basic abuse protection: caps how many AI generations a single IP
// can request. Tune these numbers to whatever your Gemini quota allows.
const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24h
  max: Number(process.env.AI_DAILY_LIMIT_PER_IP || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily AI generation limit reached. Try again tomorrow.' }
});

async function callGemini(systemPrompt, userPrompt) {
  if (!GEMINI_API_KEY) {
    const err = new Error('Server is missing GEMINI_API_KEY. Ask the site owner to configure it.');
    err.status = 500;
    throw err;
  }

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
    })
  });

  if (res.status === 429) {
    const err = new Error('Gemini rate limit reached. Try again shortly.');
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`AI request failed (${res.status}). ${body}`.trim());
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
  if (!text) {
    const err = new Error('AI returned an empty response.');
    err.status = 502;
    throw err;
  }
  return text;
}

// Same prompt-engineering rules that used to live in the frontend's ai.js,
// moved here since this is now the only place that talks to the LLM.
function buildProjectPrompt(project = {}, context = {}) {
  const system = [
    'You are an expert technical copywriter who rewrites developer project descriptions.',
    'Write for a portfolio website: clear, confident, and SEO-friendly.',
    'Rules: 1-2 sentences, 25-45 words, active voice, no buzzwords (e.g. "passionate", "leverage", "synergy"),',
    'mention the core technologies naturally, no hashtags, no quotation marks, plain text only.'
  ].join(' ');

  const details = [
    `Project title: ${project.title || 'Untitled project'}`,
    `Current description: ${project.description || '(none provided)'}`,
    project.tags?.length ? `Technologies/tags: ${project.tags.join(', ')}` : null,
    context.role ? `Author's role: ${context.role}` : null,
    context.skills?.length ? `Author's skills: ${context.skills.join(', ')}` : null
  ].filter(Boolean).join('\n');

  return { system, user: `Rewrite this project description:\n\n${details}` };
}

function buildAboutPrompt(profile = {}) {
  const system = [
    'You are a professional portfolio copywriter.',
    'Write a first-person "About Me" section for a developer portfolio.',
    "Rules: 3-4 sentences, 60-90 words, confident and specific (not generic),",
    'reference the person\'s actual skills/projects rather than cliches like "passionate developer",',
    'plain text only, no headings, no quotation marks.'
  ].join(' ');

  const projectLines = (profile.projects || [])
    .slice(0, 4)
    .map((p) => `- ${p.title}: ${p.description || 'no description'}`)
    .join('\n');

  const details = [
    `Name: ${profile.name || 'the developer'}`,
    `Role: ${profile.role || 'Developer'}`,
    profile.skills?.length ? `Skills: ${profile.skills.join(', ')}` : null,
    profile.location ? `Location: ${profile.location}` : null,
    projectLines ? `Notable projects:\n${projectLines}` : null
  ].filter(Boolean).join('\n');

  return { system, user: `Write the About Me section for:\n\n${details}` };
}

app.post('/api/ai/improve-description', aiLimiter, async (req, res) => {
  try {
    const { project, context } = req.body || {};
    const { system, user } = buildProjectPrompt(project, context);
    const text = await callGemini(system, user);
    res.json({ text });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/ai/about-me', aiLimiter, async (req, res) => {
  try {
    const { profile } = req.body || {};
    const { system, user } = buildAboutPrompt(profile);
    const text = await callGemini(system, user);
    res.json({ text });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true, model: MODEL }));

app.listen(PORT, () => {
  console.log(`AutoPortfolio AI server running on http://localhost:${PORT}`);
});
