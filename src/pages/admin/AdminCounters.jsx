import { useCallback, useState } from 'react'
import { api, ApiError } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { useToast } from '../../components/Toast'
import { TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import Modal, { ConfirmDialog } from '../../components/Modal'
import { IconCounter, IconPlus, IconEdit, IconTrash, IconRefresh } from '../../components/Icons'

const blank = { name: '', service_id: '', staff_id: '', status: 'active' }

export default function AdminCounters() {
  const toast = useToast()
  const [tick, setTick] = useState(0)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => api.listCounters(), [])
  const { data, loading, error, refresh } = usePoll(load, { interval: 20000, deps: [tick] })
  const counters = data?.counters || []

  const loadServices = useCallback(() => api.listServices(), [])
  const { data: svcData } = usePoll(loadServices, { interval: 60000, deps: [tick] })
  const services = (svcData?.services || []).filter((s) => s.status === 'active')

  const loadStaff = useCallback(() => api.listUsers({ role: 'staff' }), [])
  const { data: staffData } = usePoll(loadStaff, { interval: 60000, deps: [tick] })
  const staff = (staffData?.users || []).filter((u) => u.status === 'active')

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: editing.name.trim(),
        service_id: editing.service_id ? Number(editing.service_id) : null,
        staff_id: editing.staff_id ? Number(editing.staff_id) : null,
        status: editing.status,
      }
      if (editing.id) {
        await api.updateCounter(editing.id, payload)
        toast.success('Counter updated.')
      } else {
        await api.createCounter(payload)
        toast.success('Counter created.')
      }
      setEditing(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save counter.')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteCounter(deleteTarget.id)
      toast.success('Counter deleted.')
      setDeleteTarget(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete counter.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Counter Management</h2>
        <p className="page-subtitle">Create counters, assign services, and assign staff.</p>
      </div>

      <div className="ud-top-actions" style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-primary" onClick={() => setEditing({ ...blank })}><IconPlus size={16} /> Add Counter</button>
        <button className="btn btn-secondary" onClick={refresh}><IconRefresh size={16} /> Refresh</button>
      </div>

      <div className="section-card">
        <div className="table-wrap">
          {loading && !data ? (
            <TableSkeleton rows={5} cols={5} />
          ) : error ? (
            <div className="table-empty">Could not load counters. <button className="btn btn-ghost btn-sm" onClick={refresh}>Retry</button></div>
          ) : counters.length === 0 ? (
            <EmptyState icon={<IconCounter size={40} />} title="No counters" message="Add a counter to start managing the physical service points." action={<button className="btn btn-primary" onClick={() => setEditing({ ...blank })}><IconPlus size={16} /> Add Counter</button>} />
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Service</th><th>Staff</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {counters.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-strong">{c.name}</td>
                    <td>{c.service_name || '—'}</td>
                    <td>{c.staff_name || '—'}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ id: c.id, name: c.name, service_id: c.service_id || '', staff_id: c.staff_id || '', status: c.status })}><IconEdit size={14} /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}><IconTrash size={14} /></button>
                      </div>
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
        title={editing?.id ? 'Edit Counter' : 'Add Counter'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
        </>}
      >
        {editing && (
          <form onSubmit={save}>
            <div className="field">
              <label className="field-label">Counter Name</label>
              <input className="field-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Counter 1" required />
            </div>
            <div className="field">
              <label className="field-label">Service</label>
              <select className="field-select" value={editing.service_id} onChange={(e) => setEditing({ ...editing, service_id: e.target.value })}>
                <option value="">None</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Assigned Staff</label>
              <select className="field-select" value={editing.staff_id} onChange={(e) => setEditing({ ...editing, staff_id: e.target.value })}>
                <option value="">None</option>
                {staff.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        title="Delete counter?"
        message={`Delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}
