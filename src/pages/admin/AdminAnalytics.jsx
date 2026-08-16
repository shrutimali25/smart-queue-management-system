import { useCallback, useState } from 'react'
import { api } from '../../services/api'
import { usePoll } from '../../hooks/usePoll'
import { CardSkeleton, TableSkeleton } from '../../components/Loading'
import EmptyState from '../../components/EmptyState'
import { IconChart, IconClock, IconCheck, IconRefresh, IconTrending } from '../../components/Icons'
import '../../styles/analytics.css'

export default function AdminAnalytics() {
  const [tick, setTick] = useState(0)

  const loadSummary = useCallback(() => api.analyticsSummary(), [])
  const { data: summaryData, loading: sl, error: se, refresh: rs } = usePoll(loadSummary, { interval: 30000, deps: [tick] })

  const loadDaily = useCallback(() => api.analyticsDaily({ days: 7 }), [])
  const { data: dailyData, loading: dl, error: de } = usePoll(loadDaily, { interval: 30000, deps: [tick] })

  const loadServices = useCallback(() => api.analyticsServices(), [])
  const { data: svcData, loading: svl, error: sve } = usePoll(loadServices, { interval: 30000, deps: [tick] })

  const refresh = () => { rs(); setTick((t) => t + 1) }
  const s = summaryData?.summary || {}
  const daily = dailyData?.daily || []
  const byService = svcData?.services || []

  const maxDaily = Math.max(1, ...daily.map((d) => d.count || 0))
  const maxSvc = Math.max(1, ...byService.map((d) => d.count || 0))

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Analytics</h2>
        <p className="page-subtitle">Real queue data — token trends, service breakdowns, and performance.</p>
      </div>

      <div className="ud-top-actions" style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-secondary" onClick={refresh}><IconRefresh size={16} /> Refresh</button>
      </div>

      {sl && !summaryData ? (
        <CardSkeleton count={5} />
      ) : se ? (
        <EmptyState title="Could not load analytics" message="Please try again." action={<button className="btn btn-primary" onClick={refresh}>Retry</button>} />
      ) : (
        <div className="kpi-grid">
          <KPI icon={<IconTrending size={20} />} label="Tokens Today" value={s.tokens_today ?? 0} variant="info" />
          <KPI icon={<IconCheck size={20} />} label="Completed Today" value={s.completed ?? 0} variant="success" />
          <KPI icon={<IconChart size={20} />} label="Cancelled Today" value={s.cancelled ?? 0} variant="error" />
          <KPI icon={<IconClock size={20} />} label="Avg Wait Time" value={`${s.avg_wait ?? 0} min`} variant="warning" />
          <KPI icon={<IconClock size={20} />} label="Avg Service Time" value={`${s.avg_service_time ?? 0} min`} variant="neutral" />
        </div>
      )}

      <div className="grid-2">
        <div className="section-card">
          <div className="section-card-header"><h3 className="section-card-title">Daily Token Count (7 days)</h3></div>
          <div className="section-card-body">
            {dl && !dailyData ? (
              <TableSkeleton rows={4} cols={3} />
            ) : de ? (
              <p style={{ color: 'var(--neutral-500)' }}>Could not load daily data.</p>
            ) : daily.length === 0 ? (
              <p style={{ color: 'var(--neutral-500)' }}>No data yet.</p>
            ) : (
              <div className="an-bars">
                {daily.map((d) => (
                  <div key={d.date} className="an-bar-col">
                    <div className="an-bar" style={{ height: `${(d.count / maxDaily) * 180}px` }} title={`${d.count} tokens`} />
                    <span className="an-bar-label">{d.date.slice(5)}</span>
                    <span className="an-bar-val">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="section-card">
          <div className="section-card-header"><h3 className="section-card-title">Service-wise Token Count</h3></div>
          <div className="section-card-body">
            {svl && !svcData ? (
              <TableSkeleton rows={4} cols={3} />
            ) : sve ? (
              <p style={{ color: 'var(--neutral-500)' }}>Could not load service data.</p>
            ) : byService.length === 0 ? (
              <p style={{ color: 'var(--neutral-500)' }}>No data yet.</p>
            ) : (
              <div className="an-svc-list">
                {byService.map((d) => (
                  <div key={d.service_id || d.service_name} className="an-svc-row">
                    <span className="an-svc-name">{d.service_name}</span>
                    <div className="an-svc-bar-track">
                      <div className="an-svc-bar" style={{ width: `${(d.count / maxSvc) * 100}%` }} />
                    </div>
                    <span className="an-svc-val">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPI({ icon, label, value, variant }) {
  return (
    <div className={`kpi-card ${variant ? `kpi-${variant}` : ''}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  )
}
