<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing heartbeat functionality:\n";
echo "================================\n\n";

// Get first active user
$user = DB::table('users')->where('status', 'active')->first();

if (!$user) {
    echo "No active users found!\n";
    exit;
}

echo "Testing with user: {$user->email}\n";
echo "Current last_seen_at: " . ($user->last_seen_at ?? 'NULL') . "\n\n";

// Update last_seen_at
DB::table('users')
    ->where('id', $user->id)
    ->update(['last_seen_at' => now()]);

echo "Updated last_seen_at to: " . now() . "\n\n";

// Verify
$updated = DB::table('users')->where('id', $user->id)->first();
echo "Verified last_seen_at: " . ($updated->last_seen_at ?? 'NULL') . "\n";
