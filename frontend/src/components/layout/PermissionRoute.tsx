import { Navigate, Outlet } from "react-router-dom";

import { hasPermission, type AppPermission } from "../../features/auth/access";
import { useAuthStore } from "../../features/auth/hooks/useAuth";

type PermissionRouteProps = {
  permission: AppPermission;
};

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!hasPermission(user, permission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
