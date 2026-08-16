import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  IconArrowRight, IconLogin, IconShield, IconZap, IconClock, IconLayers,
  IconTrending, IconPhone, IconBuilding, IconTicket, IconCheck, IconUser,
} from '../components/Icons'
import './Landing.css'

export default function Landing() {
  const { isAuthed, user } = useAuth()
  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/app'

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <div className="lp-brand-mark">SQ</div>
          <span className="lp-brand-text">Smart Queue</span>
        </div>
        <div className="lp-nav-links">
          <a href="#how">How it works</a>
          <a href="#features">Features</a>
          <a href="#benefits">Benefits</a>
          {isAuthed ? (
            <Link to={dashboardPath} className="btn btn-primary btn-sm">
              Go to Dashboard <IconArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-blob blob-1" />
          <div className="lp-hero-blob blob-2" />
        </div>
        <div className="lp-hero-content">
          <span className="lp-hero-pill">
            <IconZap size={14} /> Queue management for every organization
          </span>
          <h1 className="lp-hero-title">
            SMART QUEUE<br />MANAGEMENT SYSTEM
          </h1>
          <p className="lp-hero-sub">
            Manage queues smarter. Reduce waiting time. Improve service.
          </p>
          <div className="lp-hero-actions">
            {isAuthed ? (
              <Link to={dashboardPath} className="btn btn-primary btn-lg">
                Go to Dashboard <IconArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started <IconArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  <IconLogin size={18} /> Login
                </Link>
              </>
            )}
          </div>
          <div className="lp-hero-stats">
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">40%</span>
              <span className="lp-hero-stat-label">Less waiting time</span>
            </div>
            <div className="lp-hero-divider" />
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">5</span>
              <span className="lp-hero-stat-label">Service categories</span>
            </div>
            <div className="lp-hero-divider" />
            <div className="lp-hero-stat">
              <span className="lp-hero-stat-num">3</span>
              <span className="lp-hero-stat-label">Role-based dashboards</span>
            </div>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section id="how" className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">How it works</span>
          <h2 className="lp-section-title">A simple 3-step process</h2>
          <p className="lp-section-sub">From selecting a service to tracking your turn in real time.</p>
        </div>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-num">1</div>
            <div className="lp-step-icon"><IconLayers size={26} /></div>
            <h3>Select Service</h3>
            <p>Choose from admissions, accounts, library, examination, or student section.</p>
          </div>
          <div className="lp-step-arrow"><IconArrowRight size={24} /></div>
          <div className="lp-step">
            <div className="lp-step-num">2</div>
            <div className="lp-step-icon"><IconTicket size={26} /></div>
            <h3>Generate Token</h3>
            <p>Get a unique digital token instantly with your queue position and estimated wait.</p>
          </div>
          <div className="lp-step-arrow"><IconArrowRight size={24} /></div>
          <div className="lp-step">
            <div className="lp-step-num">3</div>
            <div className="lp-step-icon"><IconClock size={26} /></div>
            <h3>Track Your Queue</h3>
            <p>Watch your position update live and arrive at the counter only when called.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-section lp-section-alt">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Features</span>
          <h2 className="lp-section-title">Everything you need to manage queues</h2>
          <p className="lp-section-sub">A complete platform for admins, staff, and users.</p>
        </div>
        <div className="lp-features">
          <FeatureCard icon={<IconTicket size={22} />} title="Digital Token Generation" desc="Automatic, sequential token numbers with service-specific prefixes. No duplicates, no confusion." />
          <FeatureCard icon={<IconClock size={22} />} title="Live Queue Tracking" desc="Real-time position, people ahead, and dynamically calculated estimated waiting time." />
          <FeatureCard icon={<IconLayers size={22} />} title="Service Management" desc="Create and configure services with custom prefixes and average service times." />
          <FeatureCard icon={<IconBuilding size={22} />} title="Counter Assignment" desc="Assign staff to counters, map counters to services, and activate or deactivate instantly." />
          <FeatureCard icon={<IconShield size={22} />} title="Role-Based Access" desc="Secure, separate dashboards for admins, staff, and users with protected routes." />
          <FeatureCard icon={<IconTrending size={22} />} title="Real Analytics" desc="Token counts, completion rates, average wait and service times, and peak periods." />
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="lp-section">
        <div className="lp-section-head">
          <span className="lp-eyebrow">Benefits</span>
          <h2 className="lp-section-title">Why Smart Queue Management?</h2>
          <p className="lp-section-sub">Built for colleges, hospitals, banks, government offices, and service centers.</p>
        </div>
        <div className="lp-benefits">
          <div className="lp-benefit-list">
            <Benefit icon={<IconClock size={20} />} title="Reduce physical waiting" desc="Users arrive only when their token is near, cutting crowded waiting rooms." />
            <Benefit icon={<IconPhone size={20} />} title="Track from anywhere" desc="Check queue status from a phone — no need to stay in line physically." />
            <Benefit icon={<IconTrending size={20} />} title="Data-driven decisions" desc="Analytics reveal peak hours and service bottlenecks so you can staff better." />
            <Benefit icon={<IconUser size={20} />} title="Better staff workflow" desc="Staff call, start, complete, and skip tokens from one clean dashboard." />
          </div>
          <div className="lp-benefit-visual">
            <div className="lp-benefit-card">
              <div className="lp-benefit-card-head">
                <span className="lp-benefit-tag">Your Token</span>
                <span className="badge badge-waiting">Waiting</span>
              </div>
              <div className="lp-benefit-token">ADM-105</div>
              <div className="lp-benefit-rows">
                <div className="lp-benefit-row"><span>Now Serving</span><span className="cell-strong">ADM-101</span></div>
                <div className="lp-benefit-row"><span>People Ahead</span><span className="cell-strong">4</span></div>
                <div className="lp-benefit-row"><span>Estimated Wait</span><span className="cell-strong">16 min</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2>Ready to eliminate the wait?</h2>
          <p>Start managing your queues digitally today.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started Free <IconArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-nav-brand">
              <div className="lp-brand-mark">SQ</div>
              <span className="lp-brand-text">Smart Queue</span>
            </div>
            <p>Manage queues smarter. Reduce waiting time. Improve service.</p>
          </div>
          <div className="lp-footer-col">
            <h4>Product</h4>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#benefits">Benefits</a>
          </div>
          <div className="lp-footer-col">
            <h4>Get started</h4>
            <Link to="/register">Create account</Link>
            <Link to="/login">Login</Link>
          </div>
          <div className="lp-footer-col">
            <h4>Use cases</h4>
            <span>Colleges</span>
            <span>Hospitals</span>
            <span>Banks</span>
            <span>Government offices</span>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} Smart Queue Management System. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="lp-feature">
      <div className="lp-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

function Benefit({ icon, title, desc }) {
  return (
    <div className="lp-benefit">
      <div className="lp-benefit-icon">{icon}</div>
      <div>
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  )
}
