<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Breeze's session-based web login was removed. The SPA authenticates
// exclusively through the bearer-token API in routes/roles/shared.php,
// which is 2FA-aware. Do not add a session-based login route here: Sanctum
// is configured to accept the "web" guard, so a session would satisfy
// auth:sanctum on every API route without ever going through 2FA.
