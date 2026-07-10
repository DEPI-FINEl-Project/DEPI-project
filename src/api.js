// Thin wrapper around fetch() for talking to our backend (server/server.js).
// Handles attaching the login token and turning error responses into
// JS Error objects that components can catch and display.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const TOKEN_KEY = 'autop_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('Could not reach the server. Is it running? (cd server && npm run start)');
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    setToken(null);
    localStorage.removeItem('autop_session');
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

export const api = {
  getToken,
  setToken,

  signup: (payload) => request('/api/auth/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/api/auth/me'),
  checkUsername: (username) => request(`/api/auth/check-username/${encodeURIComponent(username)}`, { auth: false }),
  setUsername: (username) => request('/api/auth/username', { method: 'PUT', body: { username } }),
  deleteAccount: () => request('/api/auth/me', { method: 'DELETE' }),

  getPortfolio: () => request('/api/portfolio/me'),
  savePortfolio: (portfolio) => request('/api/portfolio/me', { method: 'PUT', body: portfolio }),
  getPublicPortfolio: (username) => request(`/api/portfolio/public/${encodeURIComponent(username)}`, { auth: false })
};
