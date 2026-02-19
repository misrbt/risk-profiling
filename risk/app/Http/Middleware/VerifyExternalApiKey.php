<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyExternalApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = config('services.external_api.key');

        if (empty($apiKey) || $request->header('X-Api-Key') !== $apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Invalid or missing API key.',
            ], 401);
        }

        return $next($request);
    }
}
