<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserActivityController;
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;

// Audit role routes - Read-only access to dashboard, customers, and audit logs
Route::middleware(['auth:sanctum', 'status', 'role:audit'])->prefix('audit')->group(function () {

    // Dashboard access (read-only, based on compliance)
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [CustomerController::class, 'getDashboardData']);
        Route::get('/branch-stats', [CustomerController::class, 'getBranchStats']);
        Route::get('/analytics', [CustomerController::class, 'getAnalyticsData']);
    });

    // User Activity routes - Audit role has full read access to user activities
    Route::prefix('user-activities')->group(function () {
        Route::get('/', [UserActivityController::class, 'index']);
        Route::get('/stats', [UserActivityController::class, 'stats']);
        Route::get('/export', [UserActivityController::class, 'export']);
    });

    // Audit Log routes - Audit role has full read access to audit logs
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('/stats', [AuditLogController::class, 'stats']);
        Route::get('/user/{userId}', [AuditLogController::class, 'userActivity']);
        Route::get('/{auditLog}', [AuditLogController::class, 'show']);
    });

    // Customer access (read-only)
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'getCustomers']);
        Route::get('/{id}', [CustomerController::class, 'show']);
    });

    // Customer list access
    Route::get('/customers-list', [CustomerController::class, 'getCustomers']);

    // Active users endpoint for audit
    Route::get('/auth/active-users', [AuthController::class, 'activeUsers']);
});
