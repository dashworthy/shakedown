import { useForm } from '@inertiajs/react'
import { Dialog, Select, TextArea, Button } from '@/Components'

export default function CloseTicketDialog({ ticket, reasons, onClose }) {
    const form = useForm({ close_reason_id: null, note: '' })

    return (
        <Dialog title="Close ticket" onClose={onClose}>
            <Select label="Reason" options={reasons} value={form.data.close_reason_id} onChange={(v) => form.setData('close_reason_id', v)} error={form.errors.close_reason_id} />
            <TextArea label="Note" maxLength={500} value={form.data.note} onChange={(v) => form.setData('note', v)} error={form.errors.note} />
            <Button onClick={() => form.post(route('tickets.close', ticket.id), { onSuccess: onClose })}>Close ticket</Button>
        </Dialog>
    )
}
