<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SelectionConfigController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'status']);
        // Permission checks are handled at the route level
        // No need for additional role middleware here
    }

    /**
     * Get selection configuration
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get selection config from system settings
            $selectionConfig = SystemSetting::where('key', 'selection_configuration')
                ->where('group', 'risk_settings')
                ->first();

            $config = $selectionConfig ? json_decode($selectionConfig->value, true) : [];

            return response()->json([
                'success' => true,
                'data' => $config,
                'message' => 'Selection configuration retrieved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve selection configuration',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store selection configuration
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'config' => 'required|array',
            ]);

            // Store or update selection config in system settings
            $selectionConfig = SystemSetting::updateOrCreate([
                'key' => 'selection_configuration',
                'group' => 'risk_settings',
            ], [
                'value' => json_encode($validated['config']),
                'description' => 'Selection type configuration for risk criteria (single/multiple selection)',
                'is_public' => false,
            ]);

            return response()->json([
                'success' => true,
                'data' => json_decode($selectionConfig->value, true),
                'message' => 'Selection configuration saved successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save selection configuration',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update selection configuration (alias for store)
     */
    public function update(Request $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Store risk thresholds configuration
     */
    public function storeRiskThresholds(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'thresholds' => 'required|array',
                'thresholds.low_threshold' => 'required|integer|min:1|max:100',
                'thresholds.moderate_threshold' => 'required|integer|min:2|max:100',
                'thresholds.high_threshold' => 'required|integer|min:3|max:100',
            ]);

            // Validate threshold order
            $thresholds = $validated['thresholds'];
            if ($thresholds['low_threshold'] >= $thresholds['moderate_threshold'] ||
                $thresholds['moderate_threshold'] >= $thresholds['high_threshold']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid threshold configuration. Each threshold must be higher than the previous one.',
                ], 422);
            }

            // Store risk thresholds in system settings
            $riskThresholds = SystemSetting::updateOrCreate([
                'key' => 'risk_thresholds',
                'group' => 'risk_settings',
            ], [
                'value' => json_encode($thresholds),
                'description' => 'Risk level threshold configuration (Low, Moderate, High)',
                'is_public' => false,
            ]);

            return response()->json([
                'success' => true,
                'data' => json_decode($riskThresholds->value, true),
                'message' => 'Risk thresholds saved successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save risk thresholds',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
