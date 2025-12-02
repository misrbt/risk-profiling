<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "User Status Check:\n";
echo "==================\n\n";

$users = DB::table('users')->select('email', 'status', 'last_seen_at')->get();

foreach ($users as $user) {
    echo "Email: {$user->email}\n";
    echo "Status: {$user->status}\n";
    echo "Last Seen: " . ($user->last_seen_at ?? 'NULL') . "\n";
    echo "---\n";
}

echo "\nTotal users: " . count($users) . "\n";
echo "Active users: " . DB::table('users')->where('status', 'active')->count() . "\n";
echo "Inactive users: " . DB::table('users')->where('status', 'inactive')->count() . "\n";

// Set current time with proper timezone
$manila = new DateTimeZone('Asia/Manila');
$now = new DateTime('now', $manila);
echo "\nCurrent time (Asia/Manila): " . $now->format('Y-m-d H:i:s') . "\n";
echo "Database now(): " . DB::raw('NOW()')->getValue(DB::connection()->getQueryGrammar()) . "\n";
