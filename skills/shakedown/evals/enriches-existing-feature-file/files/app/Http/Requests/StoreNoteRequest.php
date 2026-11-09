<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('notes.write');
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'body' => ['nullable', 'string'],
            'attachments' => ['array'],
            'attachments.*' => ['file', 'mimes:pdf,jpg,png', 'max:5120'],
        ];
    }
}
