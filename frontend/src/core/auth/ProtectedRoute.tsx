import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "./token";

export function ProtectedRoute() {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
