<?php

namespace App\Http\Controllers\Concerns;

use App\Models\AuditLog;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserActivity;
use App\Services\TwoFactorPolicy;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

trait IssuesAuthSession
{
    /**
     * Get token expiration time from system settings.
     */
    private function getTokenExpiration()
    {
        try {
            $tokenExpiration = (int) SystemSetting::getValue('token_expiration_minutes', 60);

            return $tokenExpiration === 0 ? null : now()->addMinutes($tokenExpiration);
        } catch (\Exception $e) {
            return now()->addMinutes(60);
        }
    }

    /**
     * Issue a fresh Sanctum token for the user and log the login, returning
     * the same response payload shape regardless of whether the user came
     * straight through password auth or via a two-factor challenge.
     */
    private function issueAuthSession(User $user, Request $request, string $loginMethod = 'email'): array
    {
        $user->tokens()->delete();

        $expiresAt = $this->getTokenExpiration();
        $tokenResult = $user->createToken('auth-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        auth()->login($user);
        UserActivity::log(
            'login',
            'User logged into the application',
            null,
            null,
            [
                'login_method' => $loginMethod,
                'browser' => $request->userAgent(),
                'ip' => $request->ip(),
            ]
        );

        AuditLog::log(
            'login',
            'auth',
            $user->id,
            [],
            [
                'login_method' => $loginMethod,
                'browser' => $request->userAgent(),
                'success' => true,
            ]
        );

        return [
            'user' => new UserResource($user->load('roles.permissions')),
            'token' => $token,
            'expires_at' => $expiresAt ? $expiresAt->toISOString() : null,
            'password_change_required' => $user->password_change_required ?? false,
            'password_expired' => $user->isPasswordExpired(),
            'days_until_password_expires' => $user->daysUntilPasswordExpires(),
            'two_factor_setup_required' => TwoFactorPolicy::isRequiredForUser($user) && ! $user->two_factor_enabled,
        ];
    }
}
