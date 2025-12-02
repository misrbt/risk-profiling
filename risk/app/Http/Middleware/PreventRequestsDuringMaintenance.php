<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance as Middleware;
use Illuminate\Http\Request;

class PreventRequestsDuringMaintenance extends Middleware
{
    /**
     * The URIs that should be reachable while maintenance mode is enabled.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if ($this->app->isDownForMaintenance()) {
            // Allow developers to access during maintenance
            if ($this->shouldBypassMaintenance($request)) {
                return $next($request);
            }
        }

        return parent::handle($request, $next);
    }

    /**
     * Determine if the request should bypass maintenance mode.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function shouldBypassMaintenance(Request $request): bool
    {
        // Check if IP is whitelisted
        $allowedIps = config('app.maintenance_allowed_ips', []);
        if (in_array($request->ip(), $allowedIps)) {
            return true;
        }

        // Check if user is authenticated and has developer role
        if ($request->user() && $request->user()->hasRole('developer')) {
            return true;
        }

        // Check if secret token is provided
        $secret = config('app.maintenance_secret');
        if ($secret && $request->query('secret') === $secret) {
            return true;
        }

        return false;
    }
}
