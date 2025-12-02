<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Convert to user's timezone or default to Asia/Manila (Philippine Standard Time)
        $userTimezone = config('app.user_timezone', 'Asia/Manila');
        // Use copy() to avoid modifying the original Carbon instance
        $createdAt = $this->created_at->copy()->timezone($userTimezone);
        $updatedAt = $this->updated_at ? $this->updated_at->copy()->timezone($userTimezone) : null;

        return [
            'id' => $this->id,
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name ?? $this->user?->full_name ?? 'System',
                'email' => $this->user?->email ?? 'system@example.com',
                'first_name' => $this->user?->first_name ?? '',
                'last_name' => $this->user?->last_name ?? '',
                'roles' => $this->user?->roles?->pluck('name')->toArray() ?? [],
            ],
            'action' => $this->action,
            'resource_type' => $this->resource_type,
            'resource_id' => $this->resource_id,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'session_id' => $this->session_id,
            'created_at' => $createdAt->toIso8601String(),
            'updated_at' => $updatedAt ? $updatedAt->toIso8601String() : null,
            'formatted_date' => $createdAt->format('M j, Y g:i A'),
            'time_ago' => $createdAt->diffForHumans(),
            'browser_info' => $this->parseBrowserInfo(),
            'changes_summary' => $this->getChangesSummary(),
        ];
    }

    private function parseBrowserInfo(): array
    {
        if (! $this->user_agent) {
            return ['browser' => 'Unknown', 'platform' => 'Unknown'];
        }

        $userAgent = $this->user_agent;

        // Simple browser detection
        $browser = 'Unknown';
        if (strpos($userAgent, 'Chrome') !== false) {
            $browser = 'Chrome';
        } elseif (strpos($userAgent, 'Firefox') !== false) {
            $browser = 'Firefox';
        } elseif (strpos($userAgent, 'Safari') !== false) {
            $browser = 'Safari';
        } elseif (strpos($userAgent, 'Edge') !== false) {
            $browser = 'Edge';
        } elseif (strpos($userAgent, 'Opera') !== false) {
            $browser = 'Opera';
        }

        // Simple platform detection
        $platform = 'Unknown';
        if (strpos($userAgent, 'Windows') !== false) {
            $platform = 'Windows';
        } elseif (strpos($userAgent, 'Mac') !== false) {
            $platform = 'macOS';
        } elseif (strpos($userAgent, 'Linux') !== false) {
            $platform = 'Linux';
        } elseif (strpos($userAgent, 'Android') !== false) {
            $platform = 'Android';
        } elseif (strpos($userAgent, 'iOS') !== false) {
            $platform = 'iOS';
        }

        return [
            'browser' => $browser,
            'platform' => $platform,
            'full_user_agent' => $userAgent,
        ];
    }

    private function getChangesSummary(): ?string
    {
        if (! $this->old_values && ! $this->new_values) {
            return null;
        }

        $changes = [];

        if ($this->old_values && $this->new_values) {
            $oldValues = is_array($this->old_values) ? $this->old_values : [];
            $newValues = is_array($this->new_values) ? $this->new_values : [];

            foreach ($newValues as $key => $newValue) {
                $oldValue = $oldValues[$key] ?? null;
                if ($oldValue !== $newValue) {
                    $changes[] = ucfirst(str_replace('_', ' ', $key)).': '.
                                ($oldValue ? "'{$oldValue}'" : 'null').' → '.
                                ($newValue ? "'{$newValue}'" : 'null');
                }
            }
        } elseif ($this->new_values) {
            $newValues = is_array($this->new_values) ? $this->new_values : [];
            foreach ($newValues as $key => $value) {
                if ($value !== null) {
                    $changes[] = ucfirst(str_replace('_', ' ', $key)).': '.$value;
                }
            }
        }

        return ! empty($changes) ? implode(', ', $changes) : null;
    }
}
