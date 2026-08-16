// Centralized API service for the Smart Queue Management System.
// All components talk to the backend through this module — never via raw fetch
// scattered across the app. Uses a Vite dev proxy so "/api" maps to the Flask
// server (http://127.0.0.1:5000) in development; in production the frontend is
// served alongside the API so the same relative path works.

const BASE_URL = '/api'

const TOKEN_KEY = 'sqms_token'
const USER_KEY = 'sqms_user'

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  setUser: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
}

async function request(path, { method = 'GET', body, headers, signal } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers }
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json'
  }
  const token = authStorage.getToken()
  if (token) finalHeaders.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (err) {
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', 'network')
  }

  let data = null
  const text = await res.text()
  if (text) {
    try { data = JSON.parse(text) } catch { data = { message: text } }
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}`
    throw new ApiError(message, res.status, data)
  }
  return data
}

export class ApiError extends Error {
  constructor(message, code, payload) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.payload = payload
  }
}

export const api = {
  // ---- Health ----
  health: () => request('/health'),

  // ---- Auth ----
  register: (payload) => request('/register', { method: 'POST', body: payload }),
  login: (payload) => request('/login', { method: 'POST', body: payload }),
  logout: () => request('/logout', { method: 'POST' }),
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: payload }),

  // ---- Users (admin) ----
  listUsers: (params = {}) => request('/users' + toQuery(params)),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: payload }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // ---- Services ----
  listServices: () => request('/services'),
  createService: (payload) => request('/services', { method: 'POST', body: payload }),
  updateService: (id, payload) => request(`/services/${id}`, { method: 'PUT', body: payload }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  // ---- Counters ----
  listCounters: () => request('/counters'),
  createCounter: (payload) => request('/counters', { method: 'POST', body: payload }),
  updateCounter: (id, payload) => request(`/counters/${id}`, { method: 'PUT', body: payload }),
  deleteCounter: (id) => request(`/counters/${id}`, { method: 'DELETE' }),

  // ---- Tokens ----
  createToken: (payload) => request('/tokens', { method: 'POST', body: payload }),
  getToken: (id) => request(`/tokens/${id}`),
  myTokens: (params = {}) => request('/my-tokens' + toQuery(params)),
  cancelToken: (id) => request(`/tokens/${id}/cancel`, { method: 'PUT' }),

  // ---- Queue ----
  getQueue: (params = {}) => request('/queue' + toQuery(params)),
  callNext: (payload) => request('/queue/next', { method: 'POST', body: payload }),
  startToken: (id) => request(`/queue/${id}/start`, { method: 'PUT' }),
  completeToken: (id) => request(`/queue/${id}/complete`, { method: 'PUT' }),
  skipToken: (id) => request(`/queue/${id}/skip`, { method: 'PUT' }),
  recallToken: (id) => request(`/queue/${id}/recall`, { method: 'PUT' }),

  // ---- Analytics ----
  analyticsSummary: () => request('/analytics/summary'),
  analyticsDaily: (params = {}) => request('/analytics/daily' + toQuery(params)),
  analyticsServices: () => request('/analytics/services'),
}

function toQuery(params) {
  if (!params || Object.keys(params).length === 0) return ''
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') usp.append(k, v)
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}
