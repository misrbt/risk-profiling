<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Current database: " . DB::connection()->getDatabaseName() . "\n";
echo "Checking if last_seen_at column exists...\n";

$exists = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_seen_at'");

if (empty($exists)) {
    echo "Column does NOT exist. Adding it now...\n";
    DB::statement("ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP NULL");
    echo "Column added successfully!\n";
} else {
    echo "Column already exists!\n";
}

// Verify again
$verify = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_seen_at'");
echo "Verification: " . (empty($verify) ? "Column NOT found" : "Column EXISTS") . "\n";

// Test a query
try {
    $count = DB::table('users')->whereNotNull('last_seen_at')->count();
    echo "Success! Query works. Found $count users with last_seen_at set.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
