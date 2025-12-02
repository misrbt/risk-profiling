<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if system_settings table exists
        if (!Schema::hasTable('system_settings')) {
            return;
        }

        // Add password expiration settings
        DB::table('system_settings')->insert([
            [
                'group' => 'security',
                'key' => 'password_expiration_enabled',
                'value' => json_encode(false),
                'type' => 'boolean',
                'description' => 'Enable password expiration policy',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'group' => 'security',
                'key' => 'password_expiration_months',
                'value' => json_encode(3),
                'type' => 'number',
                'description' => 'Number of months until password expires',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'group' => 'security',
                'key' => 'password_expiration_roles',
                'value' => json_encode(['Manager', 'Audit', 'Compliance', 'User']),
                'type' => 'json',
                'description' => 'Roles affected by password expiration (Admin is always excluded)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('system_settings')
            ->where('group', 'security')
            ->whereIn('key', ['password_expiration_enabled', 'password_expiration_months', 'password_expiration_roles'])
            ->delete();
    }
};
