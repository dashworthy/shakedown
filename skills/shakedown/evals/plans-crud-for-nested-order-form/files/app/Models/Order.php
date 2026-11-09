<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = ['customer_id', 'delivery_date', 'notes'];

    public function lines()
    {
        return $this->hasMany(OrderLine::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }
}
