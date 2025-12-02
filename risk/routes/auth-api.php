<?php

/**
 * ============================================================================
 * AUTHENTICATION API ROUTES
 * ============================================================================
 *
 * This file contains all authentication-related API routes for external
 * integration with other applications. These routes provide comprehensive
 * authentication features including:
 *
 * - User registration and login
 * - Role-based access control (RBAC)
 * - Password management (change, reset, expiration)
 * - Token management (create, refresh, revoke)
 * - Profile management
 * - User activity tracking
 * - Session management
 * - Two-factor authentication (optional)
 *
 * All routes are stateless and use Laravel Sanctum for API token authentication.
 * These routes can be integrated with any external application.
 *
 * Base URL: /api/v1/auth
 *
 * ============================================================================
 */

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OnlineUsersController;
use Illuminate\Support\Facades\Route;

// ============================================================================
// PUBLIC AUTHENTICATION ROUTES (No authentication required)
// ============================================================================

Route::prefix('v1/auth')->group(function () {

    /**
     * USER REGISTRATION
     * POST /api/v1/auth/register
     *
     * Body:
     * {
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "john@example.com",
     *   "username": "johndoe",
     *   "password": "SecurePass123!",
     *   "password_confirmation": "SecurePass123!",
     *   "branch_id": 1
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Registration successful",
     *   "data": {
     *     "user": {...},
     *     "token": "1|xxx...",
     *     "expires_at": "2025-10-12T12:00:00.000000Z"
     *   }
     * }
     */
    Route::post('/register', [AuthController::class, 'register'])
        ->name('api.auth.register');

    /**
     * USER LOGIN
     * POST /api/v1/auth/login
     *
     * Body:
     * {
     *   "email": "john@example.com",
     *   "password": "SecurePass123!",
     *   "remember": false
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Login successful",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "email": "john@example.com",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "roles": [{"id": 1, "name": "User", "slug": "user"}],
     *       "permissions": ["view_customers", "create_customers"]
     *     },
     *     "token": "1|xxx...",
     *     "expires_at": "2025-10-12T12:00:00.000000Z",
     *     "password_change_required": false,
     *     "password_expired": false,
     *     "days_until_password_expires": 30
     *   }
     * }
     */
    Route::post('/login', [AuthController::class, 'login'])
        ->name('api.auth.login');

    /**
     * FORGOT PASSWORD
     * POST /api/v1/auth/forgot-password
     *
     * Body:
     * {
     *   "email": "john@example.com"
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Password reset link sent to your email"
     * }
     */
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->name('api.auth.forgot-password');

    /**
     * VALIDATE RESET TOKEN
     * POST /api/v1/auth/validate-reset-token
     *
     * Body:
     * {
     *   "token": "abc123...",
     *   "email": "john@example.com"
     * }
     *
     * Response:
     * {
     *   "valid": true,
     *   "message": "Token is valid"
     * }
     */
    Route::post('/validate-reset-token', [AuthController::class, 'validateResetToken'])
        ->name('api.auth.validate-reset-token');

    /**
     * RESET PASSWORD
     * POST /api/v1/auth/reset-password
     *
     * Body:
     * {
     *   "token": "abc123...",
     *   "email": "john@example.com",
     *   "password": "NewSecurePass123!",
     *   "password_confirmation": "NewSecurePass123!"
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Password has been reset successfully"
     * }
     */
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->name('api.auth.reset-password');

});

// ============================================================================
// PROTECTED AUTHENTICATION ROUTES (Require authentication)
// ============================================================================

