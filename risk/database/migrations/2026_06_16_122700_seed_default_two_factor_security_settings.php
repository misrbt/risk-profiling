<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The original two_factor settings migration silently no-op'd on this
     * environment (system_settings was empty), so seed sane defaults here,
     * keyed by role slug rather than display name, with no role excluded.
     */
    public function up(): void
    {
        if (! Schema::hasTable('system_settings')) {
            return;
        }

        $roleSlugs = DB::table('roles')->pluck('slug')->all();
        if (empty($roleSlugs)) {
            $roleSlugs = ['admin', 'manager', 'compliance', 'audit', 'users'];
        }

        if (! DB::table('system_settings')->where('group', 'security')->where('key', 'two_factor_enabled')->exists()) {
            DB::table('system_settings')->insert([
                'group' => 'security',
                'key' => 'two_factor_enabled',
                'value' => json_encode(false),
                'type' => 'boolean',
                'description' => 'Enable two-factor authentication policy',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (! DB::table('system_settings')->where('group', 'security')->where('key', 'two_factor_roles')->exists()) {
            DB::table('system_settings')->insert([
                'group' => 'security',
                'key' => 'two_factor_roles',
                'value' => json_encode($roleSlugs),
                'type' => 'json',
                'description' => 'Role slugs required to use two-factor authentication. No role is excluded.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('system_settings')
            ->where('group', 'security')
            ->whereIn('key', ['two_factor_enabled', 'two_factor_roles'])
            ->delete();
    }
};
