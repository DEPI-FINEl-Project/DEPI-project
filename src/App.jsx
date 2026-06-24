import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { store } from './storage.js';

const skills = ['React', 'Node.js', 'Python', 'AWS', 'TypeScript'];

function SiteNav({ active = 'showcase', cta = true }) {
  return (
    <header className="site-nav">
      <Link className="brand" to="/">AutoPortfolio</Link>
      <nav>
        <NavLink className={active === 'showcase' ? 'active' : ''} to="/showcase">Showcase</NavLink>
        <NavLink className={active === 'templates' ? 'active' : ''} to="/templates">Templates</NavLink>
        <a href="/#pricing">Pricing</a>
        <NavLink className={active === 'dashboard' ? 'active' : ''} to="/dashboard">Dashboard</NavLink>
      </nav>
      {cta && <div className="nav-actions"><Link to="/login">Sign In</Link><Link className="dark-btn" to="/signup">Get Started</Link></div>}
    </header>
  );
}

function Home() {
  return <div className="framed"><SiteNav /><main><section id="showcase" className="home-hero"><div><span className="pill">Next Generation Builder</span><h1>Your Professional Portfolio, <em>Automated.</em></h1><p>Transform your GitHub repositories and projects into a high-end, gallery-style showcase in minutes. No design skills required.</p><div className="hero-actions"><Link className="dark-btn big" to="/signup">Get Started</Link><a className="light-btn big" href="#how-it-works"><i className="fa-regular fa-circle-play" /> Watch Demo</a></div></div><div className="hero-mock"><div /></div></section><section className="trusted"><p>Trusted by professionals from</p><div><span>Vertex</span><span>Hexa</span><span>Orbit</span><span>Zenith</span><span>Sync</span></div></section><section id="how-it-works" className="steps"><h2>How It Works</h2><p>Three simple steps to transition from code and manual archives to a stunning digital presence.</p><div><article><i className="fa-solid fa-link mint" /><h3>1. Connect</h3><p>Import your existing work directly from GitHub repositories.</p></article><article><i className="fa-solid fa-sliders navy" /><h3>2. Customize</h3><p>Choose premium templates and fine-tune your brand.</p></article><article><i className="fa-solid fa-rocket teal" /><h3>3. Publish</h3><p>Go live with one click and keep your portfolio synced.</p></article></div></section><section id="pricing" className="cta"><h2>Ready to showcase your best work?</h2><p>Join thousands of developers and designers using AutoPortfolio.</p><Link className="light-btn big" to="/signup">Get Started for Free</Link><Link className="outline-btn big" to="/contact">Book a Demo</Link></section></main><Footer /></div>;
}

function Auth({ mode }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email')).trim().toLowerCase();
    const password = String(form.get('password'));
    if (isSignup) {
      store.saveUser({ name: String(form.get('name')).trim() || 'Alex', email, password });
      navigate('/dashboard');
      return;
    }
    const user = store.findUser(email, password);
    if (!user) return setError('Email or password is incorrect.');
    store.setCurrentUser({ name: user.name, email: user.email });
    navigate('/dashboard');
  }
  return <main className="auth-page"><Link className="home-icon" to="/"><i className="fa-solid fa-house" /></Link><form className="auth-card" onSubmit={submit}><span className="pill">AutoPortfolio</span><h1>{isSignup ? 'Create your account' : 'Sign in'}</h1><p>{isSignup ? 'Start turning your GitHub work into a polished portfolio.' : 'Continue building your professional portfolio workspace.'}</p>{isSignup && <><label>Name</label><input name="name" placeholder="Your name" required /></>}<label>Email</label><input name="email" type="email" placeholder="you@example.com" required /><label>Password</label><input name="password" type="password" placeholder="Your password" required /><button>{isSignup ? 'Create Account' : 'Sign In'}</button>{error && <small className="error">{error}</small>}<p className="switch">{isSignup ? 'Already have an account?' : "Don't have an account?"} <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create account'}</Link></p></form></main>;
}

