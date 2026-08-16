import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { ApiError } from '../services/api'
import { IconArrowRight, IconShield, IconZap, IconClock } from '../components/Icons'

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      toast.success('Account created. Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-wrap">
      <aside className="auth-aside">
        <div className="auth-aside-content">
          <h2>Join Smart Queue today</h2>
          <p>Create an account to generate digital tokens and skip the physical wait.</p>
          <div className="auth-aside-badges">
            <span className="auth-aside-badge"><IconZap size={14} /> Instant tokens</span>
            <span className="auth-aside-badge"><IconClock size={14} /> Live tracking</span>
            <span className="auth-aside-badge"><IconShield size={14} /> Role-based access</span>
          </div>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-mark">SQ</div>
            <span className="auth-logo-text">Smart Queue</span>
          </Link>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">It only takes a minute to get started.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="name">Full name</label>
              <input id="name" className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                disabled={submitting}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="field-input"
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
              <input id="password" type="password" className="field-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                disabled={submitting}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" className="field-input"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Re-enter password"
                autoComplete="new-password"
                disabled={submitting}
              />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <span className="spinner" /> : <>Create account <IconArrowRight size={18} /></>}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
