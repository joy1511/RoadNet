import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  GitBranch,
  Mail,
  Map,
  Menu,
  Network,
  Radar,
  Satellite,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Dashboard } from './astroroute/Dashboard';
import { NetworkMapPage } from './astroroute/NetworkMapPage';
import { SpaceParticles } from './astroroute/SpaceParticles';

const navItems = [
  { label: 'Home', href: '#' },
  { label: 'Dashboard', href: '#/dashboard' },
  { label: 'Network Map', href: '#/map' },
  { label: 'Contact Us', href: '#/contact' },
];

function useHashRoute() {
  const [route, setRoute] = useState(window.location.hash || '#');

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-nav">
      <a href="#" className="brand-mark" aria-label="AstroRoute home">
        <span className="brand-icon">
          <Network size={18} />
        </span>
        Astro<span>Route</span>
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <a className="nav-cta" href="#/dashboard">
        Launch Dashboard
        <ArrowRight size={16} />
      </a>

      <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function HomePage() {
  const features = [
    { icon: Satellite, label: 'Satellite imagery', value: 'SpaceNet + DeepGlobe ready' },
    { icon: GitBranch, label: 'Graph healing', value: 'MST + Disjoint Set repair' },
    { icon: Activity, label: 'Stress testing', value: 'Node ablation + resilience index' },
  ];

  const phases = [
    {
      icon: BrainCircuit,
      title: 'Occlusion-robust segmentation',
      copy: 'Recover road masks from satellite tiles while accounting for cloud, canopy, shadow, and clutter.',
    },
    {
      icon: GitBranch,
      title: 'Routable graph reconstruction',
      copy: 'Skeletonize masks into centerlines, then bridge broken topology into a connected transport graph.',
    },
    {
      icon: Radar,
      title: 'Criticality analytics',
      copy: 'Rank gatekeeper nodes with betweenness centrality and quantify the cost of targeted failures.',
    },
    {
      icon: Map,
      title: 'Planner-facing dashboard',
      copy: 'Explore Bengaluru demo data, upload imagery, inspect vulnerable nodes, and run what-if simulations.',
    },
  ];

  return (
    <div className="site-shell">
      <SpaceParticles />
      <SiteNav />
      <main>
        <section className="hero-section">
          <div className="hero-content">
            <p className="eyebrow">Network Resilience Analysis</p>
            <h1>AstroRoute</h1>
            <p className="hero-subtitle">
              Occlusion-robust road extraction and graph-theoretic resilience analysis for critical route planning.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#/dashboard">
                Open Dashboard
                <ArrowRight size={18} />
              </a>
              <a className="secondary-button" href="#/map">
                Network Map
              </a>
              <a className="secondary-button" href="#/contact">
                Contact Us
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="map-panel">
              <div className="map-toolbar">
                <span />
                <span />
                <span />
              </div>
              <div className="route-grid">
                <span className="route route-a" />
                <span className="route route-b" />
                <span className="route route-c" />
                <span className="node node-a" />
                <span className="node node-b" />
                <span className="node node-c" />
                <span className="node node-d" />
              </div>
              <div className="metric-strip">
                <div>
                  <strong>0.82</strong>
                  <span>Resilience</span>
                </div>
                <div>
                  <strong>18</strong>
                  <span>Gatekeepers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-row" aria-label="Core capabilities">
          {features.map((feature) => (
            <article key={feature.label}>
              <feature.icon size={22} />
              <div>
                <h2>{feature.label}</h2>
                <p>{feature.value}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <p className="eyebrow">System Architecture</p>
            <h2>Four clean layers from pixels to decisions</h2>
            <p>
              The roadmap separates the prototype into model, graph, network-science, and dashboard layers so each
              piece can be developed and verified independently.
            </p>
          </div>
          <div className="phase-grid">
            {phases.map((phase, index) => (
              <article key={phase.title} className="phase-card">
                <div className="phase-number">0{index + 1}</div>
                <phase.icon size={24} />
                <h3>{phase.title}</h3>
                <p>{phase.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="content-section split-section">
          <div>
            <p className="eyebrow">Technology Stack</p>
            <h2>Modern tools for robust analysis</h2>
          </div>
          <div className="check-list">
            <p>
              <CheckCircle2 size={18} />
              Deep learning segmentation with PyTorch and HuggingFace transformers.
            </p>
            <p>
              <CheckCircle2 size={18} />
              Graph algorithms with NetworkX for centrality and resilience analysis.
            </p>
            <p>
              <CheckCircle2 size={18} />
              Interactive visualization with React, TypeScript, and Leaflet maps.
            </p>
          </div>
        </section>
      </main>
      <footer className="site-footer">© 2026 AstroRoute. All rights reserved.</footer>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="site-shell">
      <SpaceParticles />
      <SiteNav />
      <main className="page-main">
        <section className="contact-hero">
          <p className="eyebrow">Contact Us</p>
          <h1>Let&apos;s talk AstroRoute</h1>
          <p>
            For questions about the AstroRoute system or integration support, reach the team through the
            project channels below.
          </p>
        </section>

        <section className="contact-grid">
          <article className="contact-card">
            <Mail size={24} />
            <h2>Email</h2>
            <p>astroroute.team@example.com</p>
          </article>
          <article className="contact-card">
            <Database size={24} />
            <h2>Project Scope</h2>
            <p>Segmentation, graph healing, centrality analysis, ablation simulation, and dashboard integration.</p>
          </article>
          <article className="contact-card">
            <ShieldCheck size={24} />
            <h2>Demo Focus</h2>
            <p>Bengaluru road-network criticality with resilient infrastructure planning workflows.</p>
          </article>
        </section>

        <section className="contact-form-panel">
          <div>
            <p className="eyebrow">Message</p>
            <h2>Send a project note</h2>
          </div>
          <form>
            <label>
              Name
              <input type="text" placeholder="Your name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="you@example.com" />
            </label>
            <label>
              Message
              <textarea rows={5} placeholder="What would you like to discuss?" />
            </label>
            <button type="button" className="primary-button">
              Send Message
              <ArrowRight size={18} />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();

  if (route === '#/dashboard') return <Dashboard />;
  if (route === '#/map') return <NetworkMapPage />;
  if (route === '#/contact') return <ContactPage />;
  return <HomePage />;
}
