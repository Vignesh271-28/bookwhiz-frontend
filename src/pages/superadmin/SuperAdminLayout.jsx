import { Outlet } from "react-router-dom";

/**
 * SuperAdminLayout — simple pass-through.
 * SuperAdminDashboard owns DashboardLayout (same pattern as AdminDashboard).
 */
export default function SuperAdminLayout() {
  return <Outlet />;
}