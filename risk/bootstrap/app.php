<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function () {
            // Register authentication API routes for external integration
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/auth-api.php'));

            // Register external/shared user management API routes
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/external-api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {

        $middleware->api(append: [
            \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'role.permission' => \App\Http\Middleware\RolePermissionMiddleware::class,
            'status' => \App\Http\Middleware\CheckStatus::class,
            'token.expiration' => \App\Http\Middleware\TokenExpirationMiddleware::class,
            'token.activity' => \App\Http\Middleware\TokenActivityMiddleware::class,
            'external.api' => \App\Http\Middleware\VerifyExternalApiKey::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
