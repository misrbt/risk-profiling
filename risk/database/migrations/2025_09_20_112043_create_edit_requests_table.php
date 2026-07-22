<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('edit_requests')) {
            return;
        }

        Schema::create('edit_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // User making the request
            $table->foreignId('customer_id')->constrained()->onDelete('cascade'); // Customer to be edited
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null'); // Manager who will handle the request
            $table->enum('status', ['pending', 'approved', 'disapproved'])->default('pending');
            $table->text('reason')->nullable(); // Optional reason for the request
            $table->text('manager_notes')->nullable(); // Notes from manager when approving/disapproving
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('expires_at')->nullable(); // When the approval expires
            $table->timestamps();

            // Indexes for better query performance
            $table->index(['user_id', 'customer_id']);
            $table->index(['manager_id', 'status']);
            $table->index('status');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('edit_requests');
    }
};
