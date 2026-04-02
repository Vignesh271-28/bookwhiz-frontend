import { useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";

export default function TicketScanner() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState(null);

  const handleScan = async () => {
    if (!bookingId) {
      toast.error("Enter booking ID");
      return;
    }

    try {
      const res = await api.get(`/bookings/${bookingId}`);
      setBooking(res.data);
      toast.success("Ticket verified");
    } catch (err) {
      toast.error("Invalid ticket / booking not found");
      setBooking(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Ticket Scanner</h2>

      <div className="flex gap-3 mb-4">
        <input
          value={bookingId}
          onChange={e => setBookingId(e.target.value)}
          placeholder="Enter Booking ID"
          className="border px-3 py-2 rounded"
        />

        <button
          onClick={handleScan}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Scan
        </button>
      </div>

      {booking && (
        <div className="bg-green-50 border border-green-300 p-4 rounded">
          <p><b>Status:</b> {booking.status}</p>
          <p><b>User:</b> {booking.user?.email}</p>
          <p><b>Event:</b> {booking.event?.title}</p>
        </div>
      )}
    </div>
  );
}