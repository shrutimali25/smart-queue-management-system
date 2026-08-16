import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { ApiError } from '../services/api'
import { IconLogin, IconShield, IconZap, IconClock } from '../components/Icons'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name || user.email}!`)
      const dest = user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/app'
      navigate(dest)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <div className="auth-aside-content">
          <h2>Welcome back to Smart Queue</h2>
          <p>Log in to generate tokens, track your queue, and manage service counters in real time.</p>
          <div className="auth-aside-badges">
            <span className="auth-aside-badge"><IconZap size={14} /> Real-time queue</span>
            <span className="auth-aside-badge"><IconClock size={14} /> Live wait estimates</span>
            <span className="auth-aside-badge"><IconShield size={14} /> Secure access</span>
          </div>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-mark">SQ</div>
            <span className="auth-logo-text">Smart Queue</span>
          </Link>
          <h1 className="auth-title">Log in to your account</h1>
          <p className="auth-subtitle">Enter your credentials to access your dashboard.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" className="field-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={submitting}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="field-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Your password"
                autoComplete="current-password"
                disabled={submitting}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <span className="spinner" /> : <><IconLogin size={18} /> Log in</>}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
          <p className="auth-footer" style={{ marginTop: 'var(--space-3)', fontSize: 'var(--fs-xs)', color: 'var(--neutral-400)' }}>
            Demo: admin@sqms.local / admin123
          </p>
        </div>
      </main>
    </div>
  )
}
