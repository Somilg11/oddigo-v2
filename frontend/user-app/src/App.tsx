import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OTPLoginPage from "./pages/auth/OTPLoginPage";
import ServiceCategoriesPage from "./pages/services/ServiceCategoriesPage";
import SubServicesPage from "./pages/services/SubServicesPage";
import ServiceDetailPage from "./pages/services/ServiceDetailPage";
import IssueUploadPage from "./pages/booking/IssueUploadPage";
import AIDisplayPage from "./pages/booking/AIDisplayPage";
import WorkerMatchingPage from "./pages/booking/WorkerMatchingPage";
import WorkerSelectionPage from "./pages/booking/WorkerSelectionPage";
import JobConfirmationPage from "./pages/booking/JobConfirmationPage";
import ActiveJobPage from "./pages/job/ActiveJobPage";
import OTPDisplayPage from "./pages/job/OTPDisplayPage";
import EstimateApprovalPage from "./pages/job/EstimateApprovalPage";
import DigitalSignaturePage from "./pages/job/DigitalSignaturePage";
import PaymentPage from "./pages/job/PaymentPage";
import RatingPage from "./pages/job/RatingPage";
import BookingsHistoryPage from "./pages/bookings/BookingsHistoryPage";
import JobDetailPage from "./pages/bookings/JobDetailPage";
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfilePage from "./pages/profile/EditProfilePage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import WarrantyStatusPage from "./pages/warranty/WarrantyStatusPage";
import WarrantyClaimPage from "./pages/warranty/WarrantyClaimPage";
import PointsPage from "./pages/points/PointsPage";
import ReferPage from "./pages/referral/ReferPage";
import MaintenancePage from "./pages/MaintenancePage";
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
                <Route path="/maintenance" element={<MaintenancePage />} />

                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/" element={<ServiceCategoriesPage />} />
                    <Route path="/services" element={<ServiceCategoriesPage />} />
                    <Route path="/services/:categoryId" element={<SubServicesPage />} />
                    <Route path="/services/sub/:subServiceId" element={<ServiceDetailPage />} />

                    <Route path="/booking/issue" element={<IssueUploadPage />} />
                    <Route path="/booking/ai-analysis" element={<AIDisplayPage />} />
                    <Route path="/booking/matching" element={<WorkerMatchingPage />} />
                    <Route path="/booking/workers" element={<WorkerSelectionPage />} />
                    <Route path="/booking/confirm" element={<JobConfirmationPage />} />

                    <Route path="/job/:id" element={<ActiveJobPage />} />
                    <Route path="/job/:id/otp" element={<OTPDisplayPage />} />
                    <Route path="/job/:id/approve-estimate" element={<EstimateApprovalPage />} />
                    <Route path="/job/:id/signature" element={<DigitalSignaturePage />} />
                    <Route path="/job/:id/pay" element={<PaymentPage />} />
                    <Route path="/job/:id/rate" element={<RatingPage />} />

                    <Route path="/bookings" element={<BookingsHistoryPage />} />
                    <Route path="/bookings/:id" element={<JobDetailPage />} />

                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/edit" element={<EditProfilePage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/points" element={<PointsPage />} />
                    <Route path="/refer" element={<ReferPage />} />

                    <Route path="/warranty/:jobId" element={<WarrantyStatusPage />} />
                    <Route path="/warranty/:jobId/claim" element={<WarrantyClaimPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
