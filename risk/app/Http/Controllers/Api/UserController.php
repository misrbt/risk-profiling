<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function __construct()
    {
        // Laravel 11+ uses route middleware instead of controller middleware
        // Middleware will be handled in routes/api.php
    }

    public function index(): JsonResponse
    {
        $users = User::with(['roles.permissions', 'branch'])->orderBy('created_at', 'desc')->paginate(50);

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_initial' => ['nullable', 'string', 'max:1'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'status' => ['nullable', 'in:active,inactive'],
            'branch_id' => ['required', 'integer', 'exists:branch,id'],
            'role_ids' => ['required', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ]);

        // Generate temporary password automatically
        $temporaryPassword = $this->generateTemporaryPassword();

        $user = User::create([
            'first_name' => $validated['first_name'],
            'middle_initial' => $validated['middle_initial'] ?? null,
            'last_name' => $validated['last_name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($temporaryPassword),
            'status' => $validated['status'] ?? 'active',
            'branch_id' => $validated['branch_id'],
            'email_verified_at' => now(),
            'password_change_required' => true,
            'password_changed_at' => now(),
        ]);

        // Assign roles
        $user->roles()->sync($validated['role_ids']);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'temporary_password' => $temporaryPassword,
            'data' => new UserResource($user->load('roles.permissions')),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validationRules = [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_initial' => ['nullable', 'string', 'max:1'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username,'.$user->id],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'status' => ['nullable', 'in:active,inactive'],
            'branch_id' => ['required', 'integer', 'exists:branch,id'],
            'role_ids' => ['required', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ];

        // Add password validation only if password is provided
        if ($request->has('password') && $request->password) {
            $validationRules['password'] = ['required', 'confirmed', new StrongPassword];
        }

        $validated = $request->validate($validationRules);

        $updateData = [
            'first_name' => $validated['first_name'],
            'middle_initial' => $validated['middle_initial'] ?? null,
            'last_name' => $validated['last_name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'status' => $validated['status'] ?? 'active',
            'branch_id' => $validated['branch_id'],
        ];

        // Update password only if provided
        if (isset($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        // Sync roles
        $user->roles()->sync($validated['role_ids']);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot change your own status',
            ], 422);
        }

        $user->update(['status' => $request->status]);

        if ($request->status === 'inactive') {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'User status updated successfully',
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user->roles()->syncWithoutDetaching([$request->role_id]);

        return response()->json([
            'success' => true,
            'message' => 'Role assigned to user successfully',
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    public function removeRole(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user->roles()->detach($request->role_id);

        return response()->json([
            'success' => true,
            'message' => 'Role removed from user successfully',
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    public function syncRoles(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role_ids' => ['required', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ]);

        $user->roles()->sync($request->role_ids);

        return response()->json([
            'success' => true,
            'message' => 'User roles updated successfully',
            'data' => new UserResource($user->load('roles.permissions')),
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        // Allow admins to reset their own password, but prevent other users from doing so
        $currentUser = auth()->user();
        $isAdmin = $currentUser->roles()->where('slug', 'admin')->exists();

        if ($user->id === auth()->id() && ! $isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot reset your own password',
            ], 422);
        }

        // Generate a temporary password
        $temporaryPassword = Str::random(12);

        // Update user password and set temporary password flag
        $user->update([
            'password' => Hash::make($temporaryPassword),
            'password_change_required' => true,
            'password_changed_at' => now(),
        ]);

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. Temporary password provided.',
            'temporary_password' => $temporaryPassword,
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    public function resetMfa(Request $request, User $user): JsonResponse
    {
        // Allow admins to reset their own MFA, but prevent other users from doing so
        $currentUser = auth()->user();
        $isAdmin = $currentUser->roles()->where('slug', 'admin')->exists();

        if ($user->id === auth()->id() && ! $isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot reset your own MFA',
            ], 422);
        }

        if (! $isAdmin) {
            return response()->json([
                'success' => false,
                'message' => "Only administrators can reset another user's MFA",
            ], 403);
        }

        $wasEnabled = (bool) $user->two_factor_enabled;

        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        AuditLog::log(
            'mfa_reset',
            'users',
            $user->id,
            ['two_factor_enabled' => $wasEnabled],
            ['two_factor_enabled' => false]
        );

        return response()->json([
            'success' => true,
            'message' => 'MFA reset successfully. The user will need to set up two-factor authentication again.',
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account',
            ], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }

    private function generateTemporaryPassword(): string
    {
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $numbers = '0123456789';
        $symbols = '!@#$%^&*';

        $password = '';
        $password .= substr(str_shuffle($uppercase), 0, 2);
        $password .= substr(str_shuffle($lowercase), 0, 2);
        $password .= substr(str_shuffle($numbers), 0, 2);
        $password .= substr(str_shuffle($symbols), 0, 2);

        $allCharacters = $uppercase.$lowercase.$numbers.$symbols;
        for ($i = 8; $i < 12; $i++) {
            $password .= substr(str_shuffle($allCharacters), 0, 1);
        }

        return str_shuffle($password);
    }
}
