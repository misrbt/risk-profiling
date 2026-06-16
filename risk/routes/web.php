<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// routes/auth.php (Breeze's session-based web login) is intentionally not
// registered. The SPA authenticates exclusively through the bearer-token
// API in routes/roles/shared.php, which is 2FA-aware. Sanctum is configured
// to accept the "web" guard, so a session created via that route would
// satisfy auth:sanctum on every API route without ever going through the
// two-factor challenge - do not re-enable it without addressing that.
