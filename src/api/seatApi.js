import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { API } from "../../src/config/api";

// const API = "http://localhost:8080/api/user/seats";

/**
 * Fetch all seats by venue (basic list, no booked/locked state)
 */
export const fetchSeatsByVenue = (venueId) =>
  axios.get(`${API.SEATS}/venue/${venueId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });

/**
 * Fetch seats with FULL state per show:
 *   booked  → confirmed in DB
 *   locked  → locked in Redis
 *   lockedBy → userId who locked it
 *
 * Params: venueId first, showId second (must match SeatSelection.jsx call order)
 */
export const fetchSeatState = (venueId, showId) =>
  axios.get(`${API.SEATS}/venue/${venueId}/state`, {
    params:  { showId },
    headers: { Authorization: `Bearer ${getToken()}` }   // ← auth header required
  });