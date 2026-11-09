<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use SoftDeletes;

    protected $fillable = ['title', 'body'];

    public function attachments()
    {
        return $this->hasMany(NoteAttachment::class);
    }
}
