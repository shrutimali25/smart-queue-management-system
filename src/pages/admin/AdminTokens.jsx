import { useCallback, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { IconToken, IconRefresh, IconSearch } from '../../components/Icons'

const STATUS_FILTERS = ['', 'waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled']

export default function AdminTokens() {
  const [status, setStatus] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [search, setSearch] = useState('')

  const loadServices = useCallback(() => api.listServices(), [])
  const { data: svcData } = usePoll(loadServices, { interval: 60000, deps: [] })
  const services = svcData?.services || []

  const load = useCallback(() => api.getQueue({ status, service_id: serviceId }), [status, serviceId])
  const { data, loading, error, refresh } = usePoll(load, { interval: 15000, deps: [status, serviceId] })

  const tokens = useMemo(() => {
    const list = data?.tokens || []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((t) =>
      t.token_number?.toLowerCase().includes(q) ||
      t.user_name?.toLowerCase().includes(q) ||
      t.service_name?.toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">All Tokens</h2>
        <p className="page-subtitle">Search, filter, and monitor every token across all services.</p>
      </div>

      <div className="section-card">
        <div className="toolbar">
          <div className="toolbar-search">
            <IconSearch size={16} />
            <input placeholder="Search tokens, users, services..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}</option>)}
          </select>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">All services</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><IconRefresh size={14} /> Refresh</button>
        </div>

        <div className="table-wrap">
          {loading && !data ? (
            <TableSkeleton rows={10} cols={7} />
          ) : error ? (
            <div className="table-empty">Could not load tokens. <button className="btn btn-ghost btn-sm" onClick={refresh}>Retry</button></div>
          ) : tokens.length === 0 ? (
            <EmptyState icon={<IconToken size={40} />} title="No tokens found" message="No tokens match the current filters." />
          ) : (
            <table className="data-table">
              <thead><tr><th>Token</th><th>User</th><th>Service</th><th>Counter</th><th>Status</th><th>Wait</th><th>Created</th></tr></thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-token">{t.token_number}</td>
                    <td className="cell-strong">{t.user_name || 'Walk-in'}</td>
                    <td>{t.service_name}</td>
                    <td>{t.counter_name || '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.waiting_time != null ? `${t.waiting_time} min` : '—'}</td>
                    <td>{formatTime(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}
