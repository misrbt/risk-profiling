<?php

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResetMfaTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        $admin = User::factory()->create();
        $role = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $admin->roles()->attach($role);

        return $admin;
    }

    public function test_admin_can_reset_mfa_for_another_user(): void
    {
        $admin = $this->makeAdmin();

        $target = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_secret' => encrypt('test-secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
            'two_factor_confirmed_at' => now(),
        ]);
        $target->createToken('test-token');

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$target->id}/reset-mfa");

        $response->assertOk();
        $response->assertJson(['success' => true]);
        $response->assertJsonPath('data.two_factor_enabled', false);

        $target->refresh();
        $this->assertFalse($target->two_factor_enabled);
        $this->assertNull($target->two_factor_secret);
        $this->assertNull($target->two_factor_recovery_codes);
        $this->assertNull($target->two_factor_confirmed_at);
        $this->assertSame(0, $target->tokens()->count());

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'mfa_reset',
            'resource_type' => 'users',
            'resource_id' => $target->id,
            'user_id' => $admin->id,
        ]);
    }

    public function test_non_admin_cannot_reset_their_own_mfa(): void
    {
        $user = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_secret' => encrypt('test-secret'),
        ]);

        $response = $this->actingAs($user)->postJson("/api/admin/users/{$user->id}/reset-mfa");

        $response->assertStatus(422);
        $user->refresh();
        $this->assertTrue($user->two_factor_enabled);
    }

    public function test_admin_can_reset_their_own_mfa(): void
    {
        $admin = $this->makeAdmin();
        $admin->update([
            'two_factor_enabled' => true,
            'two_factor_secret' => encrypt('test-secret'),
        ]);
        $admin->createToken('test-token');

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$admin->id}/reset-mfa");

        $response->assertOk();
        $admin->refresh();
        $this->assertFalse($admin->two_factor_enabled);
        $this->assertSame(0, $admin->tokens()->count());
    }

    public function test_resetting_mfa_for_user_without_mfa_enabled_is_idempotent(): void
    {
        $admin = $this->makeAdmin();
        $target = User::factory()->create(['two_factor_enabled' => false]);

        $response = $this->actingAs($admin)->postJson("/api/admin/users/{$target->id}/reset-mfa");

        $response->assertOk();
        $response->assertJson(['success' => true]);
    }

    public function test_non_admin_cannot_reset_another_users_mfa(): void
    {
        $nonAdmin = User::factory()->create();

        $target = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_secret' => encrypt('test-secret'),
        ]);

        $response = $this->actingAs($nonAdmin)->postJson("/api/admin/users/{$target->id}/reset-mfa");

        $response->assertStatus(403);

        $target->refresh();
        $this->assertTrue($target->two_factor_enabled);
    }
}
