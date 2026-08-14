<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Services\TwoFactorPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TwoFactorPolicyTest extends TestCase
{
    use RefreshDatabase;

    private function enableTwoFactorForRole(string $roleSlug): void
    {
        DB::table('system_settings')->updateOrInsert(
            ['group' => 'security', 'key' => 'two_factor_enabled'],
            ['value' => json_encode(true), 'type' => 'boolean', 'created_at' => now(), 'updated_at' => now()]
        );

        DB::table('system_settings')->updateOrInsert(
            ['group' => 'security', 'key' => 'two_factor_roles'],
            ['value' => json_encode([$roleSlug]), 'type' => 'json', 'created_at' => now(), 'updated_at' => now()]
        );
    }

    public function test_two_factor_is_required_for_a_user_whose_role_is_covered_by_policy(): void
    {
        $this->enableTwoFactorForRole('users');

        $role = Role::create(['name' => 'Users', 'slug' => 'users']);
        $user = User::factory()->create();
        $user->roles()->attach($role);

        $this->assertTrue(TwoFactorPolicy::isRequiredForUser($user));
    }

    public function test_two_factor_exempt_user_is_not_required_even_if_role_is_covered_by_policy(): void
    {
        $this->enableTwoFactorForRole('users');

        $role = Role::create(['name' => 'Users', 'slug' => 'users']);
        $user = User::factory()->create(['two_factor_exempt' => true]);
        $user->roles()->attach($role);

        $this->assertFalse(TwoFactorPolicy::isRequiredForUser($user));
    }
}
