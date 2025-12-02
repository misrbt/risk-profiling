<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");

echo "Columns in users table:\n";
foreach ($columns as $col) {
    echo "- " . $col->column_name . "\n";
}

$hasLastSeen = collect($columns)->pluck('column_name')->contains('last_seen_at');
echo "\nlast_seen_at exists: " . ($hasLastSeen ? 'YES' : 'NO') . "\n";
