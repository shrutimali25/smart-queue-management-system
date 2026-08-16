import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/Modal'
import {
  IconDashboard, IconUsers, IconStaff, IconService, IconCounter, IconToken,
  IconChart, IconLogout, IconMenu, IconX, IconUser,
} from '../components/Icons'
import './DashboardLayout.css'

const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: IconDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: IconUsers },
    { to: '/admin/staff', label: 'Staff', icon: IconStaff },
    { to: '/admin/services', label: 'Services', icon: IconService },
    { to: '/admin/counters', label: 'Counters', icon: IconCounter },
    { to: '/admin/tokens', label: 'Tokens', icon: IconToken },
    { to: '/admin/analytics', label: 'Analytics', icon: IconChart },
  ],
  staff: [
    { to: '/staff', label: 'Dashboard', icon: IconDashboard, end: true },
    { to: '/staff/tokens', label: 'Tokens', icon: IconToken },
  ],
  user: [
    { to: '/app', label: 'Dashboard', icon: IconDashboard, end: true },
    { to: '/app/history', label: 'Token History', icon: IconToken },
    { to: '/app/profile', label: 'Profile', icon: IconUser },
  ],
}

const TITLES = {
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/staff': 'Staff Management',
  '/admin/services': 'Service Management',
  '/admin/counters': 'Counter Management',
  '/admin/tokens': 'All Tokens',
  '/admin/analytics': 'Analytics',
  '/staff': 'Staff Dashboard',
  '/staff/tokens': 'Queue Tokens',
  '/app': 'My Dashboard',
  '/app/history': 'Token History',
  '/app/profile': 'My Profile',
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const nav = NAV[user?.role] || NAV.user
  const title = TITLES[location.pathname] || 'Dashboard'

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('You have been logged out.')
      navigate('/login')
    } catch {
      toast.error('Could not log out. Please try again.')
    }
    setConfirmLogout(false)
  }

  const initials = (user?.name || user?.email || '?')
    .split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="dash-layout">
      <aside className={`dash-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="dash-brand">
          <div className="dash-brand-mark">SQ</div>
          <div className="dash-brand-text">
            <span className="dash-brand-title">Smart Queue</span>
            <span className="dash-brand-sub">{user?.role?.toUpperCase()}</span>
          </div>
        </div>

        <nav className="dash-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `dash-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dash-sidebar-footer">
          <Link to="/" className="dash-nav-item">
            <IconDashboard size={20} />
            <span>Home</span>
          </Link>
          <button className="dash-nav-item" onClick={() => setConfirmLogout(true)}>
            <IconLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="dash-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className="dash-main">
        <header className="dash-topbar">
          <button className="dash-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <IconMenu size={22} />
          </button>
          <h1 className="dash-page-title">{title}</h1>
          <div className="dash-topbar-right">
            <div className="dash-user">
              <div className="dash-avatar">{initials}</div>
              <div className="dash-user-info">
                <span className="dash-user-name">{user?.name}</span>
                <span className="dash-user-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dash-content">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Log out"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
        danger
      />
    </div>
  )
}
