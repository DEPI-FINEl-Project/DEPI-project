import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { store } from "./storage.js";
import { api } from "./api.js";
import {
  isValidEmail,
  isValidUrlOrEmpty,
  isValidGithubUsernameOrEmpty,
} from "./validators.js";
import { fetchProfile, fetchRepos, portfolioSeed } from "./github.js";
import { useAIAssist } from "./hooks/useAIAssist.js";
import { usePortfolio } from "./hooks/usePortfolio.js";

const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    desc: "Clean, editorial, lots of whitespace. Lets the work speak.",
  },
  {
    id: "developer",
    name: "Developer",
    desc: "Dark, terminal-inspired, monospace. Built for engineers.",
  },
  {
    id: "studio",
    name: "Studio",
    desc: "Bold, colorful, oversized type. For designers & makers.",
  },
];

const normalizeUrl = (url) =>
  !url ? "" : /^https?:\/\//.test(url) ? url : `https://${url}`;

// Self-contained portfolio site rendered from builder data.
// Visual style is driven entirely by `data.template`, `data.theme` and `data.accent`.
function Portfolio({ data, preview = false }) {
  const a = preview ? (e) => e.preventDefault() : undefined;
  const prompt = data.template === "developer";
  return (
    <div
      className={`pf pf-${data.template} pf-${data.theme}`}
      style={{ "--pf-accent": data.accent }}
    >
      <header className="pf-nav">
        <span className="pf-brand">
          {prompt
            ? `~/${(data.name || "me").toLowerCase().replace(/\s+/g, "-")}`
            : data.name}
        </span>
        <nav>
          <a href="#pf-about" onClick={a}>
            About
          </a>
          <a href="#pf-work" onClick={a}>
            Work
          </a>
          <a href="#pf-contact" onClick={a}>
            Contact
          </a>
        </nav>
        <a
          className="pf-nav-cta"
          href={
            data.github ? `https://github.com/${data.github}` : "#pf-contact"
          }
          onClick={data.github ? undefined : a}
          target={data.github ? "_blank" : undefined}
          rel="noreferrer"
        >
          {data.github ? (
            <>
              <i className="fa-brands fa-github" /> GitHub
            </>
          ) : (
            "Hire me"
          )}
        </a>
      </header>

      <section className="pf-hero" id="pf-top">
        <span className="pf-tag">
          {prompt ? "$ whoami" : `Available — ${data.role}`}
        </span>
        <h1>
          {prompt ? (
            <>
              <span className="pf-cursor">{data.name}</span>
            </>
          ) : (
            data.name
          )}
        </h1>
        <p className="pf-role">{data.role}</p>
        <p className="pf-tagline">{data.tagline}</p>
        <div className="pf-hero-actions">
          <a href="#pf-work" onClick={a} className="pf-btn">
            View Work
          </a>
        </div>
        {data.skills.length > 0 && (
          <ul className="pf-skills">
            {data.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="pf-about" id="pf-about">
        <h2>{prompt ? "// about" : "About"}</h2>
        <p>{data.about}</p>
      </section>

      <section className="pf-work" id="pf-work">
        <div className="pf-work-head">
          <h2>{prompt ? "// selected work" : "Selected Work"}</h2>
          <span>
            {data.projects.length}{" "}
            {data.projects.length === 1 ? "project" : "projects"}
          </span>
        </div>
        <div className="pf-projects">
          {data.projects.map((project, i) => {
            const href = normalizeUrl(project.link);
            return (
              <article className="pf-card" key={i}>
                <div className="pf-card-top">
                  <span className="pf-card-no">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>
                  {href ? (
                    <a
                      href={href}
                      onClick={preview ? a : undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.title}
                    </a>
                  ) : (
                    project.title
                  )}
                </h3>
                <p>{project.description}</p>
                {project.tags?.length > 0 && (
                  <div className="pf-card-tags">
                    {project.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
                {href && (
                  <a
                    className="pf-card-cta"
                    href={href}
                    onClick={preview ? a : undefined}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {prompt ? "open" : "View Project"}{" "}
                    <i className="fa-solid fa-arrow-right" />
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="pf-contact" id="pf-contact">
        <h2>{prompt ? "// contact" : "Let's work together"}</h2>
        <p>
          {data.location ? `Based in ${data.location}. ` : ""}Currently open to
          new projects and collaborations.
        </p>
        <div className="pf-contact-links">
          <a
            className="pf-btn"
            href={`mailto:${data.email}`}
            onClick={preview ? a : undefined}
            title={data.email}
          >
            <i className="fa-regular fa-envelope" /> Email
          </a>
          {data.website && (
            <a
              className="pf-btn"
              href={normalizeUrl(data.website)}
              onClick={preview ? a : undefined}
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa-solid fa-globe" /> Website
            </a>
          )}
          {data.github && (
            <a
              className="pf-btn"
              href={`https://github.com/${data.github}`}
              onClick={preview ? a : undefined}
              target="_blank"
              rel="noreferrer"
            >
              <i className="fa-brands fa-github" /> GitHub
            </a>
          )}
        </div>
      </section>

      <footer className="pf-foot">
        <span>© {data.name}</span>
        <span>Built with AutoPortfolio</span>
      </footer>
    </div>
  );
}

function SiteNav({ active = "showcase", cta = true }) {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const hasGithub = !!store.getGithub();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  function logout() {
    close();
    store.logout();
    navigate("/");
  }
  return (
    <header className={`site-nav${open ? " open" : ""}`}>
      <Link className="brand" to="/" onClick={close}>
        AutoPortfolio
      </Link>
      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
      </button>
      <nav onClick={close}>
        {user ? (
          <>
            <NavLink
              className={active === "dashboard" ? "active" : ""}
              to="/dashboard"
            >
              Dashboard
            </NavLink>
            <NavLink
              className={active === "templates" ? "active" : ""}
              to="/templates"
            >
              Templates
            </NavLink>
            <NavLink
              className={active === "showcase" ? "active" : ""}
              to="/showcase"
            >
              Showcase
            </NavLink>
            {hasGithub && (
              <NavLink
                className={active === "profile" ? "active" : ""}
                to="/profile"
              >
                Profile
              </NavLink>
            )}
          </>
        ) : (
          <>
            <a href="/#how-it-works">How it works</a>
            <a href="/#pricing">Pricing</a>
          </>
        )}
      </nav>
      {user ? (
        <div className="nav-actions">
          <span className="nav-user">
            <i className="fa-solid fa-circle-user" /> {user.name}
          </span>
          <button className="dark-btn nav-logout" onClick={logout}>
            <i className="fa-solid fa-arrow-right-from-bracket" /> Logout
          </button>
        </div>
      ) : (
        cta && (
          <div className="nav-actions">
            <Link to="/login" onClick={close}>
              Sign In
            </Link>
            <Link className="dark-btn" to="/signup" onClick={close}>
              Get Started
            </Link>
          </div>
        )
      )}
    </header>
  );
}

function Home() {
  return (
    <div className="framed">
      <SiteNav />
      <main>
        <section id="showcase" className="home-hero">
          <div>
            <span className="pill">Next Generation Builder</span>
            <h1>
              Your Professional Portfolio, <em>Automated.</em>
            </h1>
            <p>
              Transform your GitHub repositories and projects into a high-end,
              gallery-style showcase in minutes. No design skills required.
            </p>
            <div className="hero-actions">
              <Link className="dark-btn big" to="/signup">
                Get Started
              </Link>
              <a className="light-btn big" href="#how-it-works">
                <i className="fa-regular fa-circle-play" /> Watch Demo
              </a>
            </div>
          </div>
          <div className="hero-mock">
            <div />
          </div>
        </section>
        <section className="trusted">
          <p>Trusted by professionals from</p>
          <div>
            <span>Vertex</span>
            <span>Hexa</span>
            <span>Orbit</span>
            <span>Zenith</span>
            <span>Sync</span>
          </div>
        </section>
        <section id="how-it-works" className="steps">
          <h2>How It Works</h2>
          <p>
            Three simple steps to transition from code and manual archives to a
            stunning digital presence.
          </p>
          <div>
            <article>
              <i className="fa-solid fa-link mint" />
              <h3>1. Connect</h3>
              <p>
                Import your existing work directly from GitHub repositories.
              </p>
            </article>
            <article>
              <i className="fa-solid fa-sliders navy" />
              <h3>2. Customize</h3>
              <p>Choose premium templates and fine-tune your brand.</p>
            </article>
            <article>
              <i className="fa-solid fa-rocket teal" />
              <h3>3. Publish</h3>
              <p>Go live with one click and keep your portfolio synced.</p>
            </article>
          </div>
        </section>
        <section id="pricing" className="cta">
          <h2>Ready to showcase your best work?</h2>
          <p>Join thousands of developers and designers using AutoPortfolio.</p>
          <Link className="light-btn big" to="/signup">
            Get Started for Free
          </Link>
          <Link className="outline-btn big" to="/contact">
            Book a Demo
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Auth({ mode }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";
  async function submit(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const password = String(form.get("password"));
    if (!isValidEmail(email))
      return setError("Please enter a valid email address.");
    if (isSignup && password.length < 6)
      return setError("Password must be at least 6 characters.");
    setBusy(true);
    try {
      const res = isSignup
        ? await api.signup({
            name: String(form.get("name")).trim() || "Alex",
            email,
            password,
          })
        : await api.login({ email, password });
      api.setToken(res.token);
      store.setCurrentUser(res.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Link className="home-icon" to="/">
        <i className="fa-solid fa-house" />
      </Link>
      <form className="auth-card" onSubmit={submit}>
        <span className="pill">AutoPortfolio</span>
        <h1>{isSignup ? "Create your account" : "Sign in"}</h1>
        <p>
          {isSignup
            ? "Start turning your GitHub work into a polished portfolio."
            : "Continue building your professional portfolio workspace."}
        </p>
        {isSignup && (
          <>
            <label>Name</label>
            <input name="name" placeholder="Your name" required />
          </>
        )}
        <label>Email</label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
        <label>Password</label>
        <input
          name="password"
          type="password"
          placeholder="Your password"
          required
          minLength={isSignup ? 6 : undefined}
        />
        <button disabled={busy}>
          {busy ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
        </button>
        {error && <small className="error">{error}</small>}
        <p className="switch">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Sign in" : "Create account"}
          </Link>
        </p>
      </form>
    </main>
  );
}

function AccountSettings() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const [username, setUsernameField] = useState(user?.username || "");
  const [check, setCheck] = useState(null); // null | 'checking' | 'available' | 'taken' | 'same'
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean || clean === user?.username) {
      setCheck(clean === user?.username ? "same" : null);
      return;
    }
    setCheck("checking");
    const t = setTimeout(() => {
      api
        .checkUsername(clean)
        .then((res) => setCheck(res.available ? "available" : "taken"))
        .catch(() => setCheck(null));
    }, 400);
    return () => clearTimeout(t);
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveUsername() {
    setSavingName(true);
    setNameMsg("");
    try {
      const res = await api.setUsername(username);
      const nextUser = { ...user, username: res.username };
      store.setCurrentUser(nextUser);
      setUsernameField(res.username);
      setCheck("same");
      setNameMsg("Saved! Your public link is updated.");
    } catch (err) {
      setNameMsg(err.message);
    } finally {
      setSavingName(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.deleteAccount();
      store.logout();
      navigate("/");
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  }

  const publicUrl = `${window.location.origin}/u/${username.trim().toLowerCase() || user?.username || ""}`;

  return (
    <section className="account-settings">
      <h2>Account settings</h2>

      <div className="bfield">
        <label>Public portfolio link</label>
        <div className="username-edit">
          <span className="username-prefix">{window.location.origin}/u/</span>
          <input
            value={username}
            onChange={(e) => setUsernameField(e.target.value)}
            placeholder="your-name"
          />
        </div>
        {check === "checking" && <small>Checking availability…</small>}
        {check === "available" && (
          <small style={{ color: "#16a34a" }}>
            Available{" "}
            <button
              className="ghost-btn"
              type="button"
              disabled={savingName}
              onClick={saveUsername}
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </small>
        )}
        {check === "taken" && (
          <small className="error">That link is already taken.</small>
        )}
        {nameMsg && <small>{nameMsg}</small>}
        <small className="hint">Share: {publicUrl}</small>
      </div>

      <div className="danger-zone">
        <h3>Delete account</h3>
        <p>
          Permanently deletes your account and portfolio. This can't be undone.
        </p>
        {!confirmingDelete ? (
          <button
            className="danger-btn"
            type="button"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete my account
          </button>
        ) : (
          <div className="confirm-delete">
            <p>Are you sure? Type your email to confirm.</p>
            <input
              placeholder={user?.email}
              onChange={(e) =>
                setDeleteError(e.target.value === user?.email ? "" : "no-match")
              }
              id="confirm-email-input"
            />
            <div>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  setDeleteError("");
                }}
              >
                Cancel
              </button>
              <button
                className="danger-btn"
                type="button"
                disabled={deleting}
                onClick={(e) => {
                  const input = document.getElementById("confirm-email-input");
                  if (input?.value !== user?.email) {
                    setDeleteError("Email does not match.");
                    return;
                  }
                  deleteAccount();
                }}
              >
                {deleting ? "Deleting…" : "Confirm delete"}
              </button>
            </div>
            {deleteError && deleteError !== "no-match" && (
              <small className="error">{deleteError}</small>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  const [username, setUsername] = useState(store.getGithub()?.username || "");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  function choose(method) {
    localStorage.setItem("buildMethod", method);
    navigate("/templates");
  }
  async function connectGithub(event) {
    event.preventDefault();
    setError("");
    setStatus("loading");
    try {
      const [profile, repos] = await Promise.all([
        fetchProfile(username),
        fetchRepos(username),
      ]);
      store.saveGithub(profile.login, profile, repos);
      localStorage.setItem("buildMethod", "github");
      navigate("/profile");
    } catch (err) {
      setStatus("idle");
      setError(err.message);
    }
  }
  return (
    <div className="framed dashboard-frame">
      <SiteNav active="dashboard" cta={false} />
      <main className="dashboard">
        <h1>Hello, {user?.name || "Alex"}!</h1>
        <p>How would you like to build your portfolio today?</p>
        <div className="choice-grid">
          <article>
            <i className="fa-solid fa-terminal icon navy" />
            <i className="fa-solid fa-cloud-arrow-up ghost" />
            <h2>Import from GitHub</h2>
            <p>
              Seamlessly sync your technical journey. We auto-fetch your public
              repositories, top contributions, and language statistics.
            </p>
            <form className="github-connect" onSubmit={connectGithub}>
              <div className="gh-field">
                <i className="fa-brands fa-github" />
                <span className="gh-at">@</span>
                <input
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-github-username"
                  autoComplete="off"
                  spellCheck="false"
                  required
                />
              </div>
              <button disabled={status === "loading"}>
                {status === "loading" ? (
                  <>
                    <i className="fa-solid fa-rotate fa-spin" /> Syncing your
                    repos…
                  </>
                ) : (
                  <>
                    <i className="fa-brands fa-github" /> Connect GitHub
                  </>
                )}
              </button>
            </form>
            {error && <small className="error">{error}</small>}
            <small>Fetches your public repositories</small>
          </article>
          <article>
            <i className="fa-solid fa-wand-magic-sparkles icon mint" />
            <i className="fa-solid fa-pen ghost" />
            <h2>Build Manually</h2>
            <p>
              Full creative control over every detail. Best for designers,
              product managers, or specific case studies.
            </p>
            <button className="outline" onClick={() => choose("manual")}>
              <i className="fa-regular fa-circle-plus" /> Start Building
            </button>
            <small>Custom canvas approach</small>
          </article>
        </div>
        <section className="guide">
          <span>Quick Start Guide</span>
          <h2>New to AutoPortfolio?</h2>
          <p>
            Watch a 2-minute walkthrough on how to leverage our AI to generate
            project descriptions.
          </p>
          <Link to="/showcase">
            <i className="fa-regular fa-circle-play" /> Watch Demo
          </Link>
        </section>
        <AccountSettings />
      </main>
      <Footer />
    </div>
  );
}

function Templates() {
  const navigate = useNavigate();
  const { data, setData, save, loaded } = usePortfolio();
  function use(id) {
    const next = { ...data, template: id };
    setData(next);
    save(next);
    navigate("/builder");
  }
  return (
    <PageShell active="templates">
      <section className="inner-heading">
        <span className="pill">Templates</span>
        <h1>Choose your portfolio style</h1>
        <p>
          Each style restyles your whole portfolio. You can switch anytime in
          the builder.
        </p>
      </section>
      {!loaded ? (
        <p>Loading…</p>
      ) : (
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <article
              className={`template-card${data.template === t.id ? " selected" : ""}`}
              key={t.id}
            >
              <div className={`template-preview ${t.id}`}>
                {data.template === t.id && (
                  <span className="tpl-badge">
                    <i className="fa-solid fa-check" /> Selected
                  </span>
                )}
              </div>
              <h2>{t.name}</h2>
              <p>{t.desc}</p>
              <button onClick={() => use(t.id)}>
                {data.template === t.id ? "Edit in Builder" : "Use Template"}
              </button>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

const ACCENTS = [
  "#007b70",
  "#111a2c",
  "#2563eb",
  "#7c3aed",
  "#e11d48",
  "#ea580c",
  "#16a34a",
];

function Builder() {
  const navigate = useNavigate();
  const github = store.getGithub();
  const ai = useAIAssist();
  const { data, setData, save, loaded } = usePortfolio();
  const [saved, setSaved] = useState(false);
  const [publishError, setPublishError] = useState("");

  // Seed from GitHub once, the first time the builder loads with no prior data.
  useEffect(() => {
    if (loaded && !localStorage.getItem("builderSeeded") && github?.profile) {
      setData((d) => ({ ...d, ...portfolioSeed(github) }));
      localStorage.setItem("builderSeeded", "1");
    }
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave to the server shortly after the user stops typing.
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      save(data).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [data, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (value) => setData((d) => ({ ...d, [key]: value }));
  const field = (key) => (e) => set(key)(e.target.value);

  function importGithub() {
    if (github?.profile) setData((d) => ({ ...d, ...portfolioSeed(github) }));
  }
  function addSkill(value) {
    const s = value.trim();
    if (s && !data.skills.includes(s)) set("skills")([...data.skills, s]);
  }
  function removeSkill(skill) {
    set("skills")(data.skills.filter((s) => s !== skill));
  }
  function setProject(i, key, value) {
    set("projects")(
      data.projects.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)),
    );
  }
  function setProjectTags(i, value) {
    setProject(
      i,
      "tags",
      value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    );
  }
  function addProject() {
    set("projects")([
      ...data.projects,
      { title: "New Project", description: "", link: "", tags: [] },
    ]);
  }
  function removeProject(i) {
    set("projects")(data.projects.filter((_, idx) => idx !== i));
  }
  async function manualSave() {
    await save(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }
  async function publish() {
    if (data.email && !isValidEmail(data.email))
      return setPublishError("Fix your email before publishing.");
    if (data.website && !isValidUrlOrEmpty(data.website))
      return setPublishError("Fix your website link before publishing.");
    if (data.github && !isValidGithubUsernameOrEmpty(data.github))
      return setPublishError("Fix your GitHub username before publishing.");
    setPublishError("");
    await save(data);
    navigate("/showcase");
  }

  return (
    <div className="builder-page">
      <header className="builder-bar">
        <Link className="brand" to="/dashboard">
          <i className="fa-solid fa-wand-magic-sparkles" /> AutoPortfolio
        </Link>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/templates">Templates</Link>
        </nav>
        <div className="builder-bar-actions">
          <button className="ghost-btn" onClick={manualSave}>
            <i className="fa-regular fa-floppy-disk" /> Save
          </button>
          <button className="dark-btn" onClick={publish}>
            <i className="fa-solid fa-rocket" /> Publish
          </button>
        </div>
      </header>
      {publishError && (
        <p className="error" style={{ padding: "10px 30px 0" }}>
          {publishError}
        </p>
      )}

      <main className="builder-shell">
        <aside className="builder-panel">
          <SkillField label="Template">
            <div className="tpl-switch">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  className={data.template === t.id ? "active" : ""}
                  onClick={() => set("template")(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </SkillField>

          <SkillField label="Theme">
            <div className="seg">
              {["light", "dark"].map((mode) => (
                <button
                  key={mode}
                  className={data.theme === mode ? "active" : ""}
                  onClick={() => set("theme")(mode)}
                >
                  {mode === "light" ? "☼ Light" : "☾ Dark"}
                </button>
              ))}
            </div>
          </SkillField>

          <SkillField label="Accent color">
            <div className="accent-row">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  className={`accent-dot${data.accent === c ? " active" : ""}`}
                  style={{ background: c }}
                  onClick={() => set("accent")(c)}
                  aria-label={c}
                />
              ))}
              <label
                className="accent-custom"
                style={{ background: data.accent }}
              >
                <input
                  type="color"
                  value={data.accent}
                  onChange={field("accent")}
                />
              </label>
            </div>
          </SkillField>

          {github?.profile && (
            <button className="import-btn" onClick={importGithub}>
              <i className="fa-brands fa-github" /> Import data from GitHub
            </button>
          )}

          <h3 className="panel-h">AI Assistant</h3>
          {ai.error && <small className="error">{ai.error}</small>}

          <h3 className="panel-h">Identity</h3>
          <SkillField label="Name">
            <input value={data.name} onChange={field("name")} />
          </SkillField>
          <SkillField label="Role / title">
            <input value={data.role} onChange={field("role")} />
          </SkillField>
          <SkillField label="Tagline">
            <textarea
              rows="2"
              value={data.tagline}
              onChange={field("tagline")}
            />
          </SkillField>
          <SkillField label="About">
            <textarea rows="4" value={data.about} onChange={field("about")} />
            <button
              type="button"
              className="ai-btn"
              disabled={ai.isLoading("about")}
              onClick={async () => {
                const result = await ai.improveAbout({
                  name: data.name,
                  role: data.role,
                  skills: data.skills,
                  location: data.location,
                  projects: data.projects,
                });
                if (result) set("about")(result);
              }}
            >
              {ai.isLoading("about") ? (
                <>
                  <i className="fa-solid fa-rotate fa-spin" /> Generating…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles" /> Generate
                  with AI
                </>
              )}
            </button>
          </SkillField>

          <h3 className="panel-h">Contact</h3>
          <SkillField label="Email">
            <input value={data.email} onChange={field("email")} />
          </SkillField>
          {data.email && !isValidEmail(data.email) && (
            <small className="error">
              That doesn't look like a valid email.
            </small>
          )}
          <SkillField label="Location">
            <input
              value={data.location}
              onChange={field("location")}
              placeholder="City, Country"
            />
          </SkillField>
          <SkillField label="Website">
            <input
              value={data.website}
              onChange={field("website")}
              placeholder="example.com"
            />
          </SkillField>
          {data.website && !isValidUrlOrEmpty(data.website) && (
            <small className="error">
              That doesn't look like a valid website.
            </small>
          )}
          <SkillField label="GitHub username">
            <input
              value={data.github}
              onChange={field("github")}
              placeholder="username"
            />
          </SkillField>
          {data.github && !isValidGithubUsernameOrEmpty(data.github) && (
            <small className="error">
              That doesn't look like a valid GitHub username.
            </small>
          )}

          <h3 className="panel-h">Skills</h3>
          <div className="chip-row">
            {data.skills.map((skill) => (
              <span className="chip" key={skill}>
                {skill}
                <button onClick={() => removeSkill(skill)} aria-label="Remove">
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            className="chip-input"
            placeholder="Type a skill, press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSkill(e.target.value);
                e.target.value = "";
              }
            }}
          />

          <div className="panel-h-row">
            <h3 className="panel-h">Projects</h3>
            <button className="add-btn" onClick={addProject}>
              <i className="fa-solid fa-plus" /> Add
            </button>
          </div>
          {data.projects.map((project, i) => (
            <div className="proj-edit" key={i}>
              <div className="proj-edit-head">
                <strong>Project {i + 1}</strong>
                <button
                  className="del-btn"
                  onClick={() => removeProject(i)}
                  aria-label="Delete"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
              <input
                value={project.title}
                onChange={(e) => setProject(i, "title", e.target.value)}
                placeholder="Title"
              />
              <textarea
                rows="2"
                value={project.description}
                onChange={(e) => setProject(i, "description", e.target.value)}
                placeholder="Description"
              />
              <button
                type="button"
                className="ai-btn small"
                disabled={ai.isLoading(`project-${i}`)}
                onClick={async () => {
                  const result = await ai.improveDescription(i, project, {
                    role: data.role,
                    skills: data.skills,
                  });
                  if (result) setProject(i, "description", result);
                }}
              >
                {ai.isLoading(`project-${i}`) ? (
                  <>
                    <i className="fa-solid fa-rotate fa-spin" /> Improving…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles" /> Improve
                    with AI
                  </>
                )}
              </button>
              <input
                value={project.link}
                onChange={(e) => setProject(i, "link", e.target.value)}
                placeholder="Link (https://…)"
              />
              <input
                value={(project.tags || []).join(", ")}
                onChange={(e) => setProjectTags(i, e.target.value)}
                placeholder="Tags (comma separated)"
              />
            </div>
          ))}
        </aside>

        <section
          className="builder-preview"
          style={{
            "--builder-preview-bg":
              data.theme === "dark" ? "#1e2430" : "#eef1f4",
          }}
        >
          <div className="preview-stage">
            <div className="stage-bar">
              <span />
              <span />
              <span />
              <b>your-portfolio.com</b>
            </div>
            <div className="stage-scroll">
              <Portfolio data={data} preview />
            </div>
          </div>
        </section>
      </main>

      {saved && (
        <div className="saving-toast">
          <i className="fa-solid fa-check" /> Saved
        </div>
      )}
    </div>
  );
}

function SkillField({ label, children }) {
  return (
    <div className="bfield">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Showcase() {
  const { data, loaded } = usePortfolio();
  const user = store.getCurrentUser();
  const [copied, setCopied] = useState(false);
  const publicUrl = user?.username
    ? `${window.location.origin}/u/${user.username}`
    : "";
  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard?.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  if (!loaded)
    return (
      <div className="showcase-frame">
        <p style={{ padding: "4rem", textAlign: "center" }}>Loading…</p>
      </div>
    );
  return (
    <div className="showcase-frame">
      <Portfolio data={data} />
      <div className="owner-bar">
        <span className="owner-tag">
          <i className="fa-solid fa-eye" /> Preview
        </span>
        {publicUrl && (
          <button className="owner-edit" onClick={copyLink} type="button">
            <i className={`fa-solid ${copied ? "fa-check" : "fa-link"}`} />{" "}
            {copied ? "Copied!" : publicUrl.replace(/^https?:\/\//, "")}
          </button>
        )}
        <Link className="owner-edit" to="/builder">
          <i className="fa-solid fa-pen" /> Edit portfolio
        </Link>
        <Link className="owner-home" to="/dashboard" aria-label="Dashboard">
          <i className="fa-solid fa-house" />
        </Link>
      </div>
    </div>
  );
}

// Read-only, public, no login required — this is the link you actually share.
function PublicPortfolio() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .getPublicPortfolio(username)
      .then((res) => {
        if (active) setData(res.portfolio);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [username]);
  if (error)
    return (
      <main style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <h1>Portfolio not found</h1>
        <p>{error}</p>
        <Link to="/">Go home</Link>
      </main>
    );
  if (!data)
    return (
      <main style={{ padding: "5rem 2rem", textAlign: "center" }}>
        <p>Loading…</p>
      </main>
    );
  return <Portfolio data={data} />;
}

function RepoGrid({ repos, username }) {
  if (!repos.length)
    return (
      <section className="works">
        <div className="works-heading">
          <div>
            <h2>Repositories</h2>
            <p>No public repositories found for @{username}.</p>
          </div>
        </div>
      </section>
    );
  return (
    <section className="works">
      <div className="works-heading">
        <div>
          <h2>Repositories</h2>
          <p>Live from GitHub, sorted by popularity.</p>
        </div>
        <a
          href={`https://github.com/${username}?tab=repositories`}
          target="_blank"
          rel="noreferrer"
        >
          View all on GitHub <i className="fa-solid fa-arrow-right" />
        </a>
      </div>
      <div className="repo-grid">
        {repos.map((repo) => (
          <article className="repo-card" key={repo.id}>
            <div className="repo-top">
              <i className="fa-solid fa-book-bookmark" />
              <a href={repo.url} target="_blank" rel="noreferrer">
                {repo.name}
              </a>
            </div>
            <p>{repo.description || "No description provided."}</p>
            {repo.topics.length > 0 && (
              <div className="repo-topics">
                {repo.topics.slice(0, 4).map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            )}
            <div className="repo-meta">
              {repo.language && (
                <span>
                  <i className="fa-solid fa-circle" /> {repo.language}
                </span>
              )}
              <span>
                <i className="fa-regular fa-star" /> {repo.stars}
              </span>
              <span>
                <i className="fa-solid fa-code-fork" /> {repo.forks}
              </span>
              {repo.homepage && (
                <a href={repo.homepage} target="_blank" rel="noreferrer">
                  <i className="fa-solid fa-arrow-up-right-from-square" /> Live
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Profile() {
  const navigate = useNavigate();
  const github = store.getGithub();
  const languages = useMemo(() => {
    if (!github?.repos?.length) return [];
    const counts = {};
    github.repos.forEach((repo) => {
      if (repo.language)
        counts[repo.language] = (counts[repo.language] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang)
      .slice(0, 8);
  }, [github]);
  const totalStars = useMemo(
    () => github?.repos?.reduce((sum, repo) => sum + repo.stars, 0) || 0,
    [github],
  );
  function disconnect() {
    store.clearGithub();
    navigate("/dashboard");
  }
  if (!github || !github.profile)
    return (
      <PageShell active="profile">
        <section className="inner-heading">
          <span className="pill">Profile</span>
          <h1>No GitHub account connected</h1>
          <p>
            Connect your GitHub account to generate your profile automatically.
          </p>
        </section>
        <button className="dark-btn big" onClick={disconnect}>
          <i className="fa-brands fa-github" /> Connect GitHub
        </button>
      </PageShell>
    );
  const { profile, repos } = github;
  return (
    <div className="framed profile-frame">
      <SiteNav active="profile" />
      <section className="gh-profile">
        <div className="gh-profile-card">
          <img
            className="gh-avatar"
            src={profile.avatar}
            alt={profile.name}
            width="160"
            height="160"
          />
          <div className="gh-identity">
            <h1>{profile.name}</h1>
            <a
              className="gh-login"
              href={profile.url}
              target="_blank"
              rel="noreferrer"
            >
              @{profile.login}
            </a>
            {profile.bio && <p className="gh-bio">{profile.bio}</p>}
            <div className="gh-tags">
              {profile.company && (
                <span>
                  <i className="fa-solid fa-building" /> {profile.company}
                </span>
              )}
              {profile.location && (
                <span>
                  <i className="fa-solid fa-location-dot" /> {profile.location}
                </span>
              )}
              {profile.blog && (
                <a
                  href={
                    /^https?:\/\//.test(profile.blog)
                      ? profile.blog
                      : `https://${profile.blog}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="fa-solid fa-link" /> Website
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="fa-brands fa-x-twitter" /> @{profile.twitter}
                </a>
              )}
            </div>
            <div className="gh-actions">
              <a
                className="dark-btn"
                href={profile.url}
                target="_blank"
                rel="noreferrer"
              >
                <i className="fa-brands fa-github" /> View on GitHub
              </a>
              <button className="gh-disconnect" onClick={disconnect}>
                <i className="fa-solid fa-arrow-right-from-bracket" />{" "}
                Disconnect
              </button>
            </div>
          </div>
        </div>
        <div className="gh-stats">
          <div>
            <strong>{profile.publicRepos}</strong>
            <span>Repositories</span>
          </div>
          <div>
            <strong>{profile.followers}</strong>
            <span>Followers</span>
          </div>
          <div>
            <strong>{profile.following}</strong>
            <span>Following</span>
          </div>
          <div>
            <strong>{totalStars}</strong>
            <span>Stars earned</span>
          </div>
        </div>
        {languages.length > 0 && (
          <div className="gh-langs">
            <h2>Top Languages</h2>
            <div>
              {languages.map((lang) => (
                <b key={lang}>{lang}</b>
              ))}
            </div>
          </div>
        )}
      </section>
      <RepoGrid repos={repos} username={profile.login} />
      <Footer />
    </div>
  );
}

function Contact() {
  function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    store.saveMessage("autop_messages", {
      name: form.get("name"),
      email: form.get("email"),
      message: form.get("message"),
    });
    e.currentTarget.reset();
    alert("Message saved locally.");
  }
  return (
    <PageShell>
      <section className="inner-heading">
        <span className="pill">Contact</span>
        <h1>Book a demo</h1>
        <p>Send a message. It will be saved locally for now.</p>
      </section>
      <form className="contact-form" onSubmit={submit}>
        <label>Name</label>
        <input name="name" required />
        <label>Email</label>
        <input name="email" type="email" required />
        <label>Message</label>
        <textarea name="message" rows="5" required />
        <button>Save Message</button>
      </form>
    </PageShell>
  );
}

function PageShell({ children, active }) {
  return (
    <div className="framed page-shell">
      <SiteNav active={active} />
      <main>{children}</main>
    </div>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div>
        <h2>AutoPortfolio</h2>
        <p>
          © 2024 AutoPortfolio. Curated Minimalism for the modern professional.
        </p>
      </div>
      <nav>
        <a>Privacy</a>
        <a>Terms</a>
        <Link to="/dashboard">Github Import</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </footer>
  );
}

function RequireAuth({ children }) {
  const user = store.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/templates"
        element={
          <RequireAuth>
            <Templates />
          </RequireAuth>
        }
      />
      <Route
        path="/builder"
        element={
          <RequireAuth>
            <Builder />
          </RequireAuth>
        }
      />
      <Route
        path="/showcase"
        element={
          <RequireAuth>
            <Showcase />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route path="/contact" element={<Contact />} />
      <Route path="/u/:username" element={<PublicPortfolio />} />
    </Routes>
  );
}
