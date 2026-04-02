import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2 className="logo">🎟 BookWhiz</h2>

      <nav>
        <NavLink to="/admin" end>Dashboard</NavLink>
        <NavLink to="/admin/events">Events</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/payouts">Payouts</NavLink>
        <NavLink to="/admin/reports">Reports</NavLink>
      </nav>

      <div className="help-card">
        <p>Need Help?</p>
        <button>Help Center</button>
      </div>
    </aside>
  );
}