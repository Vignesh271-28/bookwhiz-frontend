import { Outlet, Link } from "react-router-dom";

export default function ManagerLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      {/* <aside className="w-64 bg-white shadow-lg p-5">
        <h2 className="text-2xl font-bold mb-6 text-blue-600">
          Manager Panel
        </h2>

        <nav className="space-y-4">
          <Link
            to="/manager"
            className="block text-gray-700 hover:text-blue-600"
          >
            Dashboard
          </Link>

          <Link
            to="/manager/bookings"
            className="block text-gray-700 hover:text-blue-600"
          >
            Event Bookings
          </Link>

          <Link
            to="/manager/scanner"
            className="block text-gray-700 hover:text-blue-600"
          >
            Ticket Scanner
          </Link>
        </nav>
      </aside> */}

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}