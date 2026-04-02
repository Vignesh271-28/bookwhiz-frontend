import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function EventBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.get("/manager/dashboard/bookings")
      .then(res => setBookings(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">All Event Bookings</h2>

      {bookings.length === 0 && <p>No bookings found.</p>}

      <div className="space-y-3">
        {bookings.map(b => (
          <div
            key={b.id}
            className="bg-white p-4 rounded shadow"
          >
            <p><b>Booking ID:</b> {b.id}</p>
            <p><b>Status:</b> {b.status}</p>
            <p><b>User:</b> {b.user?.email}</p>
            <p><b>Event:</b> {b.event?.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}