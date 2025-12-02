<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$count = DB::selectOne("SELECT COUNT(*) as total FROM users");
echo "Total users in database: {$count->total}\n";

if ($count->total > 0) {
    echo "\nFirst 5 users:\n";
    $users = DB::select("SELECT id, email, status, last_seen_at FROM users LIMIT 5");
    foreach ($users as $user) {
        echo "ID: {$user->id}, Email: {$user->email}, Status: {$user->status}, Last Seen: " . ($user->last_seen_at ?? 'NULL') . "\n";
    }
}
