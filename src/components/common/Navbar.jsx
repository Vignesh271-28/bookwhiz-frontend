import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "../../index.css";

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roles = user.roles || [];

  // ✅ Role checks
  const isUser       = roles.some(r => r === "USER"        || r.name === "USER");
  const isManager    = roles.some(r => r === "MANAGER"     || r.name === "MANAGER");
  const isAdmin      = roles.some(r => r === "ADMIN"       || r.name === "ADMIN");
  const isSuperAdmin = roles.some(r => r === "SUPER_ADMIN" || r.name === "SUPER_ADMIN");
  const isPartner = roles.some(r=> r=== "Partner" || r.name === "Partner");

  return (
    <nav className="w-full bg-gray-900 text-white px-6 py-4 shadow-md">
      <div className="flex items-center justify-between max-w-7xl mx-auto">

        {/* ── Left Side Links ── */}
        <div className="flex items-center gap-6">

          {/* 🏠 Home — visible to all */}
          <Link
            to="/"
            className="text-lg font-semibold hover:text-yellow-400 transition"
          >
            Home
          </Link>

          {/* My Bookings — visible to all */}
          <Link
            to="/my-bookings"
            className="hover:text-yellow-400 transition"
          >
            My Bookings
          </Link>

          {/* 📊 User Dashboard */}
          {isUser && !isManager && !isAdmin && !isSuperAdmin && (
            <Link
              to="/dashboard"
              className="hover:text-yellow-400 transition"
            >
              Dashboard
            </Link>
          )}

          {/* 🏪 Manager Dashboard */}
          {isManager && (
            <Link
              to="/partner"
              className="hover:text-yellow-400 transition"
            >
              Manager Dashboard
            </Link>
          )}

         

          {/* 🛠️ Admin Dashboard */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hover:text-yellow-400 transition"
            >
              Admin Dashboard
            </Link>
          )}

          {/* 👑 Super Admin Dashboard */}
          {isSuperAdmin && (
            <Link
              to="/superadmin"
              className="hover:text-yellow-400 transition"
            >
              Super Admin Dashboard
            </Link>
          )}
        </div>

        {/* ── Right Side: Role Badge + Logout ── */}
        <div className="flex items-center gap-4">

          {/* 🏷️ Role Badge */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full
            ${isSuperAdmin ? "bg-purple-600 text-white"  :
              isAdmin      ? "bg-red-600    text-white"  :
              isManager    ? "bg-blue-600   text-white"  :
                             "bg-gray-600   text-white"  }
          `}>
            {isSuperAdmin ? " Super Admin" :
             isAdmin      ? " Admin"       :
             isManager    ? "Manager"     :
                            " User"        }
          </span>

          {/* 👤 User Name */}
          <span className="text-sm text-gray-300">
            {user.name || user.email}
          </span>

          {/* 🚪 Logout */}
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}