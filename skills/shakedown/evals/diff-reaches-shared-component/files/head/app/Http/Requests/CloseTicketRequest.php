<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CloseTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('tickets.close');
    }

    public function rules(): array
    {
        return [
            'close_reason_id' => ['required', 'exists:close_reasons,id'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
