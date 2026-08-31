import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Yalnızca "Admin" rolüne sahip kullanıcıların erişebileceği sayfaları koruyan rota bileşeni.
 */
export default function AdminRoute() {
    const { isAuthenticated, isAdmin } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
