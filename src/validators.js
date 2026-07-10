// Small, dependency-free validation helpers shared across the app.

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

// Accepts empty (field is optional) or a reasonable domain/URL shape.
export function isValidUrlOrEmpty(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  return /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(v);
}

export function isValidGithubUsernameOrEmpty(value) {
  const v = String(value || '').trim();
  if (!v) return true;
  return /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(v);
}
