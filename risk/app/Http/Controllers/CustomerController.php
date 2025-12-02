<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Criteria;
use App\Models\Customer;
use App\Models\EditRequest;
use App\Models\Options;
use App\Models\SystemSetting;
use App\Models\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function getCriteria()
    {
        // Load criteria with their options
        $criteria = Criteria::with('options')->get();

        return response()->json($criteria);
    }

    public function index()
    {
        try {
            // Log activity (wrap in try-catch to prevent blocking)
            try {
                UserActivity::log(
                    'view_customers',
                    'Viewed customer list',
                    null,
                    null,
                    ['action' => 'list_view']
                );
            } catch (\Exception $e) {
                \Log::warning('Failed to log user activity: '.$e->getMessage());
            }

            // Audit log for viewing customers (wrap in try-catch to prevent blocking)
            try {
                AuditLog::log(
                    'viewed',
                    'customers',
                    null,
                    [],
                    ['action' => 'list_view']
                );
            } catch (\Exception $e) {
                \Log::warning('Failed to log audit: '.$e->getMessage());
            }

            $customers = Customer::with('selections')->get()->map(function ($customer) {
                // Convert to user's timezone or default to Asia/Manila (Philippine Standard Time)
                $userTimezone = config('app.user_timezone', 'Asia/Manila');
                // Use copy() to avoid modifying the original Carbon instance
                $createdAt = $customer->created_at->copy()->timezone($userTimezone);

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'created_at' => $createdAt->toIso8601String(),
                    'created_at_timestamp' => $createdAt->timestamp,
                    'date_created' => $createdAt->format('M d, Y'),
                    'time_created' => $createdAt->format('h:i A'),
                    'formatted_datetime' => $createdAt->format('M d, Y h:i A'),
                    'totalScore' => $customer->total_score,
                    'riskLevel' => $customer->risk_level,
                    'selections' => $customer->selections->map(function ($selection) {
                        return [
                            'criteriaLabel' => $selection->criteria_label,
                            'optionLabel' => $selection->option_label,
                            'points' => $selection->points,
                        ];
                    }),
                ];
            });

            return response()->json($customers);
        } catch (\Exception $e) {
            \Log::error('CustomerController@index error: '.$e->getMessage());
            \Log::error('Stack trace: '.$e->getTraceAsString());

            return response()->json([
                'error' => 'Failed to fetch customers',
                'message' => $e->getMessage(),
                'debug' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Resolve option selections into detailed info
     *
     * @param  array  $responses  Option IDs array
     * @return array
     */
    public function resolveSelections(array $responses)
    {
        $ids = collect($responses)->map(fn ($id) => (int) $id)->filter()->values();
        if ($ids->isEmpty()) {
            return [];
        }

        // Load options with their criteria
        $options = Options::with('criteria')->whereIn('id', $ids)->get();

        // Group options by criteria
        $grouped = [];

        foreach ($options as $opt) {
            $criteriaId = $opt->criteria->id;
            $criteriaLabel = $opt->criteria->label;

            if (! isset($grouped[$criteriaId])) {
                $grouped[$criteriaId] = [
                    'criteriaKey' => $criteriaId,
                    'criteriaLabel' => $criteriaLabel,
                    'options' => [],
                ];
            }

            $grouped[$criteriaId]['options'][] = [
                'optionLabel' => $opt->label,
                'points' => $opt->points,
            ];
        }

        // Return as indexed array
        return array_values($grouped);
    }

    /**
     * Create a new customer with risk profile
     */
    public function createCustomer(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'responses' => 'required|array',
            'responses.*' => 'integer|exists:options,id',
            'branch_id' => 'nullable|integer|exists:branch,id',
        ]);

        // If branch_id is not provided, use the authenticated user's branch
        if (! isset($data['branch_id']) || ! $data['branch_id']) {
            $user = Auth::user();
            if ($user && $user->branch_id) {
                $data['branch_id'] = $user->branch_id;
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Branch information is required. Please contact administrator.',
                ], 422);
            }
        }

        $responses = $data['responses'];

        $totalScore = 0;
        foreach ($responses as $id) {
            $option = Options::find($id);
            $totalScore += $option ? $option->points : 0;
        }

        $riskLevel = $this->calculateRiskLevel($totalScore);

        // Make sure responses stored as JSON array in DB
        $customer = Customer::create([
            'name' => $data['name'],
            'responses' => $responses,
            'total_score' => $totalScore,
            'risk_level' => $riskLevel,
            'branch_id' => $data['branch_id'],
            'created_by' => Auth::id(),
        ]);

        // Log activity
        UserActivity::log(
            'create_risk_assessment',
            "Created risk assessment for customer '{$customer->name}' with {$riskLevel}",
            'Customer',
            $customer->id,
            [
                'customer_name' => $customer->name,
                'total_score' => $totalScore,
                'risk_level' => $riskLevel,
                'responses_count' => count($responses),
            ]
        );

        // Audit log for customer creation
        AuditLog::log(
            'created',
            'customers',
            $customer->id,
            [],
            [
                'customer_name' => $customer->name,
                'total_score' => $totalScore,
                'risk_level' => $riskLevel,
                'branch_id' => $data['branch_id'],
                'responses_count' => count($responses),
            ]
        );

        return response()->json($customer);
    }

    /**
     * Update existing customer's risk assessment (Admin and Manager access)
     */
    public function updateCustomer(Request $request, $id)
    {
        $user = Auth::user();
        $viaApprovedAccess = false;
        $approvedRequest = null;

        // Check if regular user has approved edit access for this specific customer
        if ($user->hasRole('users')) {
            $approvedRequest = EditRequest::where('user_id', $user->id)
                ->where('customer_id', $id)
                ->where('status', 'approved')
                ->where('expires_at', '>', now())
                ->first();

            if ($approvedRequest) {
                // User has approved access - allow access to this specific customer
                $customer = Customer::findOrFail($id);
                $viaApprovedAccess = true;
            } else {
                // No approved access - apply normal branch filtering
                $query = Customer::query();
                $query = $this->applyBranchFilter($query);
                $customer = $query->findOrFail($id);
            }
        } else {
            // For admins and managers - apply normal branch filtering
            $query = Customer::query();
            $query = $this->applyBranchFilter($query);
            $customer = $query->findOrFail($id);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'responses' => 'required|array',
            'responses.*' => 'integer|exists:options,id',
        ]);

        $responses = $data['responses'];
        $oldData = [
            'name' => $customer->name,
            'total_score' => $customer->total_score,
            'risk_level' => $customer->risk_level,
            'responses' => $customer->responses,
        ];

        // Calculate new total score
        $totalScore = 0;
        foreach ($responses as $id) {
            $option = Options::find($id);
            $totalScore += $option ? $option->points : 0;
        }

        // Calculate new risk level
        $riskLevel = $this->calculateRiskLevel($totalScore);

        // Update customer
        $customer->update([
            'name' => $data['name'],
            'responses' => $responses,
            'total_score' => $totalScore,
            'risk_level' => $riskLevel,
        ]);

        $newData = [
            'name' => $customer->name,
            'total_score' => $customer->total_score,
            'risk_level' => $customer->risk_level,
            'responses' => $customer->responses,
        ];

        // Log activity
        UserActivity::log(
            'update_risk_assessment',
            "Updated risk assessment for customer '{$customer->name}' - Risk level changed to {$riskLevel}".($viaApprovedAccess ? ' (via approved edit request)' : ''),
            'Customer',
            $customer->id,
            [
                'customer_name' => $customer->name,
                'old_risk_level' => $oldData['risk_level'],
                'new_risk_level' => $riskLevel,
                'old_total_score' => $oldData['total_score'],
                'new_total_score' => $totalScore,
                'responses_count' => count($responses),
                'via_approved_access' => $viaApprovedAccess,
                'edit_request_id' => $viaApprovedAccess ? $approvedRequest?->id : null,
            ]
        );

        // Audit log for customer update
        AuditLog::log(
            'updated',
            'customers',
            $customer->id,
            $oldData,
            $newData
        );

        return response()->json([
            'success' => true,
            'message' => 'Risk assessment updated successfully',
            'data' => $customer,
        ]);
    }

    /**
     * Get single customer for editing (Admin and Manager access)
     */
    public function show($id)
    {
        $user = Auth::user();

        // Check if regular user has approved edit access for this specific customer
        if ($user->hasRole('users')) {
            $approvedRequest = EditRequest::where('user_id', $user->id)
                ->where('customer_id', $id)
                ->where('status', 'approved')
                ->where('expires_at', '>', now())
                ->first();

            if ($approvedRequest) {
                // User has approved access - allow access to this specific customer
                $customer = Customer::findOrFail($id);
            } else {
                // No approved access - apply normal branch filtering
                $query = Customer::query();
                $query = $this->applyBranchFilter($query);
                $customer = $query->findOrFail($id);
            }
        } else {
            // For admins and managers - apply normal branch filtering
            $query = Customer::query();
            $query = $this->applyBranchFilter($query);
            $customer = $query->findOrFail($id);
        }

        // Get detailed selections with criteria information
        $selections = $this->resolveSelections($customer->responses);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'responses' => $customer->responses,
                'total_score' => $customer->total_score,
                'risk_level' => $customer->risk_level,
                'branch_id' => $customer->branch_id,
                'created_at' => $customer->created_at,
                'selections' => $selections,
            ],
        ]);
    }

    /**
     * Get all customers with resolved selections and filtering
     */
    public function getCustomers(Request $request)
    {
        try {
            // Build query with filters
            $query = Customer::query();

            // Apply branch filtering based on user role
            $query = $this->applyBranchFilter($query);

            // Date filtering
            if ($request->has('date_from') && $request->date_from) {
                $query->where('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->where('created_at', '<=', $request->date_to.' 23:59:59');
            }

            // Risk level filtering
            if ($request->has('risk_level') && $request->risk_level) {
                $query->where('risk_level', $request->risk_level);
            }

            // Search by name
            if ($request->has('search') && $request->search) {
                $query->where('name', 'LIKE', '%'.$request->search.'%');
            }

            // Get customers with ordering and optimized selection
            $customers = $query
                ->with(['createdBy' => function ($query) {
                    $query->select('id', 'first_name', 'middle_initial', 'last_name');
                }])
                ->select(['id', 'name', 'created_at', 'total_score', 'risk_level', 'branch_id', 'responses', 'created_by'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Handle empty customer list
            if ($customers->isEmpty()) {
                return response()->json([]);
            }

            // Optimize: Get all option IDs at once to reduce queries
            $allOptionIds = $customers->pluck('responses')->flatten()->unique()->filter();

            // Handle case where there are no responses
            if ($allOptionIds->isEmpty()) {
                return response()->json($customers->map(function ($customer) {
                    // Ensure created_at is a Carbon instance and convert to user timezone
                    $createdAt = $customer->created_at instanceof \Carbon\Carbon
                        ? $customer->created_at
                        : \Carbon\Carbon::parse($customer->created_at);

                    $userTimezone = config('app.user_timezone', 'Asia/Manila');
                    $createdAt = $createdAt->copy()->timezone($userTimezone);

                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'created_at' => $createdAt->format('Y-m-d H:i:s'),
                        'date_created' => $createdAt->format('M d, Y'),
                        'time_created' => $createdAt->format('h:i A'),
                        'totalScore' => $customer->total_score,
                        'riskLevel' => $customer->risk_level,
                        'branch_id' => $customer->branch_id,
                        'createdByName' => $customer->createdBy
                        ? trim(($customer->createdBy->first_name ?? '').' '.($customer->createdBy->middle_initial ? $customer->createdBy->middle_initial.'. ' : '').($customer->createdBy->last_name ?? ''))
                        : 'Unknown',
                        'selections' => [],
                    ];
                }));
            }

            // Single query to get all options with criteria
            $optionsWithCriteria = Options::with('criteria')
                ->whereIn('id', $allOptionIds)
                ->get()
                ->keyBy('id');

            $result = $customers->map(function ($customer) use ($optionsWithCriteria) {
                $responses = $customer->responses; // array of option IDs
                $customerOptions = collect($responses)
                    ->map(fn ($id) => $optionsWithCriteria->get($id))
                    ->filter(); // Remove null values

                // Group options by criteria
                $grouped = $customerOptions->groupBy(fn ($opt) => $opt->criteria->id)
                    ->map(function ($opts, $criteriaId) {
                        $criteriaCategory = $opts->first()->criteria->category ?? 'Unknown';

                        return [
                            'criteriaKey' => $criteriaId,
                            'criteriaCategory' => $criteriaCategory,
                            'options' => $opts->map(fn ($opt) => [
                                'optionLabel' => $opt->label,
                                'points' => $opt->points,
                            ])->values()->all(),
                        ];
                    })->values()->all();

                // Ensure created_at is a Carbon instance and convert to user timezone
                $createdAt = $customer->created_at instanceof \Carbon\Carbon
                    ? $customer->created_at
                    : \Carbon\Carbon::parse($customer->created_at);

                $userTimezone = config('app.user_timezone', 'Asia/Manila');
                $createdAt = $createdAt->copy()->timezone($userTimezone);

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'created_at' => $createdAt->format('Y-m-d H:i:s'),
                    'date_created' => $createdAt->format('M d, Y'),
                    'time_created' => $createdAt->format('h:i A'),
                    'totalScore' => $customer->total_score,
                    'riskLevel' => $customer->risk_level,
                    'branch_id' => $customer->branch_id,
                    'createdByName' => $customer->createdBy
                        ? trim(($customer->createdBy->first_name ?? '').' '.($customer->createdBy->middle_initial ? $customer->createdBy->middle_initial.'. ' : '').($customer->createdBy->last_name ?? ''))
                        : 'Unknown',
                    'selections' => $grouped,
                ];
            });

            return response()->json($result);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch customers',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get dashboard statistics and recent customers
     */
    public function getDashboardData()
    {
        // Build base query with branch filtering
        $baseQuery = $this->applyBranchFilter(Customer::query());

        // Get total customer count
        $totalCustomers = (clone $baseQuery)->count();

        // Get risk level distribution
        $riskStats = [
            'low' => (clone $baseQuery)->where('risk_level', 'LOW RISK')->count(),
            'moderate' => (clone $baseQuery)->where('risk_level', 'MODERATE RISK')->count(),
            'high' => (clone $baseQuery)->where('risk_level', 'HIGH RISK')->count(),
        ];

        // Get recent customers (last 10)
        $recentCustomers = (clone $baseQuery)->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($customer) {
                $createdAt = $customer->created_at instanceof \Carbon\Carbon
                    ? $customer->created_at
                    : \Carbon\Carbon::parse($customer->created_at);

                // Convert to user timezone
                $userTimezone = config('app.user_timezone', 'Asia/Manila');
                $createdAt = $createdAt->copy()->timezone($userTimezone);

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'created_at' => $createdAt->format('Y-m-d H:i:s'),
                    'date_created' => $createdAt->format('M d, Y'),
                    'time_created' => $createdAt->format('h:i A'),
                    'time_ago' => $createdAt->diffForHumans(),
                    'totalScore' => $customer->total_score,
                    'riskLevel' => $customer->risk_level,
                    'initials' => $this->getCustomerInitials($customer->name),
                ];
            });

        // Additional statistics
        $todayCount = (clone $baseQuery)->whereDate('created_at', today())->count();
        $thisWeekCount = (clone $baseQuery)->whereBetween('created_at', [
            now()->startOfWeek(),
            now()->endOfWeek(),
        ])->count();
        $thisMonthCount = (clone $baseQuery)->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'totalCustomers' => $totalCustomers,
            'riskStats' => $riskStats,
            'recentCustomers' => $recentCustomers,
            'additionalStats' => [
                'todayCount' => $todayCount,
                'thisWeekCount' => $thisWeekCount,
                'thisMonthCount' => $thisMonthCount,
            ],
        ]);
    }

    /**
     * Apply branch filtering based on user role
     */
    private function applyBranchFilter($query)
    {
        $user = Auth::user();

        if (! $user) {
            return $query;
        }

        try {
            // Load user roles if not already loaded to avoid lazy loading issues
            $user->load('roles');

            // For regular users, only show customers from their branch
            if ($user->hasRole('users') && $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            }

            // For managers, show customers based on their branch_id
            if ($user->hasRole('manager')) {
                if ($user->branch_id == 1) {
                    // Manager from branch 1 (main office) can access all customers
                    // No filter applied - they can see all branches
                } elseif ($user->branch_id == 2) {
                    // Manager from branch 2 can access branches 2, 7, 8, 9
                    $allowedBranches = [2, 7, 8, 9];
                    $query->whereIn('branch_id', $allowedBranches);
                } elseif ($user->branch_id == 3) {
                    // Manager from branch 3 can access branches 3, 11
                    $allowedBranches = [3, 11];
                    $query->whereIn('branch_id', $allowedBranches);
                } elseif ($user->branch_id == 6) {
                    // Manager from branch 6 can access branches 6, 10
                    $allowedBranches = [6, 10];
                    $query->whereIn('branch_id', $allowedBranches);
                } else {
                    // Managers from other branches can only see their own branch
                    $query->where('branch_id', $user->branch_id);
                }
            }

            // For compliance officers and audit role, show all customers (no filter)
            // They can see customers from all branches
            // Admin role also has unrestricted access

        } catch (\Exception $e) {
            // Log error but don't break the query - just show all customers

        }

        return $query;
    }

    /**
     * Get branch statistics with assessment counts
     */
    public function getBranchStats()
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json([]);
        }

        // Load user roles if not already loaded
        $user->load('roles');

        // Get all branches with their assessment counts, excluding Head Office
        $branches = \App\Models\Branch::where('branch_name', '!=', 'Head Office')
            ->orderBy('brcode')->get();

        $branchStats = $branches->map(function ($branch) {
            // Use leftJoin to include branches even if they have no customers
            $totalAssessments = $branch->customers()->count();
            $lowRisk = $branch->customers()->where('risk_level', 'LOW RISK')->count();
            $moderateRisk = $branch->customers()->where('risk_level', 'MODERATE RISK')->count();
            $highRisk = $branch->customers()->where('risk_level', 'HIGH RISK')->count();

            return [
                'id' => $branch->id,
                'branch_name' => $branch->branch_name,
                'brak' => $branch->brak,
                'brcode' => $branch->brcode,
                'low_risk' => $lowRisk,
                'moderate_risk' => $moderateRisk,
                'high_risk' => $highRisk,
                'total_assessments' => $totalAssessments,
            ];
        });

        // For non-compliance, non-admin, and non-audit users, filter based on role and branch access
        // Admin, compliance, and audit users see ALL branches (no filtering)
        if (! $user->hasRole('compliance') && ! $user->hasRole('admin') && ! $user->hasRole('audit')) {
            if ($user->hasRole('manager')) {
                // Get the user's branch information
                $userBranch = $user->branch;

                if ($userBranch) {
                    // Special access rules for specific managers based on branch codes
                    if ($userBranch->brcode == '01') { // Main Office
                        // Main Office manager: can access Main Office + Lite branches
                        $allowedBranchCodes = ['01', '06', '07', '08']; // Main Office, Gingoog, Camiguin Lite, Butuan Lite
                    } elseif ($userBranch->brcode == '02') { // Jasaan Branch
                        // Jasaan Branch manager: can access Jasaan + Claveria Lite
                        $allowedBranchCodes = ['02', '10']; // Jasaan Branch, Claveria Branch Lite
                    } elseif ($userBranch->brcode == '05') { // Maramag Branch
                        // Maramag Branch manager: can access Maramag + KIBAWE Lite
                        $allowedBranchCodes = ['05', '09']; // Maramag Branch, KIBAWE Branch Lite
                    } else {
                        // Other managers can only access their own branch
                        $allowedBranchCodes = [$userBranch->brcode];
                    }

                    // Filter based on branch codes (using collection method)
                    $branchStats = $branchStats->whereIn('brcode', $allowedBranchCodes);
                } else {
                    // If no branch assigned, show only their own
                    $branchStats = $branchStats->where('id', $user->branch_id);
                }
            } elseif ($user->branch_id) {
                // Regular users can only access their own branch
                $branchStats = $branchStats->where('id', $user->branch_id);
            }
        }
        // Note: Admin and compliance users see all branches (no filtering applied)

        return response()->json($branchStats->values());
    }

    /**
     * Get analytics data for dashboard (daily, weekly, monthly)
     */
    public function getAnalyticsData()
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json([
                'daily' => [],
                'weekly' => [],
                'monthly' => [],
            ]);
        }

        // Load user roles if not already loaded
        $user->load('roles');

        // Base query for filtering by user role
        $baseQuery = function () use ($user) {
            $query = \App\Models\Customer::query();

            // For non-compliance and non-admin users, filter based on role and branch access
            if (! $user->hasRole('compliance') && ! $user->hasRole('admin')) {
                if ($user->hasRole('manager')) {
                    // Special access rules for specific managers
                    if ($user->branch_id == 2) {
                        // Main Office manager: can access branches 2, 39, 40, 41
                        $allowedBranches = [2, 39, 40, 41]; // Main Office, Gingoog Branch, Camiguin Branch Lite, Butuan Branch Lite
                    } elseif ($user->branch_id == 3) {
                        // Jasaan Branch manager: can access branches 3, 43
                        $allowedBranches = [3, 43]; // Jasaan Branch, Claveria Branch Lite
                    } elseif ($user->branch_id == 38) {
                        // Maramag Branch manager: can access branches 38, 42
                        $allowedBranches = [38, 42]; // Maramag Branch, KIBAWE Branch Lite
                    } else {
                        // Other managers can only access their own branch
                        $allowedBranches = [$user->branch_id];
                    }
                    $query->whereIn('branch_id', $allowedBranches);
                } elseif ($user->branch_id) {
                    // Regular users can only access their own branch
                    $query->where('branch_id', $user->branch_id);
                }
            }

            return $query;
        };

        // Daily analytics (last 30 days)
        $dailyData = $baseQuery()
            ->selectRaw('DATE(created_at) as period')
            ->selectRaw('SUM(CASE WHEN risk_level = \'LOW RISK\' THEN 1 ELSE 0 END) as low_risk')
            ->selectRaw('SUM(CASE WHEN risk_level = \'MODERATE RISK\' THEN 1 ELSE 0 END) as moderate_risk')
            ->selectRaw('SUM(CASE WHEN risk_level = \'HIGH RISK\' THEN 1 ELSE 0 END) as high_risk')
            ->selectRaw('COUNT(*) as total')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('period')
            ->orderBy('period', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'period' => \Carbon\Carbon::parse($item->period)->format('M j'),
                    'low_risk' => $item->low_risk,
                    'moderate_risk' => $item->moderate_risk,
                    'high_risk' => $item->high_risk,
                    'total' => $item->total,
                ];
            });

        // Weekly analytics (last 12 weeks)
        $weeklyData = $baseQuery()
            ->selectRaw('EXTRACT(YEAR FROM created_at) as year, EXTRACT(WEEK FROM created_at) as week')
            ->selectRaw('SUM(CASE WHEN risk_level = \'LOW RISK\' THEN 1 ELSE 0 END) as low_risk')
            ->selectRaw('SUM(CASE WHEN risk_level = \'MODERATE RISK\' THEN 1 ELSE 0 END) as moderate_risk')
            ->selectRaw('SUM(CASE WHEN risk_level = \'HIGH RISK\' THEN 1 ELSE 0 END) as high_risk')
            ->selectRaw('COUNT(*) as total')
            ->where('created_at', '>=', now()->subWeeks(12))
            ->groupBy('year', 'week')
            ->orderBy('year', 'desc')
            ->orderBy('week', 'desc')
            ->get()
            ->map(function ($item) {
                // Calculate week start date for display
                $weekStart = \Carbon\Carbon::now()->setISODate($item->year, $item->week)->startOfWeek();

                return [
                    'period' => 'Week '.$item->week.' ('.$weekStart->format('M j').')',
                    'low_risk' => $item->low_risk,
                    'moderate_risk' => $item->moderate_risk,
                    'high_risk' => $item->high_risk,
                    'total' => $item->total,
                ];
            });

        // Monthly analytics (last 12 months)
        $monthlyData = $baseQuery()
            ->selectRaw('EXTRACT(YEAR FROM created_at) as year, EXTRACT(MONTH FROM created_at) as month')
            ->selectRaw('SUM(CASE WHEN risk_level = \'LOW RISK\' THEN 1 ELSE 0 END) as low_risk')
            ->selectRaw('SUM(CASE WHEN risk_level = \'MODERATE RISK\' THEN 1 ELSE 0 END) as moderate_risk')
            ->selectRaw('SUM(CASE WHEN risk_level = \'HIGH RISK\' THEN 1 ELSE 0 END) as high_risk')
            ->selectRaw('COUNT(*) as total')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($item) {
                $monthName = \Carbon\Carbon::create($item->year, $item->month, 1)->format('M Y');

                return [
                    'period' => $monthName,
                    'low_risk' => $item->low_risk,
                    'moderate_risk' => $item->moderate_risk,
                    'high_risk' => $item->high_risk,
                    'total' => $item->total,
                ];
            });

        return response()->json([
            'daily' => $dailyData,
            'weekly' => $weeklyData,
            'monthly' => $monthlyData,
        ]);
    }

    /**
     * Helper method to generate customer initials
     */
    private function getCustomerInitials($name)
    {
        if (! $name) {
            return 'C';
        }

        $words = explode(' ', trim($name));
        if (count($words) === 1) {
            return strtoupper(substr($words[0], 0, 1));
        }

        return strtoupper(substr($words[0], 0, 1).substr(end($words), 0, 1));
    }

    /**
     * Get risk level thresholds (public API endpoint)
     */
    public function getRiskThresholds()
    {
        $thresholds = $this->getRiskThresholdsFromSettings();

        return response()->json([
            'success' => true,
            'data' => $thresholds,
            'message' => 'Risk thresholds retrieved successfully',
        ]);
    }

    /**
     * Get risk level thresholds from system settings
     */
    private function getRiskThresholdsFromSettings()
    {
        // Get threshold configuration from system settings
        $thresholdConfig = SystemSetting::where('key', 'risk_thresholds')
            ->where('group', 'risk_settings')
            ->first();

        if ($thresholdConfig) {
            $config = json_decode($thresholdConfig->value, true);

            return [
                'low_threshold' => $config['low_threshold'] ?? 10,
                'moderate_threshold' => $config['moderate_threshold'] ?? 16,
                'high_threshold' => $config['high_threshold'] ?? 19,
            ];
        }

        // Default thresholds if not configured
        return [
            'low_threshold' => 10,
            'moderate_threshold' => 16,
            'high_threshold' => 19,
        ];
    }

    /**
     * Calculate risk level based on score and configured thresholds
     */
    private function calculateRiskLevel($totalScore)
    {
        $thresholds = $this->getRiskThresholdsFromSettings();

        if ($totalScore >= $thresholds['high_threshold']) {
            return 'HIGH RISK';
        } elseif ($totalScore >= $thresholds['moderate_threshold']) {
            return 'MODERATE RISK';
        } else {
            return 'LOW RISK';
        }
    }
}
