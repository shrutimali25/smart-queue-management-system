import { useCallback, useMemo, useState } from 'react'
import { api, ApiError } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { useToast } from '../../components/Toast'
import { TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { IconStaff, IconEdit, IconRefresh, IconSearch } from '../../components/Icons'

export default function AdminStaff() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [tick, setTick] = useState(0)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => api.listUsers({ role: 'staff' }), [])
  const { data, loading, error, refresh } = usePoll(load, { interval: 20000, deps: [tick] })

  const loadCounters = useCallback(() => api.listCounters(), [])
  const { data: countersData } = usePoll(loadCounters, { interval: 30000, deps: [tick] })
  const counters = countersData?.counters || []

  const staff = useMemo(() => {
    const list = data?.users || []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
  }, [data, search])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateUser(editing.id, { name: editing.name, counter_id: editing.counter_id || null, status: editing.status })
      toast.success('Staff updated.')
      setEditing(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update staff.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Staff Management</h2>
        <p className="page-subtitle">Assign staff to counters and manage their status.</p>
      </div>

      <div className="section-card">
        <div className="toolbar">
          <div className="toolbar-search">
            <IconSearch size={16} />
            <input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><IconRefresh size={14} /> Refresh</button>
        </div>

        <div className="table-wrap">
          {loading && !data ? (
            <TableSkeleton rows={6} cols={5} />
          ) : error ? (
            <div className="table-empty">Could not load staff. <button className="btn btn-ghost btn-sm" onClick={refresh}>Retry</button></div>
          ) : staff.length === 0 ? (
            <EmptyState icon={<IconStaff size={40} />} title="No staff found" message="No staff accounts match the search." />
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Counter</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {staff.map((u) => (
                  <tr key={u.id}>
                    <td className="cell-strong">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.counter_name || '—'}</td>
                    <td><StatusBadge status={u.status || 'active'} /></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ id: u.id, name: u.name, email: u.email, counter_id: u.counter_id || '', status: u.status || 'active' })}>
                        <IconEdit size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Staff"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
        </>}
      >
        {editing && (
          <form onSubmit={save}>
            <div className="field">
              <label className="field-label">Name</label>
              <input className="field-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" value={editing.email} disabled />
            </div>
            <div className="field">
              <label className="field-label">Assigned Counter</label>
              <select className="field-select" value={editing.counter_id} onChange={(e) => setEditing({ ...editing, counter_id: e.target.value })}>
                <option value="">None</option>
                {counters.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.service_name || '—'})</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Status</label>
              <select className="field-select" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
