<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking users with last_seen_at:\n";
echo "================================\n\n";

$users = DB::table('users')
    ->whereNotNull('last_seen_at')
    ->select('id', 'first_name', 'last_name', 'email', 'last_seen_at', 'status')
    ->get();

echo "Total users with last_seen_at: " . count($users) . "\n\n";

foreach ($users as $user) {
    echo "User: {$user->email}\n";
    echo "Name: {$user->first_name} {$user->last_name}\n";
    echo "Status: {$user->status}\n";
    echo "Last seen: {$user->last_seen_at}\n";

    $lastSeen = \Carbon\Carbon::parse($user->last_seen_at);
    $now = \Carbon\Carbon::now();
    $diffMinutes = $now->diffInMinutes($lastSeen);

    echo "Minutes ago: {$diffMinutes}\n";
    echo "Is online (< 2 min): " . ($diffMinutes < 2 ? 'YES' : 'NO') . "\n";
    echo "Is recently active (< 5 min): " . ($diffMinutes < 5 ? 'YES' : 'NO') . "\n";
    echo "---\n\n";
}

// Check online threshold
echo "\nOnline Threshold Check:\n";
echo "========================\n";
$onlineThreshold = \Carbon\Carbon::now()->subMinutes(5);
echo "Threshold (5 min ago): {$onlineThreshold}\n\n";

$onlineUsers = DB::table('users')
    ->where('last_seen_at', '>=', $onlineThreshold)
    ->where('status', 'active')
    ->count();

echo "Users online (active status + last 5 min): {$onlineUsers}\n";

$twoMinThreshold = \Carbon\Carbon::now()->subMinutes(2);
$recentUsers = DB::table('users')
    ->where('last_seen_at', '>=', $twoMinThreshold)
    ->where('status', 'active')
    ->count();

echo "Users online now (active status + last 2 min): {$recentUsers}\n";
