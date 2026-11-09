import StatusBadge from '@/Components/StatusBadge'

export default function TicketsIndex({ tickets }) {
    return (
        <table>
            {tickets.map((t) => (
                <tr key={t.id}>
                    <td><a href={route('tickets.show', t.id)}>{t.number}</a></td>
                    <td>{t.customer}</td>
                    <td><StatusBadge status={t.status} /></td>
                </tr>
            ))}
        </table>
    )
}
