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

        // Add two-factor authentication settings
        DB::table('system_settings')->insert([
            [
                'group' => 'security',
                'key' => 'two_factor_enabled',
                'value' => json_encode(false),
                'type' => 'boolean',
                'description' => 'Enable two-factor authentication policy',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'group' => 'security',
                'key' => 'two_factor_roles',
                'value' => json_encode(['Manager', 'Audit', 'Compliance', 'User']),
                'type' => 'json',
                'description' => 'Roles required to use two-factor authentication (Admin is always excluded)',
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
            ->whereIn('key', ['two_factor_enabled', 'two_factor_roles'])
            ->delete();
    }
};
