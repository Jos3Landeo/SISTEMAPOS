import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "../../features/auth/hooks/useAuth";

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

