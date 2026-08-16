import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/Toast'
import { api, ApiError } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { Loading } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import Modal, { ConfirmDialog } from '../../components/Modal'
import {
  IconTicket, IconClock, IconUser, IconCheck, IconX, IconPlus, IconRefresh, IconLayers,
} from '../../components/Icons'
import './UserDashboard.css'

export default function UserDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [genOpen, setGenOpen] = useState(false)
  const [selectedService, setSelectedService] = useState('')
  const [generating, setGenerating] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    api.listServices()
      .then((data) => setServices((data.services || []).filter((s) => s.status === 'active'))
      )
      .catch(() => toast.error('Could not load services.'))
      .finally(() => setServicesLoading(false))
  }, [toast])

  const loadMyTokens = useCallback(() => api.myTokens(), [])
  const { data, loading, error, refresh } = usePoll(loadMyTokens, { interval: 8000, deps: [tick] })

  const activeTokens = useMemo(() => {
    const list = data?.tokens || []
    return list.filter((t) => ['waiting', 'called', 'serving'].includes(t.status))
  }, [data])

  const current = activeTokens[0] || null

  const handleGenerate = async () => {
    if (!selectedService) { toast.warning('Please select a service.'); return }
    setGenerating(true)
    try {
      const res = await api.createToken({ service_id: Number(selectedService) })
      toast.success(`Token ${res.token.token_number} generated!`)
      setGenOpen(false)
      setSelectedService('')
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not generate token.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await api.cancelToken(cancelTarget.id)
      toast.success('Token cancelled.')
      setCancelTarget(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not cancel token.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="page user-dash">
      <div className="page-header">
        <h2 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="page-subtitle">Generate a token and track your queue in real time.</p>
      </div>

      <div className="ud-top-actions">
        <button className="btn btn-primary" onClick={() => setGenOpen(true)}>
          <IconPlus size={18} /> Generate New Token
        </button>
        <button className="btn btn-secondary" onClick={refresh}>
          <IconRefresh size={16} /> Refresh
        </button>
      </div>

      {loading && !data ? (
        <Loading full message="Loading your tokens..." />
      ) : error ? (
        <EmptyState title="Something went wrong" message="We couldn't load your tokens. Please try again." action={<button className="btn btn-primary" onClick={refresh}>Retry</button>} />
      ) : current ? (
        <CurrentTokenCard token={current} onCancel={() => setCancelTarget(current)} />
      ) : (
        <EmptyState
          icon={<IconTicket size={40} />}
          title="No active token"
          message="You don't have an active queue token right now. Generate one to join a queue."
          action={<button className="btn btn-primary" onClick={() => setGenOpen(true)}><IconPlus size={18} /> Generate New Token</button>}
        />
      )}

      {current && (
        <div className="section-card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="section-card-header"><h3 className="section-card-title">Queue Details</h3></div>
          <div className="section-card-body">
            <div className="ud-detail-grid">
              <DetailItem icon={<IconLayers size={18} />} label="Service" value={current.service_name} />
              <DetailItem icon={<IconUser size={18} />} label="Status" value={<StatusBadge status={current.status} />} />
              <DetailItem icon={<IconClock size={18} />} label="Created" value={formatTime(current.created_at)} />
              <DetailItem icon={<IconTicket size={18} />} label="Token ID" value={`#${current.id}`} />
            </div>
          </div>
        </div>
      )}

      {/* Generate token modal */}
      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Generate New Token"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setGenOpen(false)} disabled={generating}>Cancel</button>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating || servicesLoading}>
              {generating ? <span className="spinner" /> : <><IconTicket size={18} /> Generate Token</>}
            </button>
          </>
        }
      >
        {servicesLoading ? <Loading message="Loading services..." /> : services.length === 0 ? (
          <p style={{ color: 'var(--neutral-500)' }}>No services are available right now. Please check back later.</p>
        ) : (
          <div className="ud-service-list">
            {services.map((s) => (
              <label key={s.id} className={`ud-service-opt ${selectedService === String(s.id) ? 'selected' : ''}`}>
                <input type="radio" name="service" value={s.id}
                  checked={selectedService === String(s.id)}
                  onChange={(e) => setSelectedService(e.target.value)}
                />
                <div className="ud-service-info">
                  <span className="ud-service-name">{s.name}</span>
                  <span className="ud-service-meta">Prefix {s.token_prefix} · ~{s.avg_service_time} min service</span>
                </div>
                <span className="ud-service-radio" />
              </label>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel token?"
        message={`Cancel token ${cancelTarget?.token_number}? You'll lose your place in the queue.`}
        confirmLabel="Yes, cancel"
        cancelLabel="Keep it"
        danger
        loading={cancelling}
      />
    </div>
  )
}

function CurrentTokenCard({ token, onCancel }) {
  return (
    <div className="ud-token-card animate-scale-in">
      <div className="ud-token-left">
        <span className="ud-token-label">YOUR TOKEN</span>
        <span className="ud-token-number">{token.token_number}</span>
        <StatusBadge status={token.status} />
      </div>
      <div className="ud-token-right">
        <div className="ud-token-stat">
          <span className="ud-token-stat-label">NOW SERVING</span>
          <span className="ud-token-stat-value">{token.now_serving || '—'}</span>
        </div>
        <div className="ud-token-stat">
          <span className="ud-token-stat-label">PEOPLE AHEAD</span>
          <span className="ud-token-stat-value">{token.people_ahead ?? 0}</span>
        </div>
        <div className="ud-token-stat">
          <span className="ud-token-stat-label">ESTIMATED WAIT</span>
          <span className="ud-token-stat-value">{token.estimated_wait ?? 0} min</span>
        </div>
        <div className="ud-token-stat">
          <span className="ud-token-stat-label">QUEUE POSITION</span>
          <span className="ud-token-stat-value">{token.queue_position ?? '—'}</span>
        </div>
      </div>
      <div className="ud-token-actions">
        {['waiting', 'called'].includes(token.status) && (
          <button className="btn btn-danger btn-sm" onClick={onCancel}><IconX size={14} /> Cancel Token</button>
        )}
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="ud-detail-item">
      <span className="ud-detail-icon">{icon}</span>
      <div>
        <span className="ud-detail-label">{label}</span>
        <div className="ud-detail-value">{value}</div>
      </div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
