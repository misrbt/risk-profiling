<?php

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TwoFactorExemptionTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        $admin = User::factory()->create();
        $role = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $admin->roles()->attach($role);

        return $admin;
    }

    public function test_admin_can_exempt_a_user_from_two_factor(): void
    {
        $admin = $this->makeAdmin();

        $target = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_secret' => encrypt('test-secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
            'two_factor_confirmed_at' => now(),
        ]);
        $target->createToken('test-token');

        $response = $this->actingAs($admin)->putJson(
            "/api/admin/users/{$target->id}/two-factor-exemption",
            ['two_factor_exempt' => true]
        );

        $response->assertOk();
        $response->assertJsonPath('data.two_factor_exempt', true);
        $response->assertJsonPath('data.two_factor_enabled', false);

        $target->refresh();
        $this->assertTrue($target->two_factor_exempt);
        $this->assertFalse($target->two_factor_enabled);
        $this->assertNull($target->two_factor_secret);
        $this->assertSame(0, $target->tokens()->count());

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'two_factor_exempt_updated',
            'resource_type' => 'users',
            'resource_id' => $target->id,
            'user_id' => $admin->id,
        ]);
    }

    public function test_admin_can_remove_a_users_two_factor_exemption(): void
    {
        $admin = $this->makeAdmin();
        $target = User::factory()->create(['two_factor_exempt' => true]);

        $response = $this->actingAs($admin)->putJson(
            "/api/admin/users/{$target->id}/two-factor-exemption",
            ['two_factor_exempt' => false]
        );

        $response->assertOk();
        $target->refresh();
        $this->assertFalse($target->two_factor_exempt);
    }

    public function test_non_admin_cannot_change_two_factor_exemption(): void
    {
        $nonAdmin = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($nonAdmin)->putJson(
            "/api/admin/users/{$target->id}/two-factor-exemption",
            ['two_factor_exempt' => true]
        );

        $response->assertStatus(403);
        $target->refresh();
        $this->assertFalse($target->two_factor_exempt);
    }
}
