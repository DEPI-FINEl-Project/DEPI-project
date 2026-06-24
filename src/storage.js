const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

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
  getBuilder: () => read('builderData', {
    headline: 'Minimalist Designer & Developer.',
    subtext: 'I build digital experiences that recede into the background, letting your products speak for themselves.',
    themeMode: 'light',
    accent: '#007b70',
    template: 'minimal'
  }),
  saveBuilder(data) {
    write('builderData', data);
    localStorage.setItem('builderSavedAt', new Date().toISOString());
  },
  saveTemplate(template) {
    localStorage.setItem('selectedTemplate', template);
    const builder = store.getBuilder();
    store.saveBuilder({ ...builder, template });
  },
  saveMessage(key, payload) {
    const messages = read(key, []);
    messages.push({ ...payload, createdAt: new Date().toISOString() });
    write(key, messages);
  }
};
