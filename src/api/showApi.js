import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { API } from '../config/api';

// const BASE = "http://localhost:8080/api/user";

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

/**
 * Fetch show timings for a movie in a specific city.
 *
 * Called by EventDetails:
 *   fetchShowsByMovie(movieId, city)
 *
 * Response shape (per show):
 * {
 *   id, showDate, showTime ("18:30"),
 *   price, totalSeats, availableSeats,
 *   venue: { id, name, city, area, address }
 * }
 */
export const fetchShowsByMovie = (movieId, city) => {
  const params = { movieId };
  if (city && city.trim() !== "") {
    params.city = city.trim();
  }
  return axios.get(`${API.USER}/shows`, {
    params,
    headers: authHeaders(),
  });
};