// AI content assistant — talks to our own backend (server/server.js),
// which proxies to Google Gemini. We never call the LLM provider
// directly from the browser: that would leak API keys and get
// blocked by CORS. See server/server.js for the actual prompts.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error('Could not reach the AI server. Is it running? (cd server && npm run dev)');
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 429) throw new Error(data.error || 'Daily AI limit reached. Try again tomorrow.');
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status}).`);
  if (!data.text) throw new Error('AI returned an empty response.');
  return data.text;
}

// Rewrites a project description for clarity and SEO.
export async function improveProjectDescription(project, context = {}) {
  return post('/api/ai/improve-description', { project, context });
}

// Generates an "About Me" tailored to the user's actual skill list and project mix.
export async function generateAboutMe(profile = {}) {
  return post('/api/ai/about-me', { profile });
}
