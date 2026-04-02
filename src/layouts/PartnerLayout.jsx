import { Outlet } from "react-router-dom";

/**
 * Layout shell for all /partner/* routes.
 * PartnerDashboard renders DashboardLayout internally, so this
 * just needs to render the child outlet.
 */
export default function PartnerLayout() {
  return <Outlet />;
}