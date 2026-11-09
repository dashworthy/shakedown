const COLORS = { open: 'blue', pending: 'violet', resolved: 'green', cancelled: 'grey', closed: 'black' }
const LABELS = { open: 'Open', pending: 'Pending', resolved: 'Resolved', cancelled: 'Cancelled', closed: 'Closed' }

export default function StatusBadge({ status }) {
    return <span className={`badge badge-${COLORS[status]}`}>{LABELS[status]}</span>
}
