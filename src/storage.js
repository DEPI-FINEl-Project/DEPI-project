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

export const store = {
  getUsers: () => read('autop_users', []),
  saveUser(user) {
    const users = store.getUsers().filter((item) => item.email !== user.email);
    users.push(user);
    write('autop_users', users);
    store.setCurrentUser({ name: user.name, email: user.email });
  },
  findUser(email, password) {
    return store.getUsers().find((user) => user.email === email && user.password === password);
  },
  getCurrentUser: () => read('currentUser', null),
  setCurrentUser(user) {
    write('currentUser', user);
    localStorage.setItem('isLoggedIn', 'true');
  },
  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('autop_github');
  },
  getBuilder() {
    const stored = read('builderData', {});
    return { ...DEFAULT_BUILDER, ...stored };
  },
  saveBuilder(data) {
    write('builderData', data);
    localStorage.setItem('builderSavedAt', new Date().toISOString());
  },
  saveTemplate(template) {
    localStorage.setItem('selectedTemplate', template);
    store.saveBuilder({ ...store.getBuilder(), template });
  },
  saveMessage(key, payload) {
    const messages = read(key, []);
    messages.push({ ...payload, createdAt: new Date().toISOString() });
    write(key, messages);
  },
  getGithub: () => read('autop_github', null),
  saveGithub(username, profile, repos) {
    write('autop_github', { username, profile, repos, fetchedAt: new Date().toISOString() });
  },
  clearGithub() {
    localStorage.removeItem('autop_github');
  }
};
