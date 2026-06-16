<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\IssuesAuthSession;
use App\Http\Controllers\Controller;
use App\Services\TwoFactorPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class TwoFactorAuthController extends Controller
{
    use IssuesAuthSession;

    /**
     * Enable 2FA for the authenticated user
     * Generate secret and QR code
     */
    public function enable(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->two_factor_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Two-factor authentication is already enabled'
                ], 400);
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
                return $this->verifyRecoveryCode($user, $request->code, $request);
            }

            // Verify the TOTP code
            $valid = $google2fa->verifyKey($secret, $request->code, 2); // 2 = window of 2 * 30 seconds

            if (!$valid) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification code'
                ], 400);
            }

            $data = $this->issueAuthSession($user, $request, 'two_factor');
            $data['two_factor_required'] = false;
            $data['two_factor_enabled'] = true;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => $data,
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
                'is_required' => TwoFactorPolicy::isRequiredForUser($user),
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
     * Verify recovery code and complete the pending login
     */
    private function verifyRecoveryCode($user, $code, Request $request)
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

            $data = $this->issueAuthSession($user, $request, 'two_factor_recovery_code');
            $data['two_factor_required'] = false;
            $data['two_factor_enabled'] = true;
            $data['remaining_codes'] = count($recoveryCodes);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            \Log::error('2FA Verify Recovery Code Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify recovery code'
            ], 500);
        }
    }
}
