import { api } from './api.js';

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const DEFAULT_BUILDER = {
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

// Real accounts and portfolio content now live on the backend (server/).
// This module only keeps a small local cache so the UI has something to
// render instantly (name in the nav bar, etc.) before/between API calls,
// and keeps the GitHub-import cache (harmless, public data).
export const store = {
  getCurrentUser: () => read('autop_session', null),
  setCurrentUser(user) {
    write('autop_session', user);
  },
  logout() {
    localStorage.removeItem('autop_session');
    localStorage.removeItem('autop_github');
    localStorage.removeItem('builderCache');
    localStorage.removeItem('builderSeeded');
    api.setToken(null);
  },

  getGithub: () => read('autop_github', null),
  saveGithub(username, profile, repos) {
    write('autop_github', { username, profile, repos, fetchedAt: new Date().toISOString() });
  },
  clearGithub() {
    localStorage.removeItem('autop_github');
  },

  // Contact form messages aren't part of the account system; kept local for now.
  saveMessage(key, payload) {
    const messages = read(key, []);
    messages.push({ ...payload, createdAt: new Date().toISOString() });
    write(key, messages);
  }
};
