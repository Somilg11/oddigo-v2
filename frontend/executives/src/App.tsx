import type { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import CityDashboardPage from "./pages/city-manager/CityDashboardPage";
import CityZonesPage from "./pages/city-manager/CityZonesPage";
import ZoneManagerDashboardPage from "./pages/zone-manager/ZoneManagerDashboardPage";
import FieldExecDashboardPage from "./pages/field-executive/FieldExecDashboardPage";
import TaskDetailPage from "./pages/field-executive/TaskDetailPage";
import { useAuthStore } from "./store/auth.store";
import type { UserRole } from "./types";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const token = useAuthStore((state) => state.token);
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const RoleGate = ({ children, allowed }: { children: ReactNode; allowed: UserRole[] }) => {
    const user = useAuthStore((s) => s.user);
    if (!user || !allowed.includes(user.role)) return <Navigate to="/" replace />;
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/" element={<DashboardRouter />} />

                    {/* City Manager */}
                    <Route path="/city" element={<RoleGate allowed={["CITY_MANAGER"]}><CityDashboardPage /></RoleGate>} />
                    <Route path="/city/zones" element={<RoleGate allowed={["CITY_MANAGER"]}><CityZonesPage /></RoleGate>} />

                    {/* Zone Manager */}
                    <Route path="/zone" element={<RoleGate allowed={["ZONE_MANAGER"]}><ZoneManagerDashboardPage /></RoleGate>} />

                    {/* Field Executive */}
                    <Route path="/field" element={<RoleGate allowed={["FIELD_EXECUTIVE"]}><FieldExecDashboardPage /></RoleGate>} />
                    <Route path="/field/tasks/:taskId" element={<RoleGate allowed={["FIELD_EXECUTIVE"]}><TaskDetailPage /></RoleGate>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

function DashboardRouter() {
    const user = useAuthStore((s) => s.user);
    if (user?.role === "CITY_MANAGER") return <Navigate to="/city" replace />;
    if (user?.role === "ZONE_MANAGER") return <Navigate to="/zone" replace />;
    if (user?.role === "FIELD_EXECUTIVE") return <Navigate to="/field" replace />;
    return <Navigate to="/login" replace />;
}

export default App;
