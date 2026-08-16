import './StatusBadge.css'

const LABELS = {
  waiting: 'Waiting',
  called: 'Called',
  serving: 'Serving',
  completed: 'Completed',
  skipped: 'Skipped',
  cancelled: 'Cancelled',
  active: 'Active',
  inactive: 'Inactive',
}

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status
  return <span className={`badge badge-${status}`}>{label}</span>
}