function Dashboard() {
  const navigate = useNavigate();
  const user = store.getCurrentUser();
  function choose(method) { localStorage.setItem('buildMethod', method); navigate('/templates'); }
  return <div className="framed dashboard-frame"><SiteNav active="dashboard" cta={false} /><main className="dashboard"><h1>Hello, {user?.name || 'Alex'}!</h1><p>How would you like to build your portfolio today?</p><div className="choice-grid"><article><i className="fa-solid fa-terminal icon navy" /><i className="fa-solid fa-cloud-arrow-up ghost" /><h2>Import from GitHub</h2><p>Seamlessly sync your technical journey. We auto-fetch your public repositories, top contributions, and language statistics.</p><button onClick={() => choose('github')}><i className="fa-solid fa-link" /> Connect Account</button><small>Syncs in 60 seconds</small></article><article><i className="fa-solid fa-wand-magic-sparkles icon mint" /><i className="fa-solid fa-pen ghost" /><h2>Build Manually</h2><p>Full creative control over every detail. Best for designers, product managers, or specific case studies.</p><button className="outline" onClick={() => choose('manual')}><i className="fa-regular fa-circle-plus" /> Start Building</button><small>Custom canvas approach</small></article></div><section className="guide"><span>Quick Start Guide</span><h2>New to AutoPortfolio?</h2><p>Watch a 2-minute walkthrough on how to leverage our AI to generate project descriptions.</p><Link to="/showcase"><i className="fa-regular fa-circle-play" /> Watch Demo</Link></section></main><Footer /></div>;
}

function Templates() {
  const navigate = useNavigate();
  const templates = ['minimal', 'developer', 'studio'];
  return <PageShell active="templates"><section className="inner-heading"><span className="pill">Templates</span><h1>Choose your portfolio style</h1><p>Select a premium layout. Your choice is saved locally and used by your workspace.</p></section><div className="template-grid">{templates.map((template) => <article className="template-card" key={template}><div className={`template-preview ${template}`} /><h2>{template[0].toUpperCase() + template.slice(1)}</h2><p>Premium responsive layout tuned for modern portfolio presentation.</p><button onClick={() => { store.saveTemplate(template); navigate('/builder'); }}>Use Template</button></article>)}</div></PageShell>;
}

function Builder() {
  const initial = store.getBuilder();
  const [data, setData] = useState(initial);
  const navigate = useNavigate();
  useEffect(() => store.saveBuilder(data), [data]);
  const [before, after = 'Developer.'] = data.headline.split('&');
  return <div className="builder-page framed"><header className="builder-nav"><Link className="brand" to="/"><i className="fa-solid fa-wand-magic-sparkles" /> AutoPortfolio</Link><nav><Link className="active" to="/dashboard">Dashboard</Link><Link to="/showcase">Showcase</Link><Link to="/templates">Templates</Link><a href="/#pricing">Pricing</a></nav><button onClick={() => store.saveBuilder(data)}>Save Draft</button><button onClick={() => navigate('/showcase')}>Publish Portfolio</button></header><main className="builder-shell"><aside><h2><i className="fa-solid fa-palette" /> Visual Identity</h2><label>Theme Mode</label><div className="mode-toggle"><button className="active">☼ Light</button><button>☾ Dark</button></div><label>Accent Color</label><div className="accent-row"><button className="black" /><button /><button className="green" /><button className="red" /><button className="plus">+</button></div><h2><i className="fa-solid fa-list-check" /> Hero Content</h2><label>Headline</label><input value={data.headline} onChange={(e) => setData({ ...data, headline: e.target.value })} /><label>Subtext</label><textarea rows="4" value={data.subtext} onChange={(e) => setData({ ...data, subtext: e.target.value })} /><h2><i className="fa-solid fa-layer-group" /> Projects Grid</h2><div className="builder-project"><span /><div><strong>Vanguard OS Redesign</strong><small>UI/UX Design • 2024</small></div></div></aside><section className="preview-wrap"><div className="device-toggle"><i className="fa-solid fa-desktop" /><i className="fa-solid fa-tablet-screen-button" /><i className="fa-solid fa-mobile-screen" /><b>Live Preview</b></div><div className="preview-card"><span>Portfolio Preview</span><h1>{before.trim()} &<br /><em>{after.trim()}</em></h1><p>{data.subtext}</p><div className="preview-buttons"><a>View Projects <i className="fa-solid fa-arrow-down" /></a><a>Contact Me</a></div><div className="preview-heading"><h2>Selected Works</h2><a>All Projects</a></div><div className="preview-grid"><div /><div /></div></div></section></main><div className="saving-toast"><i className="fa-solid fa-rotate" /> Saving Changes...</div></div>;
}

