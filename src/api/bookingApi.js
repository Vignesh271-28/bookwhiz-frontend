import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { API } from "../../src/config/api";

// const API_URL = "http://localhost:8080/api/bookings";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`
  }
});

export const lockSeats = (showId, seatIds) =>
  axios.post(`${API.BOOKINGS}/lock/${showId}`, seatIds, authHeader());

export const fetchMyBookings = () =>
  axios.get(`${API.BOOKINGS}/my`, authHeader());

// bookingApi.js
export const cancelBooking = (bookingId) =>
  axios.delete(`${API}/${bookingId}/cancel`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  