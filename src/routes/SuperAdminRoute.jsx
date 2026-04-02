import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function SuperAdminRoute({ children }) {
  const { loading, isSuperAdmin } = useAuth();

  if (loading) return null;

  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}