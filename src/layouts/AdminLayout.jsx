import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AdminLayout({ children }) {
  const { logout, isSuperAdmin } = useAuth();

  const linkClass = ({ isActive }) =>
    `block px-4 py-2 rounded ${
      isActive ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      {/* <aside className="w-64 bg-white shadow-lg p-4">
        <h2 className="text-xl font-bold mb-6 text-blue-600">Admin Panel</h2>

        <nav className="space-y-2">
          <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/bookings" className={linkClass}>Bookings</NavLink>
          <NavLink to="/admin/users"    className={linkClass}>Users</NavLink>

          {isSuperAdmin && (
            <NavLink to="/superadmin" className={linkClass}>Super Admin</NavLink>
          )}
        </nav>

        <button onClick={logout} className="mt-8 text-red-500 hover:underline">
          Logout
        </button>
      </aside> */}

      {/* Content — supports both nested routes and direct children */}
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>

    </div>
  );
}