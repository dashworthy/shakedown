<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request)
    {
        $order = Order::create($request->safe()->except('lines'));
        $order->lines()->createMany($request->validated('lines'));

        return redirect()->route('orders.index');
    }

    public function update(StoreOrderRequest $request, Order $order)
    {
        $order->update($request->safe()->except('lines'));
        $order->lines()->delete();
        $order->lines()->createMany($request->validated('lines'));

        return redirect()->route('orders.edit', $order);
    }

    public function destroy(Order $order)
    {
        $order->delete();

        return redirect()->route('orders.index');
    }
}
