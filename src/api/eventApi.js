import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { API } from "../../src/config/api";


const API_URL = "http://localhost:8080/api";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`
  }
});

export const fetchEvents = () =>
  axios.get(`${API.BASE}/user/events`, authHeader());

export const fetchEventById = (eventId) =>
  axios.get(`${API.BASE}/user/events/${eventId}`, authHeader());
