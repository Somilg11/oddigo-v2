import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { WorkerLayout } from "./components/layout/WorkerLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OTPLoginPage from "./pages/auth/OTPLoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import JobRequestsPage from "./pages/jobs/JobRequestsPage";
import JobDetailPage from "./pages/jobs/JobDetailPage";
import ActiveJobPage from "./pages/jobs/ActiveJobPage";
import OTPRequestPage from "./pages/jobs/OTPRequestPage";
import OTPEntryPage from "./pages/jobs/OTPEntryPage";
import EstimateFormPage from "./pages/jobs/EstimateFormPage";
import BeforePhotoPage from "./pages/jobs/BeforePhotoPage";
import AfterPhotoPage from "./pages/jobs/AfterPhotoPage";
import CompleteJobPage from "./pages/jobs/CompleteJobPage";
import JobHistoryPage from "./pages/jobs/JobHistoryPage";
import WorkerJobDetailPage from "./pages/jobs/WorkerJobDetailPage";
import KYCPage from "./pages/kyc/KYCPage";
import KYCUploadPage from "./pages/kyc/KYCUploadPage";
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import EarningsPage from "./pages/profile/EarningsPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
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
                <Route path="/login/otp" element={<OTPLoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute><WorkerLayout /></ProtectedRoute>}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/jobs/requests" element={<JobRequestsPage />} />
                    <Route path="/jobs/:id" element={<JobDetailPage />} />
                    <Route path="/jobs/:id/active" element={<ActiveJobPage />} />
                    <Route path="/jobs/:id/otp-request" element={<OTPRequestPage />} />
                    <Route path="/jobs/:id/otp-verify" element={<OTPEntryPage />} />
                    <Route path="/jobs/:id/estimate" element={<EstimateFormPage />} />
                    <Route path="/jobs/:id/before-photo" element={<BeforePhotoPage />} />
                    <Route path="/jobs/:id/after-photo" element={<AfterPhotoPage />} />
                    <Route path="/jobs/:id/complete" element={<CompleteJobPage />} />
                    <Route path="/jobs/history" element={<JobHistoryPage />} />
                    <Route path="/jobs/history/:id" element={<WorkerJobDetailPage />} />
                    <Route path="/kyc" element={<KYCPage />} />
                    <Route path="/kyc/upload/:docType" element={<KYCUploadPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/edit" element={<EditProfilePage />} />
                    <Route path="/earnings" element={<EarningsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
