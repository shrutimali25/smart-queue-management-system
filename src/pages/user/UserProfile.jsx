import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/Toast'
import { api, ApiError } from '../../services/api'
import { IconUser, IconCheck } from '../../components/Icons'

export default function UserProfile() {
  const { user, refreshProfile } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateProfile({ name: form.name.trim() })
      await refreshProfile()
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) { toast.error('New passwords do not match.'); return }
    if (passwords.new && passwords.new.length < 6) { toast.error('New password must be at least 6 characters.'); return }
    setSavingPw(true)
    try {
      await api.updateProfile({
        current_password: passwords.current,
        new_password: passwords.new,
      })
      toast.success('Password changed.')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not change password.')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">My Profile</h2>
        <p className="page-subtitle">Manage your account details and password.</p>
      </div>

      <div className="grid-2">
        <div className="section-card">
          <div className="section-card-header"><h3 className="section-card-title">Account information</h3></div>
          <form onSubmit={saveProfile} className="section-card-body">
            <div className="field">
              <label className="field-label">Full name</label>
              <input className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={saving} />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" value={form.email} disabled />
            </div>
            <div className="field">
              <label className="field-label">Role</label>
              <input className="field-input" value={user?.role || ''} disabled style={{ textTransform: 'capitalize' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <><IconCheck size={16} /> Save changes</>}
            </button>
          </form>
        </div>

        <div className="section-card">
          <div className="section-card-header"><h3 className="section-card-title">Change password</h3></div>
          <form onSubmit={changePassword} className="section-card-body">
            <div className="field">
              <label className="field-label">Current password</label>
              <input type="password" className="field-input" value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                disabled={savingPw} required />
            </div>
            <div className="field">
              <label className="field-label">New password</label>
              <input type="password" className="field-input" value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="At least 6 characters" disabled={savingPw} />
            </div>
            <div className="field">
              <label className="field-label">Confirm new password</label>
              <input type="password" className="field-input" value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                disabled={savingPw} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? <span className="spinner" /> : <>Change password</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
