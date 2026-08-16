import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/Toast'
import { api, ApiError } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { Loading, CardSkeleton, TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { ConfirmDialog } from '../../components/Modal'
import {
  IconClock, IconUser, IconCheck, IconPlay, IconSkip, IconRefresh, IconTicket, IconLayers,
} from '../../components/Icons'

export default function StaffDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(() => api.getQueue(), [])
  const { data, loading, error, refresh } = usePoll(load, { interval: 8000, deps: [tick] })

  const summary = data?.summary || {}
  const current = data?.current || null
  const waiting = data?.waiting || []
  const completed = data?.completed || []

  const run = async (key, fn, successMsg) => {
    setBusy(key)
    try {
      await fn()
      toast.success(successMsg)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Staff Dashboard</h2>
        <p className="page-subtitle">
          {user?.counter_name ? `Counter: ${user.counter_name}` : 'Manage your assigned queue counter.'}
        </p>
      </div>

      <div className="ud-top-actions" style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-primary" onClick={() => run('next', () => api.callNext({}), 'Next token called.')} disabled={busy === 'next'}>
          {busy === 'next' ? <span className="spinner" /> : <IconPlay size={16} />} Call Next
        </button>
        <button className="btn btn-secondary" onClick={refresh}>
          <IconRefresh size={16} /> Refresh
        </button>
      </div>

      {loading && !data ? (
        <><CardSkeleton count={4} /><div className="section-card"><TableSkeleton rows={5} cols={5} /></div></>
      ) : error ? (
        <EmptyState title="Something went wrong" message="We couldn't load your queue. Please try again." action={<button className="btn btn-primary" onClick={refresh}>Retry</button>} />
      ) : (
        <>
          <div className="kpi-grid">
            <KPI icon={<IconLayers size={20} />} label="Assigned Service" value={summary.service_name || '—'} />
            <KPI icon={<IconTicket size={20} />} label="Waiting Tokens" value={summary.waiting_count ?? waiting.length} variant="info" />
            <KPI icon={<IconCheck size={20} />} label="Completed Today" value={summary.completed_count ?? completed.length} variant="success" />
            <KPI icon={<IconClock size={20} />} label="Avg Wait Time" value={`${summary.avg_wait ?? 0} min`} variant="warning" />
          </div>

          {current ? (
            <div className="section-card">
              <div className="section-card-header">
                <h3 className="section-card-title">Current Token</h3>
                <StatusBadge status={current.status} />
              </div>
              <div className="section-card-body">
                <div className="sd-current">
                  <div className="sd-current-token">{current.token_number}</div>
                  <div className="sd-current-info">
                    <span><IconUser size={14} /> {current.user_name || 'Walk-in'}</span>
                    <span><IconLayers size={14} /> {current.service_name}</span>
                    <span><IconClock size={14} /> Waiting {current.waiting_time ?? 0} min</span>
                  </div>
                  <div className="sd-current-actions">
                    {current.status === 'called' && (
                      <button className="btn btn-primary btn-sm" onClick={() => run('start', () => api.startToken(current.id), 'Service started.')} disabled={busy === 'start'}>
                        {busy === 'start' ? <span className="spinner" /> : <IconPlay size={14} />} Start Service
                      </button>
                    )}
                    {current.status === 'serving' && (
                      <button className="btn btn-success btn-sm" onClick={() => run('complete', () => api.completeToken(current.id), 'Token completed.')} disabled={busy === 'complete'}>
                        {busy === 'complete' ? <span className="spinner" /> : <IconCheck size={14} />} Complete
                      </button>
                    )}
                    <button className="btn btn-secondary btn-sm" onClick={() => run('recall', () => api.recallToken(current.id), 'Token recalled.')} disabled={busy === 'recall'}>
                      {busy === 'recall' ? <span className="spinner" /> : <IconRefresh size={14} />} Recall
                    </button>
                    {['called', 'serving'].includes(current.status) && (
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm({ id: current.id, label: 'skip' })}>
                        <IconSkip size={14} /> Skip
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="section-card">
              <div className="section-card-body">
                <EmptyState icon={<IconTicket size={40} />} title="No active token" message="Click 'Call Next' to pull the next waiting token from the queue." />
              </div>
            </div>
          )}

          <div className="section-card">
            <div className="section-card-header"><h3 className="section-card-title">Waiting Queue</h3></div>
            <div className="table-wrap">
              {waiting.length === 0 ? (
                <div className="table-empty">No tokens waiting.</div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Token</th><th>User</th><th>Service</th><th>Status</th><th>Created</th></tr></thead>
                  <tbody>
                    {waiting.map((t) => (
                      <tr key={t.id}>
                        <td className="cell-token">{t.token_number}</td>
                        <td>{t.user_name || 'Walk-in'}</td>
                        <td>{t.service_name}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>{formatTime(t.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm
          setConfirm(null)
          await run(c.label, () => api.skipToken(c.id), 'Token skipped.')
        }}
        title="Skip this token?"
        message="The user will be marked as skipped and removed from the active queue."
        confirmLabel="Skip token"
        danger
      />
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

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}
