import { useCallback, useState } from 'react'
import { api } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { CardSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import { Link } from 'react-router-dom'
import {
  IconUsers, IconTicket, IconClock, IconCheck, IconX, IconChart, IconLayers, IconRefresh,
} from '../../components/Icons'

export default function AdminDashboard() {
  const [tick, setTick] = useState(0)
  const load = useCallback(() => api.analyticsSummary(), [])
  const { data, loading, error, refresh } = usePoll(load, { interval: 15000, deps: [tick] })

  const s = data?.summary || {}

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Admin Dashboard</h2>
        <p className="page-subtitle">Overview of queue activity across all services.</p>
      </div>

      <div className="ud-top-actions" style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-secondary" onClick={refresh}><IconRefresh size={16} /> Refresh</button>
      </div>

      {loading && !data ? (
        <CardSkeleton count={7} />
      ) : error ? (
        <EmptyState title="Something went wrong" message="We couldn't load dashboard data. Please try again." action={<button className="btn btn-primary" onClick={refresh}>Retry</button>} />
      ) : (
        <>
          <div className="kpi-grid">
            <KPI icon={<IconUsers size={20} />} label="Total Users" value={s.total_users ?? 0} />
            <KPI icon={<IconTicket size={20} />} label="Tokens Today" value={s.tokens_today ?? 0} variant="info" />
            <KPI icon={<IconClock size={20} />} label="Waiting Tokens" value={s.waiting ?? 0} variant="warning" />
            <KPI icon={<IconLayers size={20} />} label="Currently Serving" value={s.serving ?? 0} variant="info" />
            <KPI icon={<IconCheck size={20} />} label="Completed Tokens" value={s.completed ?? 0} variant="success" />
            <KPI icon={<IconX size={20} />} label="Cancelled Tokens" value={s.cancelled ?? 0} variant="error" />
            <KPI icon={<IconClock size={20} />} label="Avg Waiting Time" value={`${s.avg_wait ?? 0} min`} variant="neutral" />
          </div>

          <div className="grid-3">
            <QuickLink to="/admin/users" icon={<IconUsers size={20} />} title="Manage Users" desc="Add, edit, or deactivate user accounts." />
            <QuickLink to="/admin/services" icon={<IconLayers size={20} />} title="Manage Services" desc="Configure service types and prefixes." />
            <QuickLink to="/admin/analytics" icon={<IconChart size={20} />} title="View Analytics" desc="Daily trends and service-wise breakdowns." />
          </div>
        </>
      )}
    </div>
  )
}

function KPI({ icon, label, value, variant }) {
  return (
    <div className={`kpi-card ${variant ? `kpi-${variant}` : ''}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  )
}

function QuickLink({ to, icon, title, desc }) {
  return (
    <Link to={to} className="lp-feature" style={{ textDecoration: 'none' }}>
      <div className="lp-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </Link>
  )
}
