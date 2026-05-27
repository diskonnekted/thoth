import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ─── Animated Counter ─────────────────────────────────────────────
function AnimatedCounter({ target, duration = 2000, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Track visibility
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, { threshold: 0.3 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Run animation whenever target changes (if visible)
  useEffect(() => {
    if (!isVisible) return;

    let start = Date.now();
    let initialCount = count;
    let animationFrame;

    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(initialCount + eased * (target - initialCount)));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    
    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, isVisible, duration]);

  return <span ref={ref} className="font-mono-num">{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Floating Particle Background ─────────────────────────────────
function ParticleField() {
  const particles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.05,
    })), []);

  return (
    <div className="landing-particles">
      {particles.map(p => (
        <div key={p.id} className="landing-particle"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
      ))}
    </div>
  );
}

// ─── Scan Line Effect ──────────────────────────────────────────────
function ScanLine() {
  return <div className="landing-scanline" />;
}

// ─── Grid Overlay ──────────────────────────────────────────────────
function GridOverlay() {
  return <div className="landing-grid-overlay" />;
}

// ─── Feature Card ──────────────────────────────────────────────────
function FeatureCard({ icon, title, description, color, delay }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      className="landing-feature-card group" 
      style={{ animationDelay: `${delay}s`, '--feature-color': color }}
      onMouseMove={handleMouseMove}
    >
      <div className="landing-feature-icon transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_var(--feature-color)]" style={{ background: `${color}12`, borderColor: `${color}30` }}>
        <i className={`fa-solid ${icon}`} style={{ color, fontSize: 22 }} />
      </div>
      <h3 className="landing-feature-title transition-colors duration-300">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
      <div className="landing-feature-glow" style={{ background: color }} />
    </div>
  );
}

