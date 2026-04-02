import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminRoute({ children }) {
  const { loading, isAdmin, isSuperAdmin } = useAuth();

  if (loading) return null;

  if (!(isAdmin || isSuperAdmin)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}