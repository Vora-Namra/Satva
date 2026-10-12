import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../constants/roles";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";

type RoleRouteProps = {
  allowedRoles: Role[];
};

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { role } = useAuth();

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