// ─── Competitor Row ────────────────────────────────────────────────
function CompetitorTable() {
  const features = [
    { name: 'AI Trading Signals', veridian: true, bloomberg: false, conflictly: false, liveuamap: false },
    { name: '3D Intelligence Globe', veridian: true, bloomberg: false, conflictly: true, liveuamap: true },
    { name: 'Military Flight Tracking', veridian: true, bloomberg: false, conflictly: false, liveuamap: true },
    { name: 'Wargame Simulation', veridian: true, bloomberg: false, conflictly: false, liveuamap: false },
    { name: 'Cyber Threat Overlay', veridian: true, bloomberg: false, conflictly: false, liveuamap: false },
    { name: 'Annual Cost', veridian: '$0', bloomberg: '$24,000+', conflictly: 'Paid', liveuamap: 'Paid' },
  ];

  const Check = () => <i className="fa-solid fa-check text-[var(--color-green)]" style={{ fontSize: 14 }} />;
  const Cross = () => <i className="fa-solid fa-xmark text-white/15" style={{ fontSize: 14 }} />;

  return (
    <div className="landing-table-wrap">
      <table className="landing-table">
        <thead>
          <tr>
            <th>Capability</th>
            <th className="landing-table-highlight">VERIDIAN</th>
            <th>Bloomberg</th>
            <th>Conflictly</th>
            <th>LiveUAMap</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f, i) => (
            <tr key={i}>
              <td className="landing-table-feature">{f.name}</td>
              <td className="landing-table-highlight">
                {typeof f.veridian === 'boolean' ? (f.veridian ? <Check /> : <Cross />) :
                  <span className="text-[var(--color-green)] font-bold font-mono-num">{f.veridian}</span>}
              </td>
              <td>
                {typeof f.bloomberg === 'boolean' ? (f.bloomberg ? <Check /> : <Cross />) :
                  <span className="text-[var(--color-red)] font-bold font-mono-num text-xs">{f.bloomberg}</span>}
              </td>
              <td>
                {typeof f.conflictly === 'boolean' ? (f.conflictly ? <Check /> : <Cross />) :
                  <span className="text-white/40 font-mono-num text-xs">{f.conflictly}</span>}
              </td>
              <td>
                {typeof f.liveuamap === 'boolean' ? (f.liveuamap ? <Check /> : <Cross />) :
                  <span className="text-white/40 font-mono-num text-xs">{f.liveuamap}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Signal Demo ───────────────────────────────────────────────────
function SignalDemo() {
  const [activeIndex, setActiveIndex] = useState(0);
  const signals = [
    { event: 'Hormuz tensions escalating', analysis: 'Oil supply disruption likely', action: 'BUY', ticker: '$XOM', confidence: 81, color: 'var(--color-green)' },
    { event: 'China suspends rare earths', analysis: 'EV supply chain at risk', action: 'SELL', ticker: '$TSLA', confidence: 74, color: 'var(--color-red)' },
    { event: 'Middle East escalation', analysis: 'Safe haven demand rising', action: 'BUY', ticker: '$GLD', confidence: 78, color: 'var(--color-green)' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveIndex(i => (i + 1) % signals.length), 3000);
    return () => clearInterval(timer);
  }, []);

  const s = signals[activeIndex];

  return (
    <div className="landing-signal-demo">
      <div className="landing-signal-header">
        <i className="fa-solid fa-bolt" style={{ color: 'var(--color-cyan)' }} />
        <span>LIVE SIGNAL PIPELINE</span>
      </div>
      <div className="landing-signal-flow" key={activeIndex}>
        <div className="landing-signal-step landing-signal-event">
          <i className="fa-solid fa-circle-exclamation" />
          <span>{s.event}</span>
        </div>
        <div className="landing-signal-arrow">
          <i className="fa-solid fa-arrow-right" />
        </div>
        <div className="landing-signal-step landing-signal-analysis">
          <i className="fa-solid fa-microchip" />
          <span>{s.analysis}</span>
        </div>
        <div className="landing-signal-arrow">
          <i className="fa-solid fa-arrow-right" />
        </div>
        <div className="landing-signal-step landing-signal-action" style={{ borderColor: `${s.color}40`, background: `${s.color}08` }}>
          <span className="landing-signal-badge" style={{ color: s.color, background: `${s.color}18`, borderColor: `${s.color}40` }}>
            {s.action}
          </span>
          <span className="landing-signal-ticker">{s.ticker}</span>
          <span className="landing-signal-conf" style={{ color: s.color }}>{s.confidence}%</span>
        </div>
      </div>
      <div className="landing-signal-dots">
        {signals.map((_, i) => (
          <button key={i} onClick={() => setActiveIndex(i)}
            className={`landing-signal-dot ${i === activeIndex ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}

// ─── Tech Stack Badges ─────────────────────────────────────────────
function TechBadge({ icon, label, color }) {
  return (
    <div className="landing-tech-badge" style={{ borderColor: `${color}25` }}>
      <i className={icon} style={{ color, fontSize: 16 }} />
      <span>{label}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  LANDING PAGE — MAIN
// ═════════════════════════════════════════════════════════════════════

export default function LandingPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 847, signals: 156, countries: 195, flights: 42 });
  const [isVisible, setIsVisible] = useState(false);

  // Fetch live stats
  useEffect(() => {
    setIsVisible(true);
    axios.get('/api/stats').then(r => {
      if (r.data) setStats({
        events: r.data.events || 847,
        signals: r.data.signals || 156,
        countries: r.data.countries || 195,
        flights: r.data.flights || 42,
      });
    }).catch(() => {
      setStats({ events: 847, signals: 156, countries: 195, flights: 42 });
    });
  }, []);

  return (
    <div className="landing-root">
      <ParticleField />
      <ScanLine />
      <GridOverlay />

      {/* ─── NAVBAR ─── */}
      <nav className="landing-nav">
        <div className="landing-nav-brand flex items-center gap-2">
          <div className="w-8 h-8 rounded border border-[var(--color-cyan)]/25 p-[2px] overflow-hidden bg-black/40 flex items-center justify-center shadow-[0_0_8px_rgba(0,212,255,0.2)]">
            <img 
              src="/thoth.jpg" 
              alt="THOTH Logo" 
              className="w-full h-full object-cover rounded"
              style={{
                filter: 'grayscale(100%) sepia(100%) hue-rotate(150deg) saturate(2.5) brightness(1.1) contrast(1.2)'
              }}
            />
          </div>
          <span className="landing-nav-title">THOTH</span>
        </div>
        <div className="landing-nav-links">
          <button onClick={() => navigate('/command')} className="landing-nav-cta">
            <i className="fa-solid fa-terminal" />&nbsp; Enter Command Center
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className={`landing-hero ${isVisible ? 'visible' : ''}`}>
        <div className="landing-hero-badge">
          <span className="landing-hero-badge-dot" />
          <span>HAARP DIAGNOSTIC MONITOR ACTIVE</span>
        </div>

        <h1 className="landing-hero-title">
          <span className="landing-hero-line1">Ionospheric Mapping &</span>
          <span className="landing-hero-line2">HAARP</span>
          <span className="landing-hero-line1">Telemetry Station.</span>
          <span className="landing-hero-line3">
            Real-time diagnostics &nbsp;
            <span className="landing-hero-accent">Space Weather</span>
            &nbsp; Analysis.
          </span>
        </h1>

        <p className="landing-hero-sub">
          Cross-referencing magnetometer, riometer, VLF, and ionosonde sweeps.
          Interactive WebGL 3D Globe and 2D tactical maps tracking active auroral research facilities.
        </p>

        <div className="landing-hero-actions">
          <button onClick={() => navigate('/command')} className="landing-cta-primary">
            <i className="fa-solid fa-bolt" />
            <span>LAUNCH COMMAND CENTER</span>
            <div className="landing-cta-shine" />
          </button>
        </div>
      </section>

      {/* ─── TECH STACK ─── */}
      <section className="landing-section">
        <div className="landing-section-label">
          <i className="fa-solid fa-microchip" style={{ color: 'var(--color-cyan)' }} />
          <span>TECHNOLOGY</span>
        </div>
        <h2 className="landing-section-title">Built With</h2>
        <div className="landing-tech-grid">
          <TechBadge icon="fa-brands fa-react" label="React 18" color="#61DAFB" />
          <TechBadge icon="fa-brands fa-node-js" label="Node.js" color="#339933" />
          <TechBadge icon="fa-solid fa-globe" label="Globe.gl" color="#7C3AED" />
          <TechBadge icon="fa-solid fa-chart-line" label="Recharts" color="#22B5BF" />
          <TechBadge icon="fa-solid fa-plug" label="Socket.IO" color="#00D4FF" />
          <TechBadge icon="fa-solid fa-wind" label="Tailwind CSS" color="#38BDF8" />
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-footer-brand flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-[var(--color-cyan)]/25 p-[2px] overflow-hidden bg-black/45 flex items-center justify-center">
            <img 
              src="/thoth.jpg" 
              alt="THOTH Logo" 
              className="w-full h-full object-cover rounded-sm"
              style={{
                filter: 'grayscale(100%) sepia(100%) hue-rotate(150deg) saturate(2.5) brightness(1.0) contrast(1.1)'
              }}
            />
          </div>
          <span>THOTH</span>
        </div>
        <p className="landing-footer-copy">
          Ionospheric Research & Space Weather Diagnostics
        </p>
      </footer>
    </div>
  );
}
