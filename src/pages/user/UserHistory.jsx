import { useCallback, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { Loading, TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { IconToken } from '../../components/Icons'

const STATUS_FILTERS = ['', 'waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled']

export default function UserHistory() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(() => api.myTokens({ status }), [status])
  const { data, loading, error, refresh } = usePoll(load, { interval: 15000, deps: [status] })

  const tokens = useMemo(() => {
    const list = data?.tokens || []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((t) =>
      t.token_number?.toLowerCase().includes(q) ||
      t.service_name?.toLowerCase().includes(q)
    )
  }, [data, search])

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Token History</h2>
        <p className="page-subtitle">All the tokens you've generated, past and present.</p>
      </div>

      <div className="section-card">
        <div className="toolbar">
          <div className="toolbar-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by token or service..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All statuses'}</option>)}
          </select>
        </div>

        <div className="table-wrap">
          {loading && !data ? (
            <TableSkeleton rows={6} cols={5} />
          ) : error ? (
            <div className="table-empty">Could not load tokens. <button className="btn btn-ghost btn-sm" onClick={refresh}>Retry</button></div>
          ) : tokens.length === 0 ? (
            <EmptyState icon={<IconToken size={40} />} title="No tokens found" message="You haven't generated any tokens matching the filters." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th><th>Service</th><th>Status</th><th>People Ahead</th><th>Est. Wait</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-token">{t.token_number}</td>
                    <td className="cell-strong">{t.service_name}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.people_ahead ?? '—'}</td>
                    <td>{t.estimated_wait != null ? `${t.estimated_wait} min` : '—'}</td>
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
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
