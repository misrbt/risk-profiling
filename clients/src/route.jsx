import { Suspense, lazy } from "react";
import { Route } from "react-router-dom";
import { ProtectedRoute } from "./components/auth";
import { AppLayout } from "./layouts";
import { LoadingSpinner } from "./components/ui";

// Lazy load audit pages
const AuditDashboard = lazy(() => import("./pages/audit/AuditDashboard"));
const AuditCustomerListPage = lazy(() => import("./pages/audit/AuditCustomerListPage"));
const AuditLogsPage = lazy(() => import("./pages/admin/AuditLogs"));
const UserActivityReport = lazy(() => import("./pages/admin/UserActivityReport"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

/**
 * Audit Role Routes
 * Read-only access to dashboard, customers, and audit logs
 * Uses AppLayout (navigation bar only, no sidebar like compliance role)
 */
export const auditRoutes = (
  <>
    <Route
      path="/audit/dashboard"
      element={
        <ProtectedRoute requiredRole="audit">
          <AppLayout>
            <Suspense fallback={<LoadingSpinner />}>
              <AuditDashboard />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/audit/customers"
      element={
        <ProtectedRoute requiredRole="audit">
          <AppLayout>
            <Suspense fallback={<LoadingSpinner />}>
              <AuditCustomerListPage />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/audit/user-activity"
      element={
        <ProtectedRoute requiredRole="audit">
          <AppLayout>
            <Suspense fallback={<LoadingSpinner />}>
              <UserActivityReport />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/audit/audit-logs"
      element={
        <ProtectedRoute requiredRole="audit">
          <AppLayout>
            <Suspense fallback={<LoadingSpinner />}>
              <AuditLogsPage />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/audit/profile"
      element={
        <ProtectedRoute requiredRole="audit">
          <AppLayout>
            <Suspense fallback={<LoadingSpinner />}>
              <ProfilePage />
            </Suspense>
          </AppLayout>
        </ProtectedRoute>
      }
    />
  </>
);
