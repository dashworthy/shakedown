export default function TicketShow({ ticket }) {
    return (
        <div>
            <h1>{ticket.number}</h1>
            <p>{ticket.customer}</p>
        </div>
    )
}
