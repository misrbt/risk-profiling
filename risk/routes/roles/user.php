<?php

use App\Http\Controllers\Api\SelectionConfigController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\EditRequestController;
use Illuminate\Support\Facades\Route;

// User-only routes - Limited risk assessment access
Route::middleware(['auth:sanctum', 'status', 'role:users'])->prefix('user')->group(function () {

    // Risk assessment functionality - Core function for users
    Route::get('/criteria', [CustomerController::class, 'getCriteria'])->middleware(['role.permission:permission,create-risk-assessments']);
    Route::get('/risk-thresholds', [CustomerController::class, 'getRiskThresholds'])->middleware(['role.permission:permission,create-risk-assessments']);
    Route::get('/risk-settings/selection-config', [SelectionConfigController::class, 'index'])->middleware(['role.permission:permission,create-risk-assessments']);
    Route::post('/customers', [CustomerController::class, 'createCustomer'])->middleware(['role.permission:permission,create-risk-assessments']);
    Route::get('/customers-list', [CustomerController::class, 'getCustomers'])->middleware(['role.permission:permission,view-customers']);

    // User-exclusive routes (Users Only - Admin/Compliance/Manager Excluded)
    Route::middleware(['role.permission:role_exclusive,admin,compliance,manager'])->group(function () {
        Route::get('/risk-assessments', [CustomerController::class, 'getUserRiskAssessments']);
    });

    // Customer listing access for users
    Route::get('/customers', [CustomerController::class, 'index'])->middleware(['role.permission:permission,view-customers']);


    // Customer routes for approved edit access
    Route::get('/customers/{id}', [CustomerController::class, 'show'])->middleware(['role.permission:permission,view-customers']);
    Route::put('/customers/{id}', [CustomerController::class, 'updateCustomer'])->middleware(['role.permission:permission,view-customers']);

    // Edit request functionality for regular users
    Route::prefix('edit-requests')->group(function () {
        Route::post('/', [EditRequestController::class, 'store'])->middleware(['role.permission:permission,view-customers']);
        Route::get('/check-access/{customer}', [EditRequestController::class, 'checkEditAccess'])->middleware(['role.permission:permission,view-customers']);
        Route::get('/my-requests', [EditRequestController::class, 'getUserRequests'])->middleware(['role.permission:permission,view-customers']);
    });
});
