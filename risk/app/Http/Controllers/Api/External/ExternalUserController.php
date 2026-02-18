<?php

namespace App\Http\Controllers\Api\External;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * External User Management Controller
 *
 * Provides a shared API for external applications to manage users.
 * Requires authentication via Bearer token (Sanctum) and the `manage-users` permission
 * for all write operations.
 *
 * Base URL: /api/v1/users
 */
class ExternalUserController extends Controller
{
    /**
     * List all users with pagination and optional filters.
     *
     * GET /api/v1/users
     *
     * @queryParam per_page  int    Number of results per page (default: 50)
     * @queryParam search    string Search by name, email, or username
     * @queryParam status    string Filter by status: active|inactive
     * @queryParam role      string Filter by role slug
     * @queryParam branch_id int    Filter by branch ID
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles.permissions', 'branch'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->value();
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->value());
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('role')) {
            $roleSlug = $request->string('role')->value();
            $query->whereHas('roles', fn ($q) => $q->where('slug', $roleSlug));
        }

        $perPage = $request->integer('per_page', 50);
        $users = $query->paginate($perPage);

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

    /**
     * Get a single user by ID.
     *
     * GET /api/v1/users/{user}
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    /**
     * Create a new user with an auto-generated temporary password.
     *
     * POST /api/v1/users
     *
     * @bodyParam first_name     string required User's first name.
     * @bodyParam middle_initial string         User's middle initial (1 char).
     * @bodyParam last_name      string required User's last name.
     * @bodyParam username       string required Unique username.
     * @bodyParam email          string required Unique email address.
     * @bodyParam branch_id      int    required Branch ID the user belongs to.
     * @bodyParam role_ids       int[]  required Array of role IDs to assign.
     * @bodyParam status         string         User status: active|inactive (default: active).
     */
    public function store(Request $request): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

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

        $user->roles()->sync($validated['role_ids']);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'temporary_password' => $temporaryPassword,
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ], 201);
    }

    /**
     * Update an existing user.
     *
     * PUT /api/v1/users/{user}
     *
     * @bodyParam first_name     string required User's first name.
     * @bodyParam middle_initial string         User's middle initial (1 char).
     * @bodyParam last_name      string required User's last name.
     * @bodyParam username       string required Unique username.
     * @bodyParam email          string required Unique email address.
     * @bodyParam branch_id      int    required Branch ID.
     * @bodyParam role_ids       int[]  required Array of role IDs to assign.
     * @bodyParam status         string         User status: active|inactive.
     * @bodyParam password       string         New password (must meet strength requirements).
     * @bodyParam password_confirmation string  Required when password is provided.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

        $rules = [
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

        if ($request->filled('password')) {
            $rules['password'] = ['required', 'confirmed', new StrongPassword];
        }

        $validated = $request->validate($rules);

        $updateData = [
            'first_name' => $validated['first_name'],
            'middle_initial' => $validated['middle_initial'] ?? null,
            'last_name' => $validated['last_name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'status' => $validated['status'] ?? 'active',
            'branch_id' => $validated['branch_id'],
        ];

        if (isset($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
            $updateData['password_change_required'] = true;
            $updateData['password_changed_at'] = now();
        }

        $user->update($updateData);
        $user->roles()->sync($validated['role_ids']);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    /**
     * Update a user's active/inactive status.
     *
     * PUT /api/v1/users/{user}/status
     *
     * @bodyParam status string required User status: active|inactive.
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

        $request->validate([
            'status' => ['required', 'in:active,inactive'],
        ]);

        $user->update(['status' => $request->status]);

        if ($request->status === 'inactive') {
            $user->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'User status updated successfully',
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    /**
     * Assign a role to a user (additive — does not remove existing roles).
     *
     * POST /api/v1/users/{user}/roles
     *
     * @bodyParam role_id int required Role ID to assign.
     */
    public function assignRole(Request $request, User $user): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

        $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user->roles()->syncWithoutDetaching([$request->role_id]);

        return response()->json([
            'success' => true,
            'message' => 'Role assigned to user successfully',
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    /**
     * Remove a specific role from a user.
     *
     * DELETE /api/v1/users/{user}/roles
     *
     * @bodyParam role_id int required Role ID to remove.
     */
    public function removeRole(Request $request, User $user): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

        $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user->roles()->detach($request->role_id);

        return response()->json([
            'success' => true,
            'message' => 'Role removed from user successfully',
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    /**
     * Replace all roles for a user with the provided set.
     *
     * PUT /api/v1/users/{user}/roles
     *
     * @bodyParam role_ids int[] required Array of role IDs to set (replaces existing).
     */
    public function syncRoles(Request $request, User $user): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

        $request->validate([
            'role_ids' => ['required', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ]);

        $user->roles()->sync($request->role_ids);

        return response()->json([
            'success' => true,
            'message' => 'User roles updated successfully',
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    /**
     * Reset a user's password and generate a new temporary password.
     * All existing tokens for the user are revoked.
     *
     * POST /api/v1/users/{user}/reset-password
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

        $temporaryPassword = $this->generateTemporaryPassword();

        $user->update([
            'password' => Hash::make($temporaryPassword),
            'password_change_required' => true,
            'password_changed_at' => now(),
        ]);

        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. Provide the temporary password to the user.',
            'temporary_password' => $temporaryPassword,
            'data' => new UserResource($user->load(['roles.permissions', 'branch'])),
        ]);
    }

    /**
     * Permanently delete a user and revoke all their tokens.
     *
     * DELETE /api/v1/users/{user}
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if (! $this->callerCanManageUsers($request)) {
            return $this->forbidden();
        }

        if ($user->id === $request->user()->id) {
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

    /**
     * Check whether the authenticated caller has the manage-users permission.
     */
    private function callerCanManageUsers(Request $request): bool
    {
        $user = $request->user();

        return $user && (
            $user->hasRole('admin') ||
            $user->hasPermission('manage-users')
        );
    }

    /**
     * Return a standard 403 Forbidden response.
     */
    private function forbidden(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Forbidden. You do not have permission to manage users.',
        ], 403);
    }

    /**
     * Generate a secure temporary password containing uppercase, lowercase,
     * digits, and symbols.
     */
    private function generateTemporaryPassword(): string
    {
        $upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $lower = 'abcdefghijklmnopqrstuvwxyz';
        $digits = '0123456789';
        $symbols = '!@#$%^&*';

        $password = substr(str_shuffle($upper), 0, 2)
            .substr(str_shuffle($lower), 0, 2)
            .substr(str_shuffle($digits), 0, 2)
            .substr(str_shuffle($symbols), 0, 2);

        $all = $upper.$lower.$digits.$symbols;
        for ($i = 8; $i < 12; $i++) {
            $password .= substr(str_shuffle($all), 0, 1);
        }

        return str_shuffle($password);
    }
}