Route::prefix('v1/auth')->middleware(['auth:sanctum', 'status'])->group(function () {

    /**
     * LOGOUT (Current device)
     * POST /api/v1/auth/logout
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Logged out successfully"
     * }
     */
    Route::post('/logout', [AuthController::class, 'logout'])
        ->name('api.auth.logout');

    /**
     * LOGOUT ALL DEVICES
     * POST /api/v1/auth/logout-all
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Logged out from all devices successfully"
     * }
     */
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])
        ->name('api.auth.logout-all');

    /**
     * GET USER PROFILE
     * GET /api/v1/auth/profile
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "email": "john@example.com",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "roles": [...],
     *       "permissions": [...],
     *       "branch": {...}
     *     }
     *   }
     * }
     */
    Route::get('/profile', [AuthController::class, 'profile'])
        ->name('api.auth.profile');

    /**
     * UPDATE USER PROFILE
     * PUT /api/v1/auth/profile
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Body:
     * {
     *   "first_name": "John",
     *   "last_name": "Doe",
     *   "email": "newemail@example.com",
     *   "branch_id": 2
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Profile updated successfully",
     *   "data": {
     *     "user": {...}
     *   }
     * }
     */
    Route::put('/profile', [AuthController::class, 'updateProfile'])
        ->name('api.auth.update-profile');

    /**
     * CHANGE PASSWORD
     * PUT /api/v1/auth/change-password
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Body:
     * {
     *   "current_password": "OldPass123!",
     *   "password": "NewPass123!",
     *   "password_confirmation": "NewPass123!"
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Password changed successfully"
     * }
     */
    Route::put('/change-password', [AuthController::class, 'changePassword'])
        ->name('api.auth.change-password');

    /**
     * UPLOAD PROFILE PICTURE
     * POST /api/v1/auth/upload-profile-picture
     *
     * Headers:
     * Authorization: Bearer {token}
     * Content-Type: multipart/form-data
     *
     * Body:
     * {
     *   "profile_pic": <file>
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Profile picture uploaded successfully",
     *   "data": {
     *     "profile_pic_url": "/storage/profile_pics/xxx.jpg"
     *   }
     * }
     */
    Route::post('/upload-profile-picture', [AuthController::class, 'uploadProfilePicture'])
        ->name('api.auth.upload-profile-picture');

    /**
     * GET ALL USER TOKENS
     * GET /api/v1/auth/tokens
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "tokens": [
     *       {
     *         "id": 1,
     *         "name": "web-token",
     *         "last_used_at": "2025-10-12T12:00:00.000000Z",
     *         "created_at": "2025-10-01T12:00:00.000000Z"
     *       }
     *     ]
     *   }
     * }
     */
    Route::get('/tokens', [AuthController::class, 'tokens'])
        ->name('api.auth.tokens');

    /**
     * REFRESH TOKEN
     * POST /api/v1/auth/refresh-token
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Token refreshed successfully",
     *   "data": {
     *     "token": "2|xxx...",
     *     "expires_at": "2025-10-13T12:00:00.000000Z"
     *   }
     * }
     */
    Route::post('/refresh-token', [AuthController::class, 'refreshToken'])
        ->name('api.auth.refresh-token');

    /**
     * VALIDATE TOKEN
     * GET /api/v1/auth/validate-token
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "valid": true,
     *   "user": {...},
     *   "expires_at": "2025-10-12T12:00:00.000000Z"
     * }
     */
    Route::get('/validate-token', [AuthController::class, 'validateToken'])
        ->name('api.auth.validate-token');

    /**
     * REVOKE TOKEN
     * POST /api/v1/auth/revoke-token
     * DELETE /api/v1/auth/tokens/{tokenId}
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Body (for POST):
     * {
     *   "token_id": 1
     * }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Token revoked successfully"
     * }
     */
    Route::post('/revoke-token', [AuthController::class, 'revokeToken'])
        ->name('api.auth.revoke-token');

    Route::delete('/tokens/{tokenId}', [AuthController::class, 'revokeToken'])
        ->name('api.auth.delete-token');

});

// ============================================================================
// USER ACTIVITY & SESSION MANAGEMENT
// ============================================================================

