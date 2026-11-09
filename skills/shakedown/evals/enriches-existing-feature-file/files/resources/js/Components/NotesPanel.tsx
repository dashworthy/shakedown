import { useForm, router } from '@inertiajs/react'
import { TextInput, TextArea, FileInput, Button } from '@/Components'

export default function NotesPanel({ ticket, notes, can }) {
    const form = useForm({ title: '', body: '', attachments: [] })

    return (
        <section>
            {notes.map((note) => (
                <article key={note.id}>
                    <h3>{note.title}</h3>
                    <p>{note.body}</p>
                    {note.attachments.map((a) => <a key={a.id} href={a.url}>{a.name}</a>)}
                    {can.delete && <Button onClick={() => router.delete(route('notes.destroy', note.id))}>Delete</Button>}
                </article>
            ))}
            <TextInput label="Title" maxLength={120} value={form.data.title} onChange={(v) => form.setData('title', v)} error={form.errors.title} />
            <TextArea label="Body" value={form.data.body} onChange={(v) => form.setData('body', v)} />
            <FileInput label="Attachments" multiple accept=".pdf,.jpg,.png" onChange={(files) => form.setData('attachments', files)} error={form.errors['attachments.0']} />
            <Button onClick={() => form.post(route('notes.store', ticket.id))}>Add note</Button>
        </section>
    )
}
