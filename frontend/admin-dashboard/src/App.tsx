import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LiveOpsPage from "./pages/operations/LiveOpsPage";
import AnalyticsPage from "./pages/operations/AnalyticsPage";
import WorkersListPage from "./pages/workers/WorkersListPage";
import WorkerDetailPage from "./pages/workers/WorkerDetailPage";
import PendingVerificationPage from "./pages/workers/PendingVerificationPage";
import ComplaintsListPage from "./pages/complaints/ComplaintsListPage";
import ComplaintDetailPage from "./pages/complaints/ComplaintDetailPage";
import DisputesPage from "./pages/disputes/DisputesPage";
import SettingsPage from "./pages/settings/SettingsPage";
import ServicesListPage from "./pages/services/ServicesListPage";
import CategoryDetailPage from "./pages/services/CategoryDetailPage";
import BannersPage from "./pages/content/BannersPage";
import CouponsPage from "./pages/coupons/CouponsPage";
import ExecutivesManagementPage from "./pages/executives/ExecutivesManagementPage";
import { useAuthStore } from "./store/auth.store";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const token = useAuthStore((state) => state.token);
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/services" element={<ServicesListPage />} />
                    <Route path="/services/:categoryId" element={<CategoryDetailPage />} />
                    <Route path="/content/banners" element={<BannersPage />} />
                    <Route path="/coupons" element={<CouponsPage />} />
                    <Route path="/operations/live" element={<LiveOpsPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/workers" element={<WorkersListPage />} />
                    <Route path="/workers/:id" element={<WorkerDetailPage />} />
                    <Route path="/workers/verification" element={<PendingVerificationPage />} />
                    <Route path="/complaints" element={<ComplaintsListPage />} />
                    <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
                    <Route path="/disputes" element={<DisputesPage />} />
                    <Route path="/executives" element={<ExecutivesManagementPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
