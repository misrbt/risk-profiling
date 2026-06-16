<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Schema;

class TwoFactorPolicy
{
    /**
     * Determine if two-factor authentication is required for the given user
     * based on the global security policy. No role, including admin, is
     * exempted - the policy applies uniformly to whichever roles are selected.
     */
    public static function isRequiredForUser(User $user): bool
    {
        try {
            if (! Schema::hasTable('system_settings')) {
                return false;
            }

            $twoFactorEnabled = \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'two_factor_enabled')
                ->value('value');

            if (! self::toBool($twoFactorEnabled)) {
                return false;
            }

            $requiredRoles = self::decodeRoles(
                \DB::table('system_settings')
                    ->where('group', 'security')
                    ->where('key', 'two_factor_roles')
                    ->value('value')
            );

            $userRoles = $user->roles->pluck('slug')->toArray();

            return ! empty(array_intersect($userRoles, $requiredRoles));
        } catch (\Exception $e) {
            \Log::error('2FA Policy Check Error: '.$e->getMessage());

            return false;
        }
    }

    private static function toBool($value): bool
    {
        return $value === true || $value === 'true' || $value === '1' || $value === 1;
    }

    /**
     * Roles may be stored single- or double-JSON-encoded depending on how
     * they were written, so decode defensively until an array comes out.
     */
    private static function decodeRoles($raw): array
    {
        $value = $raw;

        for ($i = 0; $i < 2 && is_string($value); $i++) {
            $decoded = json_decode($value, true);
            if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
                break;
            }
            $value = $decoded;
        }

        return is_array($value) ? $value : [];
    }
}
