const COLORS = { open: 'blue', pending: 'violet', resolved: 'green', cancelled: 'grey' }

export default function StatusBadge({ status }) {
    return <span className={`badge badge-${COLORS[status]}`}>{status}</span>
}
