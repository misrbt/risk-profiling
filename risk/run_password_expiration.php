<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Adding password expiration settings...\n";

try {
    DB::statement("
        INSERT INTO system_settings (group_name, key, value, type, description, created_at, updated_at)
        VALUES
        ('security', 'password_expiration_enabled', 'false', 'boolean', 'Enable password expiration policy', NOW(), NOW()),
        ('security', 'password_expiration_months', '3', 'number', 'Number of months until password expires', NOW(), NOW()),
        ('security', 'password_expiration_roles', '[\"Manager\",\"Audit\",\"Compliance\",\"User\"]', 'json', 'Roles affected by password expiration (Admin is always excluded)', NOW(), NOW())
        ON CONFLICT (group_name, key) DO NOTHING
    ");

    echo "✓ Password expiration settings added successfully!\n";

    // Mark migration as run
    DB::table('migrations')->insert([
        'migration' => '2025_10_11_165440_add_password_expiration_to_system_settings',
        'batch' => DB::table('migrations')->max('batch') + 1
    ]);

    echo "✓ Migration marked as complete!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
