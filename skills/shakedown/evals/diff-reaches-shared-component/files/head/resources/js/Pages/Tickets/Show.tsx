import { useState } from 'react'
import StatusBadge from '@/Components/StatusBadge'
import CloseTicketDialog from './CloseTicketDialog'

export default function TicketShow({ ticket, reasons }) {
    const [closing, setClosing] = useState(false)

    return (
        <div>
            <h1>{ticket.number} <StatusBadge status={ticket.status} /></h1>
            <p>{ticket.customer}</p>
            <button onClick={() => setClosing(true)}>Close</button>
            {closing && <CloseTicketDialog ticket={ticket} reasons={reasons} onClose={() => setClosing(false)} />}
        </div>
    )
}
