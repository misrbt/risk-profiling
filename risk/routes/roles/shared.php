<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\OnlineUsersController;
use App\Http\Controllers\Api\TwoFactorAuthController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

// CSRF Cookie route for session-based authentication
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
})->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class);

// Public routes - stateless API endpoints (no authentication required)
// Completely bypass Sanctum stateful middleware for login to support both domain and IP access
Route::post('/auth/register', [AuthController::class, 'register'])
    ->withoutMiddleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class]);

Route::post('/auth/login', [AuthController::class, 'login'])
    ->withoutMiddleware([
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        \Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ]);

Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])
    ->withoutMiddleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class]);

Route::post('/auth/validate-reset-token', [AuthController::class, 'validateResetToken'])
    ->withoutMiddleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class]);

Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])
    ->withoutMiddleware([\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class]);

// Public branch routes for registration
Route::get('/branches/dropdown', [BranchController::class, 'dropdown']);

// Maintenance mode status check - public route
Route::get('/maintenance/status', function () {
    return response()->json([
        'maintenance_mode' => app()->isDownForMaintenance(),
        'message' => app()->isDownForMaintenance()
            ? 'The application is currently under maintenance. Please check back later.'
            : 'Application is running normally.'
    ]);
});

// Shared authenticated routes - accessible by all authenticated users
Route::middleware(['auth:sanctum', 'status'])->group(function () {

    // Broadcasting authentication route
    Broadcast::routes(['middleware' => ['auth:sanctum']]);

    // Authentication routes - shared by all roles
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/upload-profile-picture', [AuthController::class, 'uploadProfilePicture']);
        Route::get('/tokens', [AuthController::class, 'tokens']);
        Route::delete('/tokens/{tokenId}', [AuthController::class, 'revokeToken']);

        // Enhanced JWT token management
        Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
        Route::get('/validate-token', [AuthController::class, 'validateToken']);
        Route::post('/revoke-token', [AuthController::class, 'revokeToken']);
    });

    // Online Users (Heartbeat and tracking)
    Route::post('/online-users/heartbeat', [OnlineUsersController::class, 'heartbeat']);
    Route::get('/online-users', [OnlineUsersController::class, 'index']);
    Route::get('/online-users/{userId}', [OnlineUsersController::class, 'show']);

    // Two-Factor Authentication
    Route::prefix('two-factor')->group(function () {
        Route::post('/enable', [TwoFactorAuthController::class, 'enable']);
        Route::post('/confirm', [TwoFactorAuthController::class, 'confirm']);
        Route::post('/disable', [TwoFactorAuthController::class, 'disable']);
        Route::get('/status', [TwoFactorAuthController::class, 'status']);
        Route::post('/recovery-codes/regenerate', [TwoFactorAuthController::class, 'regenerateRecoveryCodes']);
    });

});

// Two-Factor Verification (Public route for login)
Route::post('/two-factor/verify', [TwoFactorAuthController::class, 'verify']);

// Rate limited routes - applies to all API routes
Route::middleware(['throttle:api'])->group(function () {
    // All API routes are automatically rate limited
});
