import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';

// Layouts
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

// Guards
import { ProtectedRoute, RoleRoute } from '@/components/guards';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import OrganizationPage from '@/pages/organization/OrganizationPage';
import AssetsPage from '@/pages/assets/AssetsPage';
import AllocationsPage from '@/pages/allocations/AllocationsPage';
import BookingsPage from '@/pages/bookings/BookingsPage';
import MaintenancePage from '@/pages/maintenance/MaintenancePage';
import AuditsPage from '@/pages/audits/AuditsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import ActivityLogsPage from '@/pages/activity-logs/ActivityLogsPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<DashboardPage />} />
                
                {/* Admin Only Route */}
                <Route element={<RoleRoute roles={['admin']} />}>
                  <Route path="/organization" element={<OrganizationPage />} />
                  <Route path="/activity-logs" element={<ActivityLogsPage />} />
                </Route>

                {/* Admin and Asset Manager Routes */}
                <Route element={<RoleRoute roles={['admin', 'asset_manager']} />}>
                  <Route path="/audits" element={<AuditsPage />} />
                </Route>
                
                {/* Admin, Asset Manager, Dept Head Routes */}
                <Route element={<RoleRoute roles={['admin', 'asset_manager', 'department_head']} />}>
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>

                {/* All authenticated users */}
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/allocations" element={<AllocationsPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </Router>
        <Toaster richColors position="top-right" closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}
