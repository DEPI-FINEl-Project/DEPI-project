// GitHub REST API helper — fetches a user's public repositories.
// No auth/backend required; subject to the 60 req/hour unauthenticated limit.

const trim = (value) => String(value || '').trim().replace(/^@/, '');

// Maps connected GitHub data into a partial portfolio (name, skills, projects…)
// used to pre-fill the builder. Only includes fields we actually have.
export function portfolioSeed(github) {
  if (!github?.profile) return {};
  const { profile, repos = [] } = github;
  const langCounts = {};
  repos.forEach((repo) => { if (repo.language) langCounts[repo.language] = (langCounts[repo.language] || 0) + 1; });
  const skills = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).map(([lang]) => lang).slice(0, 8);
  const projects = repos.slice(0, 6).map((repo) => ({
    title: repo.name,
    description: repo.description || 'No description provided.',
    link: repo.homepage || repo.url,
    tags: (repo.topics?.length ? repo.topics : [repo.language].filter(Boolean)).slice(0, 3)
  }));

  const seed = { name: profile.name || profile.login, github: profile.login };
  if (profile.bio) { seed.tagline = profile.bio; seed.about = profile.bio; }
  if (profile.location) seed.location = profile.location;
  if (profile.blog) seed.website = profile.blog;
  if (skills.length) seed.skills = skills;
  if (projects.length) seed.projects = projects;
  return seed;
}

export async function fetchProfile(username) {
  const user = trim(username);
  if (!user) throw new Error('Please enter a GitHub username.');

  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}`, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (res.status === 404) throw new Error(`GitHub user "${user}" was not found.`);
  if (res.status === 403) throw new Error('GitHub rate limit reached. Try again in a few minutes.');
  if (!res.ok) throw new Error(`GitHub request failed (${res.status}).`);

  const data = await res.json();
  return {
    login: data.login,
    name: data.name || data.login,
    avatar: data.avatar_url,
    bio: data.bio || '',
    company: data.company || '',
    location: data.location || '',
    blog: data.blog || '',
    twitter: data.twitter_username || '',
    url: data.html_url,
    followers: data.followers,
    following: data.following,
    publicRepos: data.public_repos,
    createdAt: data.created_at
  };
}

export async function fetchRepos(username) {
  const user = trim(username);
  if (!user) throw new Error('Please enter a GitHub username.');

  const url = `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`;
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });

  if (res.status === 404) throw new Error(`GitHub user "${user}" was not found.`);
  if (res.status === 403) throw new Error('GitHub rate limit reached. Try again in a few minutes.');
  if (!res.ok) throw new Error(`GitHub request failed (${res.status}).`);

  const data = await res.json();
  return data
    .filter((repo) => !repo.fork)
    .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
    .map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description || '',
      url: repo.html_url,
      homepage: repo.homepage || '',
      language: repo.language || '',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics || [],
      updatedAt: repo.pushed_at
    }));
}
