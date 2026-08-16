import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'
import './components/Toast.css'
import './components/Modal.css'
import './styles/page.css'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

import DashboardLayout from './layouts/DashboardLayout'

import UserDashboard from './pages/user/UserDashboard'
import UserHistory from './pages/user/UserHistory'
import UserProfile from './pages/user/UserProfile'

import StaffDashboard from './pages/staff/StaffDashboard'
import StaffTokens from './pages/staff/StaffTokens'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminStaff from './pages/admin/AdminStaff'
import AdminServices from './pages/admin/AdminServices'
import AdminCounters from './pages/admin/AdminCounters'
import AdminTokens from './pages/admin/AdminTokens'
import AdminAnalytics from './pages/admin/AdminAnalytics'

function Protected({ children, roles }) {
  const { user, loading, isAuthed } = useAuth()
  if (loading) {
    return (
      <div className="loading-full">
        <span className="spinner spinner-lg" />
        <span className="loading-text">Verifying your session…</span>
      </div>
    )
  }
  if (!isAuthed) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) {
    const home = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/app'
    return <Navigate to={home} replace />
  }
  return children
}

function PublicOnly({ children }) {
  const { isAuthed, loading, user } = useAuth()
  if (loading) return null
  if (isAuthed) {
    const home = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/app'
    return <Navigate to={home} replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          {/* User */}
          <Route path="/app" element={<Protected roles={['user']}><DashboardLayout /></Protected>}>
            <Route index element={<UserDashboard />} />
            <Route path="history" element={<UserHistory />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Staff */}
          <Route path="/staff" element={<Protected roles={['staff']}><DashboardLayout /></Protected>}>
            <Route index element={<StaffDashboard />} />
            <Route path="tokens" element={<StaffTokens />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<Protected roles={['admin']}><DashboardLayout /></Protected>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="counters" element={<AdminCounters />} />
            <Route path="tokens" element={<AdminTokens />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
