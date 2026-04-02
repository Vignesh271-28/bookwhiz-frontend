import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { API } from "../../src/config/api";

// const API = "http://localhost:8080/api/user";

const auth = () => ({
  Authorization: `Bearer ${getToken()}`
});

// 🔍 City autocomplete — /api/user/locations/search?query=che
export const searchCities = (query) =>
  axios.get(`${API.USER}/locations/search`, {
    params: { query },
    headers: auth()
  });

// 🎬 Movies by city + optional filters — /api/user/movies?city=Chennai
export const fetchMoviesByCity = (city, filters = {}) =>
  axios.get(`${API.USER}/movies`, {
    params: {
      city,
      language: filters.language || undefined,
      genre:    filters.genre    || undefined,
      format:   filters.format   || undefined,
    },
    headers: auth()
  });

// 🎭 Theatres by city + optional area — /api/user/theatres?city=Chennai
export const fetchTheatresByCity = (city, area) =>
  axios.get(`${API.USER}/theatres`, {
    params: { city, area },
    headers: auth()
  });