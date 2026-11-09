import { useForm } from '@inertiajs/react'
import { CustomerSelect, DateInput, ProductSelect, TextArea, NumberInput, Button } from '@/Components'

export default function OrderForm({ order }) {
    const form = useForm(order ?? { customer_id: null, delivery_date: '', notes: '', lines: [{ product_id: null, quantity: 1 }] })
    const submit = () => (order ? form.put(route('orders.update', order.id)) : form.post(route('orders.store')))

    return (
        <form onSubmit={(e) => { e.preventDefault(); submit() }}>
            <CustomerSelect value={form.data.customer_id} onChange={(v) => form.setData('customer_id', v)} error={form.errors.customer_id} />
            <DateInput value={form.data.delivery_date} onChange={(v) => form.setData('delivery_date', v)} error={form.errors.delivery_date} />
            <TextArea value={form.data.notes} onChange={(v) => form.setData('notes', v)} />
            {form.data.lines.map((line, i) => (
                <div key={i}>
                    <ProductSelect value={line.product_id} onChange={(v) => form.setData(`lines.${i}.product_id`, v)} />
                    <NumberInput min={1} value={line.quantity} onChange={(v) => form.setData(`lines.${i}.quantity`, v)} />
                    <Button onClick={() => form.setData('lines', form.data.lines.filter((_, j) => j !== i))}>Remove</Button>
                </div>
            ))}
            <Button onClick={() => form.setData('lines', [...form.data.lines, { product_id: null, quantity: 1 }])}>Add line</Button>
            <Button type="submit" disabled={form.processing}>Save</Button>
        </form>
    )
}
