<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CriteriaController;
use App\Http\Controllers\Api\OptionsController;
use App\Http\Controllers\Api\UserActivityController;
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;

// Compliance-only routes - Oversight and risk management access
Route::middleware(['auth:sanctum', 'status', 'role:compliance'])->prefix('compliance')->group(function () {

    // Dashboard access
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [CustomerController::class, 'getDashboardData']);
        Route::get('/branch-stats', [CustomerController::class, 'getBranchStats']);
        Route::get('/analytics', [CustomerController::class, 'getAnalyticsData']);
    });

    // User Activity routes - Admin and Compliance only
    Route::prefix('user-activities')->group(function () {
        Route::get('/', [UserActivityController::class, 'index']);
        Route::get('/stats', [UserActivityController::class, 'stats']);
        Route::get('/{activity}', [UserActivityController::class, 'show']);
    });

    // Audit Log routes - Admin and Compliance only
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index'])->middleware(['role.permission:permission,view-audit-logs']);
        Route::get('/stats', [AuditLogController::class, 'stats'])->middleware(['role.permission:permission,view-audit-logs']);
        Route::get('/user/{userId}', [AuditLogController::class, 'userActivity'])->middleware(['role.permission:permission,view-audit-logs']);
        Route::get('/{auditLog}', [AuditLogController::class, 'show'])->middleware(['role.permission:permission,view-audit-logs']);
    });

    // Customer access (Compliance only) - View-only operations
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'getCustomers'])->middleware(['role.permission:permission,view-customers']);
        Route::get('/{id}', [CustomerController::class, 'show'])->middleware(['role.permission:permission,view-customers']);
    });

    // Risk Settings - Compliance + Admin access
    Route::prefix('risk-settings')->group(function () {
        // Criteria Management
        Route::prefix('criteria')->group(function () {
            Route::get('/', [CriteriaController::class, 'index'])->middleware(['role.permission:permission,view-risk-settings']);
            Route::post('/', [CriteriaController::class, 'store'])->middleware(['role.permission:permission,manage-risk-settings']);
            Route::get('/dropdown', [CriteriaController::class, 'dropdown'])->middleware(['role.permission:permission,view-risk-settings']);
            Route::get('/{criteria}', [CriteriaController::class, 'show'])->middleware(['role.permission:permission,view-risk-settings']);
            Route::put('/{criteria}', [CriteriaController::class, 'update'])->middleware(['role.permission:permission,manage-risk-settings']);
            Route::delete('/{criteria}', [CriteriaController::class, 'destroy'])->middleware(['role.permission:permission,manage-risk-settings']);
        });

        // Options Management
        Route::prefix('options')->group(function () {
            Route::get('/', [OptionsController::class, 'index'])->middleware(['role.permission:permission,view-risk-settings']);
            Route::post('/', [OptionsController::class, 'store'])->middleware(['role.permission:permission,manage-risk-settings']);
            Route::get('/{option}', [OptionsController::class, 'show'])->middleware(['role.permission:permission,view-risk-settings']);
            Route::put('/{option}', [OptionsController::class, 'update'])->middleware(['role.permission:permission,manage-risk-settings']);
            Route::delete('/{option}', [OptionsController::class, 'destroy'])->middleware(['role.permission:permission,manage-risk-settings']);
            Route::get('/criteria/{criteriaId}', [OptionsController::class, 'getByCriteria'])->middleware(['role.permission:permission,view-risk-settings']);
        });

        // Selection Configuration Management
        Route::prefix('selection-config')->group(function () {
            Route::get('/', [\App\Http\Controllers\Api\SelectionConfigController::class, 'index'])->middleware(['role.permission:permission,view-risk-settings']);
            Route::post('/', [\App\Http\Controllers\Api\SelectionConfigController::class, 'store'])->middleware(['role.permission:permission,manage-risk-settings']);
            Route::put('/', [\App\Http\Controllers\Api\SelectionConfigController::class, 'update'])->middleware(['role.permission:permission,manage-risk-settings']);
        });

        // Risk Thresholds Management
        Route::post('/risk-thresholds', [\App\Http\Controllers\Api\SelectionConfigController::class, 'storeRiskThresholds'])->middleware(['role.permission:permission,manage-risk-settings']);
    });

    // Customer list access for compliance
    Route::get('/customers-list', [CustomerController::class, 'getCustomers'])->middleware(['role.permission:permission,view-customers']);

    // Active users endpoint for compliance
    Route::get('/auth/active-users', [AuthController::class, 'activeUsers']);
});
