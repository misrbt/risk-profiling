<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class CentralAuth
{
    protected array $except = [
        'api/v1/auth/login',
        'api/v1/auth/register',
        'api/v1/auth/forgot-password',
        'api/v1/auth/validate-reset-token',
        'api/v1/auth/reset-password',
        'api/v1/branches/dropdown',
        'api/v1/maintenance/status',
        'up',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        foreach ($this->except as $path) {
            if ($request->is($path) || $request->is("*/{$path}")) {
                return $next($request);
            }
        }

        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        try {
            $authUrl = config('services.central_auth.url', 'http://127.0.0.1:8001/api');

            $response = Http::timeout(10)
                ->withToken($token)
                ->get("{$authUrl}/auth/validate-token", [
                    'system_slug' => 'risk_profiling',
                ]);

            if (!$response->ok() || !$response->json('valid')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $data = $response->json();
            $access = $data['access'] ?? null;

            $request->merge([
                'auth_user' => $data['user'],
                'auth_access' => $access,
            ]);

            // Find or create local user
            $user = \App\Models\User::where('email', $data['user']['email'])->first();
            if (!$user) {
                $nameParts = explode(' ', $data['user']['name'], 2);
                $user = \App\Models\User::create([
                    'first_name' => $nameParts[0] ?? '',
                    'last_name' => $nameParts[1] ?? '',
                    'username' => $data['user']['username'],
                    'email' => $data['user']['email'],
                    'password' => bcrypt(str()->random(32)),
                    'status' => 'active',
                ]);
            }

            // Sync role + permissions from central auth so hasRole()/hasPermission() work
            if ($access && !empty($access['role'])) {
                $this->syncRoleAndPermissions($user, $access['role'], $access['permissions'] ?? []);
            }

            auth()->setUser($user);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Authentication service unavailable.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 503);
        }

        return $next($request);
    }

    private function syncRoleAndPermissions($user, string $roleName, array $permissions): void
    {
        // Use cache to avoid syncing on every single request
        $cacheKey = "auth_sync:{$user->id}:{$roleName}";
        if (Cache::has($cacheKey)) {
            return;
        }

        // 1. Ensure role exists locally
        $role = DB::table('roles')->where('slug', $roleName)->first();
        if (!$role) {
            $roleId = DB::table('roles')->insertGetId([
                'name' => ucfirst($roleName),
                'slug' => $roleName,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $roleId = $role->id;
        }

        // 2. Assign role to user
        $hasRole = DB::table('role_user')
            ->where('user_id', $user->id)
            ->where('role_id', $roleId)
            ->exists();

        if (!$hasRole) {
            DB::table('role_user')->where('user_id', $user->id)->delete();
            DB::table('role_user')->insert([
                'user_id' => $user->id,
                'role_id' => $roleId,
            ]);
        }

        // 3. Ensure all permissions exist locally and are linked to the role
        $permissionIds = [];
        foreach ($permissions as $permSlug) {
            $perm = DB::table('permissions')->where('slug', $permSlug)->first();
            if (!$perm) {
                $permId = DB::table('permissions')->insertGetId([
                    'name' => ucwords(str_replace('-', ' ', $permSlug)),
                    'slug' => $permSlug,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $permId = $perm->id;
            }
            $permissionIds[] = $permId;
        }

        // 4. Sync permission_role pivot
        DB::table('permission_role')->where('role_id', $roleId)->delete();
        $inserts = array_map(fn ($permId) => [
            'role_id' => $roleId,
            'permission_id' => $permId,
        ], $permissionIds);

        if (!empty($inserts)) {
            DB::table('permission_role')->insert($inserts);
        }

        // Cache for 5 minutes to avoid re-syncing every request
        Cache::put($cacheKey, true, 300);
    }
}
