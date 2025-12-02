<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class TwoFactorAuthController extends Controller
{
    /**
     * Enable 2FA for the authenticated user
     * Generate secret and QR code
     */
    public function enable(Request $request)
    {
        try {
            $user = $request->user();

            // Check if user's role requires 2FA
            if (!$this->isUserRoleRequired2FA($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Two-factor authentication is not required for your role'
                ], 403);
            }

            $google2fa = new Google2FA();
            $secret = $google2fa->generateSecretKey();

            // Generate QR code URL
            $companyName = config('app.name', 'Risk Profiling System');
            $qrCodeUrl = $google2fa->getQRCodeUrl(
                $companyName,
                $user->email,
                $secret
            );

            // Generate SVG QR code
            $renderer = new ImageRenderer(
                new RendererStyle(200),
                new SvgImageBackEnd()
            );
            $writer = new Writer($renderer);
            $qrCodeSvg = $writer->writeString($qrCodeUrl);

            // Store the secret temporarily (not confirmed yet)
            $user->two_factor_secret = encrypt($secret);
            $user->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'secret' => $secret,
                    'qr_code_svg' => $qrCodeSvg,
                    'qr_code_url' => $qrCodeUrl,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('2FA Enable Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to enable two-factor authentication'
            ], 500);
        }
    }

    /**
     * Confirm 2FA setup by verifying the code
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        try {
            $user = $request->user();

            if (!$user->two_factor_secret) {
                return response()->json([
                    'success' => false,
                    'message' => 'Two-factor authentication is not set up'
                ], 400);
            }

            $google2fa = new Google2FA();
            $secret = decrypt($user->two_factor_secret);

            // Verify the code
            $valid = $google2fa->verifyKey($secret, $request->code);

            if (!$valid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification code'
                ], 400);
            }

            // Generate recovery codes
            $recoveryCodes = $this->generateRecoveryCodes();

            // Confirm 2FA
            $user->two_factor_enabled = true;
            $user->two_factor_confirmed_at = now();
            $user->two_factor_recovery_codes = encrypt(json_encode($recoveryCodes));
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Two-factor authentication enabled successfully',
                'data' => [
                    'recovery_codes' => $recoveryCodes
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('2FA Confirm Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm two-factor authentication'
            ], 500);
        }
    }

    /**
     * Verify 2FA code during login
     */
    public function verify(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'code' => 'required|string',
        ]);

        try {
            $user = \App\Models\User::find($request->user_id);

            if (!$user || !$user->two_factor_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Two-factor authentication is not enabled'
                ], 400);
            }

            $google2fa = new Google2FA();
            $secret = decrypt($user->two_factor_secret);

            // Check if it's a recovery code
            if (strlen($request->code) > 6) {
                return $this->verifyRecoveryCode($user, $request->code);
            }

            // Verify the TOTP code
            $valid = $google2fa->verifyKey($secret, $request->code, 2); // 2 = window of 2 * 30 seconds

            if (!$valid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification code'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Code verified successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('2FA Verify Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify code'
            ], 500);
        }
    }

    /**
     * Disable 2FA for the authenticated user
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        try {
            $user = $request->user();

            // Verify password
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid password'
                ], 400);
            }

            // Disable 2FA
            $user->two_factor_enabled = false;
            $user->two_factor_secret = null;
            $user->two_factor_recovery_codes = null;
            $user->two_factor_confirmed_at = null;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Two-factor authentication disabled successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('2FA Disable Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to disable two-factor authentication'
            ], 500);
        }
    }

    /**
     * Get 2FA status for the authenticated user
     */
    public function status(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => $user->two_factor_enabled,
                'confirmed_at' => $user->two_factor_confirmed_at,
                'is_required' => $this->isUserRoleRequired2FA($user),
            ]
        ]);
    }

    /**
     * Regenerate recovery codes
     */
    public function regenerateRecoveryCodes(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        try {
            $user = $request->user();

            // Verify password
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid password'
                ], 400);
            }

            if (!$user->two_factor_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Two-factor authentication is not enabled'
                ], 400);
            }

            // Generate new recovery codes
            $recoveryCodes = $this->generateRecoveryCodes();
            $user->two_factor_recovery_codes = encrypt(json_encode($recoveryCodes));
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Recovery codes regenerated successfully',
                'data' => [
                    'recovery_codes' => $recoveryCodes
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('2FA Regenerate Recovery Codes Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to regenerate recovery codes'
            ], 500);
        }
    }

    /**
     * Generate recovery codes
     */
    private function generateRecoveryCodes()
    {
        $codes = [];
        for ($i = 0; $i < 8; $i++) {
            $codes[] = strtoupper(substr(bin2hex(random_bytes(5)), 0, 10));
        }
        return $codes;
    }

    /**
     * Verify recovery code
     */
    private function verifyRecoveryCode($user, $code)
    {
        try {
            $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true);

            if (!in_array(strtoupper($code), $recoveryCodes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid recovery code'
                ], 400);
            }

            // Remove used recovery code
            $recoveryCodes = array_diff($recoveryCodes, [strtoupper($code)]);
            $user->two_factor_recovery_codes = encrypt(json_encode(array_values($recoveryCodes)));
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Recovery code verified successfully',
                'data' => [
                    'remaining_codes' => count($recoveryCodes)
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('2FA Verify Recovery Code Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify recovery code'
            ], 500);
        }
    }

    /**
     * Check if user's role requires 2FA
     */
    private function isUserRoleRequired2FA($user)
    {
        try {
            // Admin is never required to use 2FA
            if ($user->hasRole('admin')) {
                return false;
            }

            // Check if system_settings table exists
            if (!\Schema::hasTable('system_settings')) {
                return false;
            }

            // Check if 2FA is enabled globally
            $twoFactorEnabled = \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'two_factor_enabled')
                ->value('value');

            if ($twoFactorEnabled !== 'true' && $twoFactorEnabled !== true) {
                return false;
            }

            // Get required roles
            $requiredRolesJson = \DB::table('system_settings')
                ->where('group', 'security')
                ->where('key', 'two_factor_roles')
                ->value('value');

            $requiredRoles = $requiredRolesJson ? json_decode($requiredRolesJson, true) : [];

            // Check if user has any required role
            $userRoles = $user->roles->pluck('name')->toArray();
            return !empty(array_intersect($userRoles, $requiredRoles));
        } catch (\Exception $e) {
            \Log::error('2FA Role Check Error: ' . $e->getMessage());
            return false;
        }
    }
}
