<?php

namespace App\Http\Controllers;

use App\Events\EditRequestEvent;
use App\Events\EditRequestStatusNotification;
use App\Models\Customer;
use App\Models\EditRequest;
use App\Models\User;
use App\Models\UserActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class EditRequestController extends Controller
{
    /**
     * Create a new edit request
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();
        $customerId = $request->customer_id;

        // Check if user already has a pending or approved request for this customer
        $existingRequest = EditRequest::where('user_id', $user->id)
            ->where('customer_id', $customerId)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existingRequest) {
            if ($existingRequest->status === 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending request for this customer.',
                ], 409);
            }

            if ($existingRequest->status === 'approved' && ! $existingRequest->hasExpired()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have approved access to edit this customer.',
                ], 409);
            }
        }

        // Get customer for the request
        $customer = Customer::findOrFail($customerId);

        // Find the appropriate manager based on the requesting user's branch using the same hierarchy
        $managerResult = $this->findManagerForUserBranch($user->branch_id);

        // Create the edit request
        $editRequest = EditRequest::create([
            'user_id' => $user->id,
            'customer_id' => $customerId,
            'manager_id' => $managerResult['manager']?->id,
            'reason' => $request->reason,
            'status' => 'pending',
        ]);

        // Load relationships for broadcasting
        $editRequest->load(['user', 'customer']);

        // Broadcast new edit request event
        $requestData = [
            'id' => $editRequest->id,
            'user_name' => $editRequest->user->first_name . ' ' . $editRequest->user->last_name,
            'user_email' => $editRequest->user->email,
            'customer_name' => $editRequest->customer->name,
            'reason' => $editRequest->reason,
            'created_at' => $editRequest->created_at->format('M d, Y h:i A'),
            'status' => $editRequest->status
        ];

        broadcast(new EditRequestEvent('created', $requestData));

        \Log::info('Edit request created - broadcast sent', [
            'edit_request_id' => $editRequest->id,
            'request_data' => $requestData
        ]);

        // Log user activity
        try {
            UserActivity::log(
                'create_edit_request',
                "Requested edit access for customer '{$customer->name}'".($request->reason ? " - Reason: {$request->reason}" : ''),
                'EditRequest',
                $editRequest->id,
                [
                    'customer_id' => $customerId,
                    'customer_name' => $customer->name,
                    'manager_id' => $managerResult['manager']?->id,
                    'manager_name' => $managerResult['manager']?->first_name.' '.$managerResult['manager']?->last_name,
                    'intended_branch' => $managerResult['intended_branch'],
                    'reason' => $request->reason,
                ]
            );
        } catch (\Exception $e) {
            \Log::warning('Failed to log edit request creation activity: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Edit request submitted successfully. You will be notified once it is reviewed.',
            'data' => [
                'request_id' => $editRequest->id,
                'status' => $editRequest->status,
                'customer_name' => $customer->name,
                'manager_name' => $managerResult['manager']?->first_name.' '.$managerResult['manager']?->last_name,
                'intended_manager_branch' => $managerResult['intended_branch'],
            ],
        ]);
    }

    /**
     * Get pending requests for managers
     */
    public function getPendingRequests()
    {
        $user = Auth::user();

        if (! $user->hasRole('manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Manager role required.',
            ], 403);
        }

        // Get requests based on branch hierarchy - managers can see requests from users in their designated branches
        $requests = EditRequest::with(['user', 'customer'])
            ->where('status', 'pending')
            ->whereHas('user', function ($query) use ($user) {
                if ($user->branch_id == 2) {
                    // Manager from branch 2 can see requests from branches 2, 7, 8, 9
                    $allowedBranches = [2, 7, 8, 9];
                    $query->whereIn('branch_id', $allowedBranches);
                } elseif ($user->branch_id == 3) {
                    // Manager from branch 3 can see requests from branches 3, 11
                    $allowedBranches = [3, 11];
                    $query->whereIn('branch_id', $allowedBranches);
                } elseif ($user->branch_id == 6) {
                    // Manager from branch 6 can see requests from branches 6, 10
                    $allowedBranches = [6, 10];
                    $query->whereIn('branch_id', $allowedBranches);
                } else {
                    // For other branches, only see requests from the same branch
                    $query->where('branch_id', $user->branch_id);
                }
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'user_name' => $request->user->first_name.' '.$request->user->last_name,
                    'user_email' => $request->user->email,
                    'customer_id' => $request->customer->id,
                    'customer_name' => $request->customer->name,
                    'reason' => $request->reason,
                    'created_at' => $request->created_at->format('M d, Y h:i A'),
                    'status' => $request->status,
                ];
            });

        // Log user activity
        try {
            UserActivity::log(
                'view_edit_requests',
                "Viewed {$requests->count()} pending edit requests as manager",
                null,
                null,
                [
                    'request_count' => $requests->count(),
                    'action' => 'manager_view_pending_requests',
                ]
            );
        } catch (\Exception $e) {
            \Log::warning('Failed to log pending requests view activity: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Approve or disapprove an edit request
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,disapproved',
            'manager_notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = Auth::user();

        if (! $user->hasRole('manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Manager role required.',
            ], 403);
        }

        $editRequest = EditRequest::with(['user', 'customer'])
            ->where('id', $id)
            ->where('status', 'pending')
            ->whereHas('user', function ($query) use ($user) {
                if ($user->branch_id == 2) {
                    // Manager from branch 2 can handle requests from branches 2, 7, 8, 9
                    $allowedBranches = [2, 7, 8, 9];
                    $query->whereIn('branch_id', $allowedBranches);
                } elseif ($user->branch_id == 3) {
                    // Manager from branch 3 can handle requests from branches 3, 11
                    $allowedBranches = [3, 11];
                    $query->whereIn('branch_id', $allowedBranches);
                } elseif ($user->branch_id == 6) {
                    // Manager from branch 6 can handle requests from branches 6, 10
                    $allowedBranches = [6, 10];
                    $query->whereIn('branch_id', $allowedBranches);
                } else {
                    // For other branches, only handle requests from the same branch
                    $query->where('branch_id', $user->branch_id);
                }
            })
            ->first();

        if (! $editRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Edit request not found or you do not have permission to handle this request.',
            ], 404);
        }

        if ($request->status === 'approved') {
            $editRequest->approve($user, $request->manager_notes);
            $message = 'Edit request approved successfully.';
        } else {
            $editRequest->disapprove($user, $request->manager_notes);
            $message = 'Edit request disapproved.';
        }

        // Broadcast request updated event
        $requestData = [
            'id' => $editRequest->id,
            'user_name' => $editRequest->user->first_name . ' ' . $editRequest->user->last_name,
            'user_email' => $editRequest->user->email,
            'customer_name' => $editRequest->customer->name,
            'reason' => $editRequest->reason,
            'status' => $editRequest->status,
            'manager_notes' => $editRequest->manager_notes,
            'updated_at' => $editRequest->updated_at->format('M d, Y h:i A'),
        ];

        broadcast(new EditRequestEvent('updated', $requestData));

        // Send status notification to the user who made the request
        $statusMessage = $request->status === 'approved'
            ? "Your edit request for '{$editRequest->customer->name}' has been approved! You can now edit this customer's information."
            : "Your edit request for '{$editRequest->customer->name}' has been disapproved.";

        if ($request->manager_notes) {
            $statusMessage .= " Manager notes: " . $request->manager_notes;
        }

        broadcast(new EditRequestStatusNotification(
            $request->status,
            [
                'id' => $editRequest->id,
                'user_id' => $editRequest->user_id,
                'customer_name' => $editRequest->customer->name,
                'customer_id' => $editRequest->customer_id,
                'manager_name' => $user->first_name . ' ' . $user->last_name,
                'manager_notes' => $request->manager_notes,
                'status' => $request->status,
            ],
            $statusMessage
        ));

        // Log user activity
        try {
            UserActivity::log(
                $request->status === 'approved' ? 'approve_edit_request' : 'disapprove_edit_request',
                "{$request->status} edit request for customer '{$editRequest->customer->name}' from user '{$editRequest->user->first_name} {$editRequest->user->last_name}'".($request->manager_notes ? " - Notes: {$request->manager_notes}" : ''),
                'EditRequest',
                $editRequest->id,
                [
                    'request_id' => $editRequest->id,
                    'customer_id' => $editRequest->customer_id,
                    'customer_name' => $editRequest->customer->name,
                    'requester_id' => $editRequest->user_id,
                    'requester_name' => $editRequest->user->first_name.' '.$editRequest->user->last_name,
                    'action' => $request->status,
                    'manager_notes' => $request->manager_notes,
                    'approved_at' => $editRequest->approved_at,
                    'expires_at' => $editRequest->expires_at,
                ]
            );
        } catch (\Exception $e) {
            \Log::warning('Failed to log edit request status update activity: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'request_id' => $editRequest->id,
                'status' => $editRequest->status,
                'user_name' => $editRequest->user->first_name.' '.$editRequest->user->last_name,
                'customer_name' => $editRequest->customer->name,
            ],
        ]);
    }

    /**
     * Check if user can edit a specific customer
     */
    public function checkEditAccess($customerId)
    {
        $user = Auth::user();

        // Admins and managers can always edit
        if ($user->hasRole('admin') || $user->hasRole('manager')) {
            return response()->json([
                'success' => true,
                'can_edit' => true,
                'reason' => 'User has administrative privileges',
            ]);
        }

        // Check if regular user has approved access
        $approvedRequest = EditRequest::where('user_id', $user->id)
            ->where('customer_id', $customerId)
            ->where('status', 'approved')
            ->where('expires_at', '>', now())
            ->first();

        if ($approvedRequest) {
            // Log user activity for approved access check
            try {
                UserActivity::log(
                    'check_approved_edit_access',
                    "Checked and confirmed approved edit access for customer ID {$customerId}",
                    'EditRequest',
                    $approvedRequest->id,
                    [
                        'customer_id' => $customerId,
                        'request_id' => $approvedRequest->id,
                        'expires_at' => $approvedRequest->expires_at,
                        'access_granted' => true,
                    ]
                );
            } catch (\Exception $e) {
                \Log::warning('Failed to log approved edit access check activity: '.$e->getMessage());
            }

            return response()->json([
                'success' => true,
                'can_edit' => true,
                'reason' => 'Approved access until '.$approvedRequest->expires_at->format('M d, Y h:i A'),
            ]);
        }

        // Check if there's a pending request
        $pendingRequest = EditRequest::where('user_id', $user->id)
            ->where('customer_id', $customerId)
            ->where('status', 'pending')
            ->first();

        return response()->json([
            'success' => true,
            'can_edit' => false,
            'has_pending_request' => (bool) $pendingRequest,
            'pending_request_id' => $pendingRequest?->id,
        ]);
    }

    /**
     * Get user's edit requests
     */
    public function getUserRequests()
    {
        $user = Auth::user();

        $requests = EditRequest::with(['customer', 'manager'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'customer_id' => $request->customer->id,
                    'customer_name' => $request->customer->name,
                    'status' => $request->status,
                    'reason' => $request->reason,
                    'manager_notes' => $request->manager_notes,
                    'manager_name' => $request->manager ? $request->manager->first_name.' '.$request->manager->last_name : null,
                    'created_at' => $request->created_at->format('M d, Y h:i A'),
                    'approved_at' => $request->approved_at?->format('M d, Y h:i A'),
                    'expires_at' => $request->expires_at?->format('M d, Y h:i A'),
                    'has_expired' => $request->hasExpired(),
                ];
            });

        // Log user activity
        try {
            UserActivity::log(
                'view_own_edit_requests',
                "Viewed own edit requests ({$requests->count()} requests)",
                null,
                null,
                [
                    'request_count' => $requests->count(),
                    'action' => 'user_view_own_requests',
                ]
            );
        } catch (\Exception $e) {
            \Log::warning('Failed to log user edit requests view activity: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Find the appropriate manager for a user based on branch hierarchy
     */
    private function findManagerForUserBranch($userBranchId, $excludeUserId = null)
    {
        $intendedManagerBranchId = null;

        // Determine which manager branch should handle this user's branch
        if (in_array($userBranchId, [2, 7, 8, 9])) {
            // Users from branches 2, 7, 8, 9 go to manager in branch 2
            $intendedManagerBranchId = 2;
        } elseif (in_array($userBranchId, [3, 11])) {
            // Users from branches 3, 11 go to manager in branch 3
            $intendedManagerBranchId = 3;
        } elseif (in_array($userBranchId, [6, 10])) {
            // Users from branches 6, 10 go to manager in branch 6
            $intendedManagerBranchId = 6;
        } else {
            // For other branches, try to find a manager in the same branch
            $intendedManagerBranchId = $userBranchId;
        }

        // Priority order for finding managers when designated branch has no manager
        $searchOrder = [$intendedManagerBranchId];

        if ($intendedManagerBranchId == 3) {
            // If looking for branch 3 manager, fallback to 6, then 2
            $searchOrder = [3, 6, 2];
        } elseif ($intendedManagerBranchId == 6) {
            // If looking for branch 6 manager, fallback to 3, then 2
            $searchOrder = [6, 3, 2];
        } elseif ($intendedManagerBranchId != 2) {
            // For other branches, fallback to branch 2
            $searchOrder = [$intendedManagerBranchId, 2];
        }

        $manager = null;

        // Search for manager in priority order
        foreach ($searchOrder as $branchId) {
            $manager = User::whereHas('roles', function ($query) {
                $query->where('name', 'manager');
            })
                ->where('branch_id', $branchId)
                ->first();

            if ($manager) {
                break; // Found a manager, stop searching
            }
        }

        // Last resort: find any manager
        if (! $manager) {
            $manager = User::whereHas('roles', function ($query) {
                $query->where('name', 'manager');
            })->first();
        }

        return [
            'manager' => $manager,
            'intended_branch' => $intendedManagerBranchId,
            'actual_branch' => $manager?->branch_id,
        ];
    }
}
