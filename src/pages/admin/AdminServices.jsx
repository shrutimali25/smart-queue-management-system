import { useCallback, useState } from 'react'
import { api, ApiError } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { useToast } from '../../components/Toast'
import { TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import Modal, { ConfirmDialog } from '../../components/Modal'
import { IconService, IconPlus, IconEdit, IconTrash, IconRefresh } from '../../components/Icons'

const blank = { name: '', token_prefix: '', avg_service_time: 5, status: 'active' }

export default function AdminServices() {
  const toast = useToast()
  const [tick, setTick] = useState(0)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => api.listServices(), [])
  const { data, loading, error, refresh } = usePoll(load, { interval: 20000, deps: [tick] })
  const services = data?.services || []

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: editing.name.trim(),
        token_prefix: editing.token_prefix.trim().toUpperCase(),
        avg_service_time: Number(editing.avg_service_time) || 1,
        status: editing.status,
      }
      if (editing.id) {
        await api.updateService(editing.id, payload)
        toast.success('Service updated.')
      } else {
        await api.createService(payload)
        toast.success('Service created.')
      }
      setEditing(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save service.')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteService(deleteTarget.id)
      toast.success('Service deleted.')
      setDeleteTarget(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete service.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Service Management</h2>
        <p className="page-subtitle">Configure the services users can queue for.</p>
      </div>

      <div className="ud-top-actions" style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-primary" onClick={() => setEditing({ ...blank })}><IconPlus size={16} /> Add Service</button>
        <button className="btn btn-secondary" onClick={refresh}><IconRefresh size={16} /> Refresh</button>
      </div>

      <div className="section-card">
        <div className="table-wrap">
          {loading && !data ? (
            <TableSkeleton rows={5} cols={5} />
          ) : error ? (
            <div className="table-empty">Could not load services. <button className="btn btn-ghost btn-sm" onClick={refresh}>Retry</button></div>
          ) : services.length === 0 ? (
            <EmptyState icon={<IconService size={40} />} title="No services" message="Add a service so users can start generating tokens." action={<button className="btn btn-primary" onClick={() => setEditing({ ...blank })}><IconPlus size={16} /> Add Service</button>} />
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Prefix</th><th>Avg Service Time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="cell-strong">{s.name}</td>
                    <td className="cell-token">{s.token_prefix}</td>
                    <td>{s.avg_service_time} min</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ id: s.id, name: s.name, token_prefix: s.token_prefix, avg_service_time: s.avg_service_time, status: s.status })}><IconEdit size={14} /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)}><IconTrash size={14} /></button>
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
        title={editing?.id ? 'Edit Service' : 'Add Service'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
        </>}
      >
        {editing && (
          <form onSubmit={save}>
            <div className="field">
              <label className="field-label">Service Name</label>
              <input className="field-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Admissions" required />
            </div>
            <div className="field">
              <label className="field-label">Token Prefix</label>
              <input className="field-input" value={editing.token_prefix} onChange={(e) => setEditing({ ...editing, token_prefix: e.target.value })} placeholder="e.g. ADM" maxLength={4} required />
            </div>
            <div className="field">
              <label className="field-label">Average Service Time (minutes)</label>
              <input type="number" min="1" className="field-input" value={editing.avg_service_time} onChange={(e) => setEditing({ ...editing, avg_service_time: e.target.value })} required />
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
        title="Delete service?"
        message={`Delete ${deleteTarget?.name}? Existing tokens will remain but no new tokens can be generated.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}
