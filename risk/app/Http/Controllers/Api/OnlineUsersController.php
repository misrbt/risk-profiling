<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OnlineUsersController extends Controller
{
    /**
     * Update user's last seen timestamp (heartbeat)
     */
    public function heartbeat(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            $user->update(['last_seen_at' => now()]);

            return response()->json([
                'success' => true,
                'last_seen_at' => $user->last_seen_at,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'User not authenticated',
        ], 401);
    }

    /**
     * Get list of online users (last seen within 5 minutes)
     */
    public function index(Request $request)
    {
        // Users who were active in the last 5 minutes are considered "online"
        $onlineThreshold = Carbon::now()->subMinutes(5);

        $users = User::with('roles')
            ->whereNotNull('last_seen_at')
            ->where('last_seen_at', '>=', $onlineThreshold)
            // Remove status filter to show all users regardless of status
            ->orderBy('last_seen_at', 'desc')
            ->get()
            ->map(function ($user) {
                // Ensure last_seen_at is a Carbon instance
                $lastSeenAt = $user->last_seen_at ? Carbon::parse($user->last_seen_at) : null;

                return [
                    'id' => $user->id,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'email' => $user->email,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'last_seen_at' => $lastSeenAt?->toISOString(),
                    'last_seen_human' => $lastSeenAt?->diffForHumans(),
                    'is_online' => $lastSeenAt?->greaterThan(Carbon::now()->subMinutes(2)) ?? false,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users,
                'total_online' => $users->where('is_online', true)->count(),
                'total_recently_active' => $users->count(),
            ],
        ]);
    }

    /**
     * Get online status of a specific user
     */
    public function show($userId)
    {
        $user = User::with('roles')->find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        $onlineThreshold = Carbon::now()->subMinutes(2);
        $lastSeenAt = $user->last_seen_at ? Carbon::parse($user->last_seen_at) : null;
        $isOnline = $lastSeenAt && $lastSeenAt->greaterThan($onlineThreshold);

        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $user->id,
                'name' => $user->first_name . ' ' . $user->last_name,
                'is_online' => $isOnline,
                'last_seen_at' => $lastSeenAt?->toISOString(),
                'last_seen_human' => $lastSeenAt?->diffForHumans(),
            ],
        ]);
    }
}
