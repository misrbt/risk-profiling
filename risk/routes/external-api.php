<?php

/**
 * ============================================================================
 * EXTERNAL / SHARED USER MANAGEMENT API ROUTES
 * ============================================================================
 *
 * These routes expose a fully-featured User Management API for use by external
 * systems and integrations. Authentication is stateless via Laravel Sanctum
 * Bearer tokens.
 *
 * HOW TO AUTHENTICATE
 * -------------------
 * 1. Obtain a token by posting credentials to POST /api/v1/auth/login
 * 2. Include the token in every request:
 *    Authorization: Bearer {your-token}
 *
 * PERMISSION REQUIREMENTS
 * -----------------------
 * - Read endpoints (GET): requires valid authentication only
 * - Write endpoints (POST, PUT, DELETE): requires `manage-users` permission
 *   or the `admin` role
 *
 * BASE URL
 * --------
 * /api/risk-profiling/v1/users
 *
 * ============================================================================
 */

use App\Http\Controllers\Api\External\ExternalUserController;
use Illuminate\Support\Facades\Route;

Route::prefix('risk-profiling/v1/users')
    ->middleware(['external.api'])
    ->group(function () {

        /**
         * LIST USERS
         * GET /api/risk-profiling/v1/users
         *
         * Query Parameters:
         *   per_page  int     Results per page (default: 50)
         *   search    string  Search by name, email or username
         *   status    string  Filter: active | inactive
         *   role      string  Filter by role slug (e.g. "admin", "manager")
         *   branch_id int     Filter by branch ID
         *
         * Response:
         * {
         *   "success": true,
         *   "data": [ ...users... ],
         *   "meta": { "current_page": 1, "last_page": 3, "per_page": 50, "total": 120 }
         * }
         */
        Route::get('/', [ExternalUserController::class, 'index'])
            ->name('external.users.index');

        /**
         * GET USER
         * GET /api/risk-profiling/v1/users/{id}
         *
         * Response:
         * {
         *   "success": true,
         *   "data": { ...user... }
         * }
         */
        Route::get('/{user}', [ExternalUserController::class, 'show'])
            ->name('external.users.show');

        /**
         * CREATE USER
         * POST /api/risk-profiling/v1/users
         *
         * Body (JSON):
         * {
         *   "first_name":     "John",
         *   "middle_initial": "A",           // optional
         *   "last_name":      "Doe",
         *   "username":       "johndoe",
         *   "email":          "john@example.com",
         *   "branch_id":      1,
         *   "role_ids":       [2, 3],
         *   "status":         "active"        // optional, default: active
         * }
         *
         * Response 201:
         * {
         *   "success": true,
         *   "message": "User created successfully",
         *   "temporary_password": "A1b2!@Cd3$",
         *   "data": { ...user... }
         * }
         */
        Route::post('/', [ExternalUserController::class, 'store'])
            ->name('external.users.store');

        /**
         * UPDATE USER
         * PUT /api/risk-profiling/v1/users/{id}
         *
         * Body (JSON):
         * {
         *   "first_name":            "John",
         *   "last_name":             "Smith",
         *   "username":              "johnsmith",
         *   "email":                 "john.smith@example.com",
         *   "branch_id":             2,
         *   "role_ids":              [2],
         *   "status":                "active",
         *   "password":              "NewPass123!",  // optional
         *   "password_confirmation": "NewPass123!"   // required if password given
         * }
         *
         * Response:
         * { "success": true, "message": "User updated successfully", "data": { ...user... } }
         */
        Route::put('/{user}', [ExternalUserController::class, 'update'])
            ->name('external.users.update');

        /**
         * UPDATE USER STATUS
         * PUT /api/risk-profiling/v1/users/{id}/status
         *
         * Body (JSON):
         * { "status": "inactive" }
         *
         * Response:
         * { "success": true, "message": "User status updated successfully", "data": { ...user... } }
         */
        Route::put('/{user}/status', [ExternalUserController::class, 'updateStatus'])
            ->name('external.users.update-status');

        /**
         * ASSIGN ROLE (additive)
         * POST /api/risk-profiling/v1/users/{id}/roles
         *
         * Body (JSON):
         * { "role_id": 3 }
         *
         * Response:
         * { "success": true, "message": "Role assigned to user successfully", "data": { ...user... } }
         */
        Route::post('/{user}/roles', [ExternalUserController::class, 'assignRole'])
            ->name('external.users.assign-role');

        /**
         * REMOVE ROLE
         * DELETE /api/risk-profiling/v1/users/{id}/roles
         *
         * Body (JSON):
         * { "role_id": 3 }
         *
         * Response:
         * { "success": true, "message": "Role removed from user successfully", "data": { ...user... } }
         */
        Route::delete('/{user}/roles', [ExternalUserController::class, 'removeRole'])
            ->name('external.users.remove-role');

        /**
         * SYNC ROLES (replaces all existing roles)
         * PUT /api/risk-profiling/v1/users/{id}/roles
         *
         * Body (JSON):
         * { "role_ids": [1, 3] }
         *
         * Response:
         * { "success": true, "message": "User roles updated successfully", "data": { ...user... } }
         */
        Route::put('/{user}/roles', [ExternalUserController::class, 'syncRoles'])
            ->name('external.users.sync-roles');

        /**
         * RESET PASSWORD
         * POST /api/risk-profiling/v1/users/{id}/reset-password
         *
         * No body required.
         *
         * Response:
         * {
         *   "success": true,
         *   "message": "Password reset successfully. Provide the temporary password to the user.",
         *   "temporary_password": "X9y!zW2@",
         *   "data": { ...user... }
         * }
         */
        Route::post('/{user}/reset-password', [ExternalUserController::class, 'resetPassword'])
            ->name('external.users.reset-password');

        /**
         * DELETE USER
         * DELETE /api/risk-profiling/v1/users/{id}
         *
         * Response:
         * { "success": true, "message": "User deleted successfully" }
         */
        Route::delete('/{user}', [ExternalUserController::class, 'destroy'])
            ->name('external.users.destroy');
    });