function Showcase() {
  return <div className="framed showcase-frame"><SiteNav active="showcase" /><section className="portfolio-hero"><span><i className="fa-solid fa-bolt" /> Available for hire</span><h1>Alex Rivera</h1><p>Senior Full-Stack Developer crafting high-performance digital experiences with surgical precision.</p><div>{skills.map((skill) => <b key={skill}>{skill}</b>)}</div></section><section className="works"><div className="works-heading"><div><h2>Selected Works</h2><p>A curated selection of industrial-grade applications.</p></div><a>View all projects <i className="fa-solid fa-arrow-right" /></a></div><div className="works-grid">{['Nexus Analytics', 'Vellum OS', 'Cipher Protocol', 'Apex Cloud'].map((title, index) => <article key={title}><div className={`work-img img-${index}`} /><h3>{title}</h3><p>{index === 0 ? 'Enterprise-scale real-time data processing engine.' : 'A browser-based minimalist operating system environment.'}</p></article>)}</div></section><section className="career"><h2>Career Path</h2>{['Lead Software Engineer', 'Senior Full-Stack Developer', 'Software Engineer'].map((role, i) => <article key={role}><i /><div><h3>{role}</h3><strong>{i === 0 ? 'Stripe • Remote' : i === 1 ? 'Airbnb • San Francisco, CA' : 'Vercel • Hybrid'}</strong><p>Pioneering core infrastructure projects focusing on reliability, performance, and developer experience.</p></div><span>{i === 0 ? '2021 — Present' : i === 1 ? '2018 — 2021' : '2015 — 2018'}</span></article>)}</section><section className="showcase-contact"><h2>Let's build something extraordinary.</h2><p>Currently accepting new projects and consulting opportunities.</p><ContactLead /></section><Footer /></div>;
}

function ContactLead() {
  function submit(e) { e.preventDefault(); store.saveMessage('autop_showcase_leads', { email: new FormData(e.currentTarget).get('email') }); e.currentTarget.reset(); alert('Saved locally.'); }
  return <form onSubmit={submit} className="lead-form"><input name="email" type="email" placeholder="Email address" required /><button>Say Hello</button></form>;
}

function Contact() {
  function submit(e) { e.preventDefault(); const form = new FormData(e.currentTarget); store.saveMessage('autop_messages', { name: form.get('name'), email: form.get('email'), message: form.get('message') }); e.currentTarget.reset(); alert('Message saved locally.'); }
  return <PageShell><section className="inner-heading"><span className="pill">Contact</span><h1>Book a demo</h1><p>Send a message. It will be saved locally for now.</p></section><form className="contact-form" onSubmit={submit}><label>Name</label><input name="name" required /><label>Email</label><input name="email" type="email" required /><label>Message</label><textarea name="message" rows="5" required /><button>Save Message</button></form></PageShell>;
}

function PageShell({ children, active }) { return <div className="framed page-shell"><SiteNav active={active} /><main>{children}</main></div>; }
function Footer() { return <footer className="footer"><div><h2>AutoPortfolio</h2><p>© 2024 AutoPortfolio. Curated Minimalism for the modern professional.</p></div><nav><a>Privacy</a><a>Terms</a><Link to="/dashboard">Github Import</Link><Link to="/contact">Contact</Link></nav></footer>; }

export default function App() {
  return <Routes><Route path="/" element={<Home />} /><Route path="/login" element={<Auth mode="login" />} /><Route path="/signup" element={<Auth mode="signup" />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/templates" element={<Templates />} /><Route path="/builder" element={<Builder />} /><Route path="/showcase" element={<Showcase />} /><Route path="/contact" element={<Contact />} /></Routes>;
}
