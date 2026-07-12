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

// Placeholder Pages (To be implemented)
const OrganizationPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Organization Setup</h1><p>Admin only</p></div>;
const AssetsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Assets Directory</h1></div>;
const AllocationsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Allocations & Transfers</h1></div>;
const BookingsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Resource Bookings</h1></div>;
const MaintenancePage = () => <div className="p-8"><h1 className="text-2xl font-bold">Maintenance</h1></div>;
const AuditsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Audits</h1></div>;
const ReportsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Reports</h1></div>;
const NotificationsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Notifications</h1></div>;
const ActivityLogsPage = () => <div className="p-8"><h1 className="text-2xl font-bold">Activity Logs</h1></div>;

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
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
