import './Loading.css'

export function Loading({ message = 'Loading...', full = false, size = 'md' }) {
  return (
    <div className={full ? 'loading-full' : 'loading-inline'}>
      <span className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
      {message && <span className="loading-text">{message}</span>}
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="table-skeleton">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="table-skeleton-row">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton table-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="card-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card card-skeleton">
          <div className="skeleton" style={{ height: 28, width: 80, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 36, width: 120, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 16, width: 100 }} />
        </div>
      ))}
    </div>
  )
}
