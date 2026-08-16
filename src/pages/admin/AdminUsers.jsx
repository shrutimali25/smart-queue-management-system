import { useCallback, useMemo, useState } from 'react'
import { api, ApiError } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { useToast } from '../../components/Toast'
import { TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import Modal, { ConfirmDialog } from '../../components/Modal'
import { IconUser, IconPlus, IconEdit, IconTrash, IconRefresh, IconSearch } from '../../components/Icons'

const ROLE_FILTERS = ['', 'user', 'staff', 'admin']

export default function AdminUsers() {
  const toast = useToast()
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [tick, setTick] = useState(0)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => api.listUsers({ role }), [role])
  const { data, loading, error, refresh } = usePoll(load, { interval: 20000, deps: [role, tick] })

  const users = useMemo(() => {
    const list = data?.users || []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
  }, [data, search])

  const saveUser = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing.id) {
        await api.updateUser(editing.id, { name: editing.name, role: editing.role, status: editing.status })
        toast.success('User updated.')
      }
      setEditing(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save user.')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.deleteUser(deleteTarget.id)
      toast.success('User deleted.')
      setDeleteTarget(null)
      refresh()
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete user.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">User Management</h2>
        <p className="page-subtitle">Manage all user, staff, and admin accounts.</p>
      </div>

      <div className="section-card">
        <div className="toolbar">
          <div className="toolbar-search">
            <IconSearch size={16} />
            <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_FILTERS.map((r) => <option key={r} value={r}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All roles'}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><IconRefresh size={14} /> Refresh</button>
        </div>

        <div className="table-wrap">
          {loading && !data ? (
            <TableSkeleton rows={8} cols={5} />
          ) : error ? (
            <div className="table-empty">Could not load users. <button className="btn btn-ghost btn-sm" onClick={refresh}>Retry</button></div>
          ) : users.length === 0 ? (
            <EmptyState icon={<IconUser size={40} />} title="No users found" message="No accounts match the current filters." />
          ) : (
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="cell-strong">{u.name}</td>
                    <td>{u.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                    <td><StatusBadge status={u.status || 'active'} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditing({ id: u.id, name: u.name, role: u.role, status: u.status || 'active', email: u.email })}><IconEdit size={14} /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}><IconTrash size={14} /></button>
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
        title="Edit User"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveUser} disabled={saving}>{saving ? <span className="spinner" /> : 'Save'}</button>
        </>}
      >
        {editing && (
          <form onSubmit={saveUser}>
            <div className="field">
              <label className="field-label">Name</label>
              <input className="field-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" value={editing.email} disabled />
            </div>
            <div className="field">
              <label className="field-label">Role</label>
              <select className="field-select" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
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
        title="Delete user?"
        message={`Permanently delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  )
}
