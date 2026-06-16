<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Only applies on databases where audit_logs was created from an older
     * version of create_audit_logs_table.php (before it declared
     * resource_type/resource_id/session_id). A fresh install already has
     * the right columns, so every step here is guarded to stay a no-op there.
     */
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (Schema::hasColumn('audit_logs', 'auditable_type') && ! Schema::hasColumn('audit_logs', 'resource_type')) {
                $table->renameColumn('auditable_type', 'resource_type');
            }

            if (Schema::hasColumn('audit_logs', 'auditable_id') && ! Schema::hasColumn('audit_logs', 'resource_id')) {
                $table->renameColumn('auditable_id', 'resource_id');
            }

            if (! Schema::hasColumn('audit_logs', 'session_id')) {
                $table->string('session_id')->nullable()->after('user_agent');
            }
        });
    }

    public function down(): void
    {
        // Intentionally left as a no-op: up() only ever changes a legacy
        // schema to match the canonical one, there is nothing to revert to.
    }
};
