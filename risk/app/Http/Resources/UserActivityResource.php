<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Convert to user's timezone or default to Asia/Manila (Philippine Standard Time)
        $userTimezone = config('app.user_timezone', 'Asia/Manila');
        // Use copy() to avoid modifying the original Carbon instance
        $performedAt = $this->performed_at->copy()->timezone($userTimezone);
        $createdAt = $this->created_at ? $this->created_at->copy()->timezone($userTimezone) : null;
        $updatedAt = $this->updated_at ? $this->updated_at->copy()->timezone($userTimezone) : null;

        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'first_name' => $this->user->first_name,
                'last_name' => $this->user->last_name,
                'roles' => $this->user->roles->pluck('name'),
            ],
            'action' => $this->action,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'description' => $this->description,
            'metadata' => $this->metadata,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'performed_at' => $performedAt->toIso8601String(),
            'performed_at_timestamp' => $performedAt->timestamp,
            'formatted_date' => $performedAt->format('M d, Y h:i A'),
            'time_ago' => $performedAt->diffForHumans(),
            'created_at' => $createdAt ? $createdAt->toIso8601String() : null,
            'updated_at' => $updatedAt ? $updatedAt->toIso8601String() : null,
        ];
    }
}
