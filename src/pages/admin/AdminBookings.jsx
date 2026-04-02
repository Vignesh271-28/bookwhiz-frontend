import { useEffect, useState } from "react";
import { getAdminBookings } from "../../api/adminApi";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    getAdminBookings().then(res => setBookings(res.data));
  }, []);

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">All Bookings</h2>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th>Status</th>
              <th>User</th>
              <th>Event</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-t">
                <td className="p-3">{b.id}</td>
                <td>{b.status}</td>
                <td>{b.user?.email}</td>
                <td>{b.event?.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}