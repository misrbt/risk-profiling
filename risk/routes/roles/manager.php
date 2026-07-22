<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EditRequestController;
use Illuminate\Support\Facades\Route;

// Manager-only routes - Dashboard and customer viewing access
Route::middleware(['auth:sanctum', 'status', 'role:manager'])->prefix('manager')->group(function () {

    // Dashboard routes - Manager access
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [CustomerController::class, 'getDashboardData']);
        Route::get('/branch-stats', [CustomerController::class, 'getBranchStats']);
        Route::get('/analytics', [CustomerController::class, 'getAnalyticsData']);
    });

    // Customer viewing and editing access
    Route::prefix('customers')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->middleware(['role.permission:permission,view-customers']);
        Route::get('/{id}', [CustomerController::class, 'show'])->middleware(['role.permission:permission,view-customers']);
        Route::put('/{id}', [CustomerController::class, 'updateCustomer'])->middleware(['role.permission:permission,edit-risk-assessments']);
    });

    // Risk assessment access for managers (if they have the permission)
    Route::get('/criteria', [CustomerController::class, 'getCriteria'])->middleware(['role.permission:permission,edit-risk-assessments']);
    Route::get('/risk-thresholds', [CustomerController::class, 'getRiskThresholds'])->middleware(['role.permission:permission,edit-risk-assessments']);
    Route::post('/customers', [CustomerController::class, 'createCustomer'])->middleware(['role.permission:permission,create-risk-assessments']);
    Route::get('/customers-list', [CustomerController::class, 'getCustomers'])->middleware(['role.permission:permission,view-customers']);

    // Edit request management for managers
    Route::prefix('edit-requests')->group(function () {
        Route::get('/pending', [EditRequestController::class, 'getPendingRequests']);
        Route::put('/{id}/status', [EditRequestController::class, 'updateStatus']);
    });
});
