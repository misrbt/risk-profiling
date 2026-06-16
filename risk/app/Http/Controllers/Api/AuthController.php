<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\IssuesAuthSession;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserActivity;
use App\Rules\StrongPassword;
use App\Services\TwoFactorPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use IssuesAuthSession;

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('profile_pic')) {
            $data['profile_pic'] = $request->file('profile_pic')->store('profile-pics', 'public');
        }

        $data['password'] = Hash::make($data['password']);

        // Remove role from user data as it's not a fillable field
        $roleSlug = $data['role'];
        unset($data['role']);

        $user = User::create($data);

        // Assign role to user
        $role = Role::where('slug', $roleSlug)->first();
        if ($role) {
            $user->roles()->attach($role->id);
        }

        // Create token with dynamic expiration from system settings
        $expiresAt = $this->getTokenExpiration();
        $tokenResult = $user->createToken('auth-token', ['*'], $expiresAt);
        $token = $tokenResult->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => new UserResource($user->load('roles.permissions')),
                'token' => $token,
                'expires_at' => $expiresAt ? $expiresAt->toISOString() : null,
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user = User::where('email', $request->email)->first();

        // Status check is now handled in LoginRequest::authenticate()

        // If the user already has 2FA enabled, do NOT issue a token yet.
        // The login is only completed once the code is verified via
        // TwoFactorAuthController::verify(), which calls issueAuthSession().
        if ($user->two_factor_enabled) {
            return response()->json([
                'success' => true,
                'message' => 'Two-factor authentication code required',
                'data' => [
                    'two_factor_required' => true,
                    'user_id' => $user->id,
                ],
            ]);
        }

        $data = $this->issueAuthSession($user, $request, 'email');
        $data['two_factor_required'] = false;
        $data['two_factor_enabled'] = false;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => $data,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();

        // Log logout activity
        UserActivity::log(
            'logout',
            'User logged out from the application',
            null,
            null,
            [
                'logout_method' => 'single_session',
                'browser' => $request->userAgent(),
                'ip' => $request->ip(),
            ]
        );

        // Log to audit logs
        AuditLog::log(
            'logout',
            'auth',
            $user->id,
            [],
            [
                'logout_method' => 'single_session',
                'browser' => $request->userAgent(),
                'success' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->tokens()->delete();

        // Log logout all activity
        UserActivity::log(
            'logout_all',
            'User logged out from all sessions',
            null,
            null,
            [
                'logout_method' => 'all_sessions',
                'browser' => $request->userAgent(),
                'ip' => $request->ip(),
            ]
        );

        // Log to audit logs
        AuditLog::log(
            'logout_all',
            'auth',
            $user->id,
            [],
            [
                'logout_method' => 'all_sessions',
                'browser' => $request->userAgent(),
                'success' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Logged out from all devices successfully',
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles.permissions');

        return response()->json([
            'success' => true,
            'data' => new UserResource($user),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'middle_initial' => ['sometimes', 'nullable', 'string', 'max:1'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'username' => ['sometimes', 'string', 'max:255', 'unique:users,username,'.$request->user()->id],
            'email' => ['sometimes', 'email', 'unique:users,email,'.$request->user()->id],
            'profile_pic' => ['sometimes', 'nullable', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $data = $request->only(['first_name', 'middle_initial', 'last_name', 'username', 'email']);

        if ($request->hasFile('profile_pic')) {
            if ($user->profile_pic && Storage::disk('public')->exists($user->profile_pic)) {
                Storage::disk('public')->delete($user->profile_pic);
            }
            $data['profile_pic'] = $request->file('profile_pic')->store('profile-pics', 'public');
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', new StrongPassword],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'password_change_required' => false,
            'password_changed_at' => now(),
        ]);

        // Keep current session active, but delete other sessions for security
        $currentToken = $user->currentAccessToken();
        $user->tokens()->where('id', '!=', $currentToken->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully. You can now continue using the system.',
            'data' => [
                'password_change_required' => false,
                'user' => new UserResource($user->load(['roles.permissions', 'branch'])),
            ],
        ]);
    }

    public function tokens(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()->get(['id', 'name', 'created_at', 'last_used_at']);

        return response()->json([
            'success' => true,
            'data' => $tokens,
        ]);
    }

    public function revokeToken(Request $request, $tokenId): JsonResponse
    {
        $token = $request->user()->tokens()->where('id', $tokenId)->first();

        if (! $token) {
            return response()->json([
                'success' => false,
                'message' => 'Token not found',
            ], 404);
        }

        $token->delete();

        return response()->json([
            'success' => true,
            'message' => 'Token revoked successfully',
        ]);
    }

    public function activeUsers(Request $request): JsonResponse
    {
        // Only compliance officers can view active users
        $user = $request->user();
        if (! $user->roles()->where('slug', 'compliance')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient permissions',
            ], 403);
        }

        // Get all active sessions from cache
        $activeUsers = [];
        $cacheKeys = \Cache::store()->getRedis()->keys('user_activity:*');

        foreach ($cacheKeys as $key) {
            $activity = \Cache::get($key);
            if ($activity) {
                $activeUsers[] = [
                    'user_id' => $activity['user_id'],
                    'last_activity' => $activity['last_activity'],
                    'roles' => $activity['roles'],
                    'ip_address' => $activity['ip_address'],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'active_users' => $activeUsers,
                'total_active' => count($activeUsers),
                'session_timeout_minutes' => 10,
            ],
        ]);
    }

    public function refreshToken(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (! $user || $user->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found or inactive',
                ], 401);
            }

            // Delete old tokens
            $user->tokens()->delete();

            // Create new token with 12-hour expiration
            $tokenResult = $user->createToken('auth-token', ['*'], now()->addHours(12));
            $newToken = $tokenResult->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $newToken,
                    'user' => new UserResource($user->load('roles.permissions', 'branch')),
                    'expires_in_hours' => 12,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token refresh failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function validateToken(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $currentToken = $request->user()->currentAccessToken();

            if (! $currentToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active token found',
                ], 401);
            }

            $timeUntilExpiry = $currentToken->expires_at ?
                $currentToken->expires_at->diffInMinutes(now()) : 0;

            return response()->json([
                'success' => true,
                'message' => 'Token is valid',
                'data' => [
                    'user' => new UserResource($user->load('roles.permissions', 'branch')),
                    'token_valid' => true,
                    'expires_in_minutes' => $timeUntilExpiry,
                    'expires_at' => $currentToken->expires_at?->toISOString(),
                    'last_used_at' => $currentToken->last_used_at?->toISOString(),
                    'created_at' => $currentToken->created_at?->toISOString(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token validation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function uploadProfilePicture(Request $request): JsonResponse
    {
        $request->validate([
            'profile_picture' => ['required', 'image', 'mimes:jpeg,png,jpg,gif', 'max:5120'], // 5MB max
        ]);

        $user = $request->user();

        // Delete old profile picture if exists
        if ($user->profile_pic && Storage::disk('public')->exists($user->profile_pic)) {
            Storage::disk('public')->delete($user->profile_pic);
        }

        // Store new profile picture
        $profilePicPath = $request->file('profile_picture')->store('profile-pics', 'public');

        // Update user's profile picture path
        $user->update([
            'profile_pic' => $profilePicPath,
        ]);

        // Generate full URL for the profile picture
        $profilePicUrl = Storage::disk('public')->url($profilePicPath);

        return response()->json([
            'success' => true,
            'message' => 'Profile picture uploaded successfully',
            'user' => new UserResource($user->load('roles.permissions')),
            'profile_picture_url' => $profilePicUrl,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'success' => true,
                'message' => 'Password reset link sent to your email address',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unable to send password reset link',
        ], 400);
    }

    public function validateResetToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        // Check if token exists and is not expired
        $tokenData = \DB::table('password_reset_tokens')
            ->where('token', $request->token)
            ->first();

        if (! $tokenData) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid reset token',
            ], 400);
        }

        // Check if token is expired (default Laravel expiry is 60 minutes)
        $expiryTime = \Carbon\Carbon::parse($tokenData->created_at)->addMinutes((int) config('auth.passwords.users.expire'));

        if (now()->greaterThan($expiryTime)) {
            return response()->json([
                'success' => false,
                'message' => 'Reset token has expired',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Token is valid',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', new StrongPassword],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ]);

                $user->save();
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password reset successfully. Please login with your new password.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => match ($status) {
                Password::INVALID_TOKEN => 'Invalid or expired reset token',
                Password::INVALID_USER => 'User not found',
                default => 'Unable to reset password'
            },
        ], 400);
    }

}
