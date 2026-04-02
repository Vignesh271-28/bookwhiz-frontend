import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ManagerRoute({ children }) {
  const { loading, isUser, isManager, isAdmin, isSuperAdmin } = useAuth();

  if (loading) return null; // or loader

  if (!(isUser || isManager || isAdmin || isSuperAdmin)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}