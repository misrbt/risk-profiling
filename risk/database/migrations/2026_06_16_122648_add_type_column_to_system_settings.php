<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * create_system_settings_table declares a "type" column but this
     * database's table predates that edit and never got it - every write
     * through SystemSetting::setValue() fails without it.
     */
    public function up(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('system_settings', 'type')) {
                $table->string('type')->default('string')->after('value');
            }
        });
    }

    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
