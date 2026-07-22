<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CriteriaController;
use App\Http\Controllers\Api\OptionsController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SelectionConfigController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\UserActivityController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\CustomerController;
use Illuminate\Support\Facades\Route;

// Admin-only routes - Full system access (temporarily removing role check for testing)
Route::middleware(['auth:sanctum', 'status'])->prefix('admin')->group(function () {

    // User management routes - Admin only (unrestricted access)
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::put('/{user}/status', [UserController::class, 'updateStatus']);
        Route::post('/{user}/roles', [UserController::class, 'assignRole']);
        Route::delete('/{user}/roles', [UserController::class, 'removeRole']);
        Route::put('/{user}/roles', [UserController::class, 'syncRoles']);
        Route::post('/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::post('/{user}/reset-mfa', [UserController::class, 'resetMfa']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // Role management routes - Admin only (unrestricted access)
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::post('/', [RoleController::class, 'store']);
        Route::get('/{role}', [RoleController::class, 'show']);
        Route::put('/{role}', [RoleController::class, 'update']);
        Route::delete('/{role}', [RoleController::class, 'destroy']);
        Route::post('/{role}/users', [RoleController::class, 'assignToUser']);
        Route::delete('/{role}/users', [RoleController::class, 'removeFromUser']);
    });

    // Permission management routes - Admin only (unrestricted access)
    Route::prefix('permissions')->group(function () {
        Route::get('/', [PermissionController::class, 'index']);
        Route::post('/', [PermissionController::class, 'store']);
        Route::get('/{permission}', [PermissionController::class, 'show']);
        Route::put('/{permission}', [PermissionController::class, 'update']);
        Route::delete('/{permission}', [PermissionController::class, 'destroy']);
        Route::post('/{permission}/roles', [PermissionController::class, 'assignToRole']);
        Route::delete('/{permission}/roles', [PermissionController::class, 'removeFromRole']);
    });

    // User Activity routes - Admin and Compliance only
    Route::prefix('user-activities')->group(function () {
        Route::get('/', [UserActivityController::class, 'index']);
        Route::get('/stats', [UserActivityController::class, 'stats']);
        Route::get('/{activity}', [UserActivityController::class, 'show']);
    });

    // Audit Log routes - Admin has full access
    Route::prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']); // Admin has full access
        Route::get('/stats', [AuditLogController::class, 'stats']);
        Route::get('/user/{userId}', [AuditLogController::class, 'userActivity']);
        Route::get('/{auditLog}', [AuditLogController::class, 'show']);
    });

    // Customer Management (Admin only) - Full CRUD operations
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'getCustomers']); // Admin uses same method as other roles but without middleware
        Route::get('/{id}', [CustomerController::class, 'show']);
        Route::put('/{id}', [CustomerController::class, 'updateCustomer']);
        Route::delete('/{id}', [CustomerController::class, 'destroy']);
    });

    // System Settings Management - Admin only (unrestricted access)
    Route::prefix('system-settings')->group(function () {
        Route::get('/', [SystemSettingController::class, 'index']);
        Route::put('/', [SystemSettingController::class, 'update']);
        Route::get('/group/{group}', [SystemSettingController::class, 'getByGroup']);
        Route::get('/{key}', [SystemSettingController::class, 'show']);
        Route::post('/initialize-defaults', [SystemSettingController::class, 'initializeDefaults']);
        Route::post('/upload-logo', [SystemSettingController::class, 'uploadLogo']);
        Route::delete('/logo', [SystemSettingController::class, 'deleteLogo']);
    });

    // Dashboard routes - Admin has full access
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [CustomerController::class, 'getDashboardData']);
        Route::get('/branch-stats', [CustomerController::class, 'getBranchStats']);
        Route::get('/analytics', [CustomerController::class, 'getAnalyticsData']);
    });

    // Risk Settings Management - Admin has full access (unrestricted)
    Route::prefix('risk-settings')->group(function () {
        // Criteria routes
        Route::prefix('criteria')->group(function () {
            Route::get('/', [CriteriaController::class, 'index']);
            Route::post('/', [CriteriaController::class, 'store']);
            Route::get('/dropdown', [CriteriaController::class, 'dropdown']);
            Route::get('/{criteria}', [CriteriaController::class, 'show']);
            Route::put('/{criteria}', [CriteriaController::class, 'update']);
            Route::delete('/{criteria}', [CriteriaController::class, 'destroy']);
        });

        // Options routes
        Route::prefix('options')->group(function () {
            Route::get('/', [OptionsController::class, 'index']);
            Route::post('/', [OptionsController::class, 'store']);
            Route::get('/{option}', [OptionsController::class, 'show']);
            Route::put('/{option}', [OptionsController::class, 'update']);
            Route::delete('/{option}', [OptionsController::class, 'destroy']);
            Route::get('/criteria/{criteriaId}', [OptionsController::class, 'getByCriteria']);
        });

        // Selection Configuration routes
        Route::prefix('selection-config')->group(function () {
            Route::get('/', [SelectionConfigController::class, 'index']);
            Route::post('/', [SelectionConfigController::class, 'store']);
            Route::put('/', [SelectionConfigController::class, 'update']);
        });

        // Risk Thresholds routes
        Route::post('/risk-thresholds', [SelectionConfigController::class, 'storeRiskThresholds']);
    });

    // Risk Assessment routes - Admin has full access (unrestricted)
    Route::get('/criteria', [CustomerController::class, 'getCriteria']);
    Route::post('/customers', [CustomerController::class, 'createCustomer']);
    Route::get('/risk-assessments', [CustomerController::class, 'getUserRiskAssessments']);
    Route::get('/risk-thresholds', [CustomerController::class, 'getRiskThresholds']);

    // Active users endpoint for admin
    Route::get('/auth/active-users', [AuthController::class, 'activeUsers']);
});