Route::prefix('v1/auth')->middleware(['auth:sanctum', 'status'])->group(function () {

    /**
     * SEND HEARTBEAT (Update last_seen_at)
     * POST /api/v1/auth/heartbeat
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Heartbeat recorded",
     *   "data": {
     *     "last_seen_at": "2025-10-12T12:00:00.000000Z"
     *   }
     * }
     */
    Route::post('/heartbeat', [OnlineUsersController::class, 'heartbeat'])
        ->name('api.auth.heartbeat');

    /**
     * GET ONLINE USERS
     * GET /api/v1/auth/online-users
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "online_users": [
     *       {
     *         "id": 1,
     *         "name": "John Doe",
     *         "email": "john@example.com",
     *         "roles": ["User"],
     *         "last_seen_at": "2025-10-12T12:00:00.000000Z",
     *         "last_seen_human": "2 minutes ago",
     *         "is_online": true
     *       }
     *     ],
     *     "total_online": 1
     *   }
     * }
     */
    Route::get('/online-users', [OnlineUsersController::class, 'index'])
        ->name('api.auth.online-users');

    /**
     * GET USER ONLINE STATUS
     * GET /api/v1/auth/online-users/{userId}
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "is_online": true,
     *       "last_seen_at": "2025-10-12T12:00:00.000000Z",
     *       "last_seen_human": "Just now"
     *     }
     *   }
     * }
     */
    Route::get('/online-users/{userId}', [OnlineUsersController::class, 'show'])
        ->name('api.auth.online-user-status');

});

// ============================================================================
// ROLE & PERMISSION CHECKING ROUTES
// ============================================================================

Route::prefix('v1/auth')->middleware(['auth:sanctum', 'status'])->group(function () {

    /**
     * CHECK USER ROLE
     * POST /api/v1/auth/check-role
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Body:
     * {
     *   "role": "admin"
     * }
     *
     * Response:
     * {
     *   "has_role": true,
     *   "role": "admin"
     * }
     */
    Route::post('/check-role', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $role = $request->input('role');

        return response()->json([
            'has_role' => $user->hasRole($role),
            'role' => $role,
            'user_roles' => $user->roles->pluck('slug')->toArray()
        ]);
    })->name('api.auth.check-role');

    /**
     * CHECK USER PERMISSION
     * POST /api/v1/auth/check-permission
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Body:
     * {
     *   "permission": "view_customers"
     * }
     *
     * Response:
     * {
     *   "has_permission": true,
     *   "permission": "view_customers"
     * }
     */
    Route::post('/check-permission', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $permission = $request->input('permission');

        return response()->json([
            'has_permission' => $user->hasPermission($permission),
            'permission' => $permission,
            'user_permissions' => $user->roles()
                ->with('permissions')
                ->get()
                ->pluck('permissions')
                ->flatten()
                ->pluck('slug')
                ->unique()
                ->values()
                ->toArray()
        ]);
    })->name('api.auth.check-permission');

    /**
     * GET USER ROLES & PERMISSIONS
     * GET /api/v1/auth/roles-permissions
     *
     * Headers:
     * Authorization: Bearer {token}
     *
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "roles": ["user", "manager"],
     *     "permissions": ["view_customers", "create_customers", "edit_customers"]
     *   }
     * }
     */
    Route::get('/roles-permissions', function (\Illuminate\Http\Request $request) {
        $user = $request->user()->load('roles.permissions');

        return response()->json([
            'success' => true,
            'data' => [
                'roles' => $user->roles->pluck('slug')->toArray(),
                'permissions' => $user->roles()
                    ->with('permissions')
                    ->get()
                    ->pluck('permissions')
                    ->flatten()
                    ->pluck('slug')
                    ->unique()
                    ->values()
                    ->toArray()
            ]
        ]);
    })->name('api.auth.roles-permissions');

});

// ============================================================================
// ADDITIONAL UTILITY ROUTES
// ============================================================================

Route::prefix('v1/auth')->group(function () {

    /**
     * CHECK MAINTENANCE MODE
     * GET /api/v1/auth/maintenance-status
     *
     * Response:
     * {
     *   "maintenance_mode": false,
     *   "message": "Application is running normally."
     * }
     */
    Route::get('/maintenance-status', function () {
        return response()->json([
            'maintenance_mode' => app()->isDownForMaintenance(),
            'message' => app()->isDownForMaintenance()
                ? 'The application is currently under maintenance. Please check back later.'
                : 'Application is running normally.'
        ]);
    })->name('api.auth.maintenance-status');

});
