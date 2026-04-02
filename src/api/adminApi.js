import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { API } from "../../src/config/api";

import api from "./axios";


// const API = "http://localhost:8080/api/admin";

const auth = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`
  }
});


export const fetchAdminStats = () =>
  axios.get(`${API.ADMIN}/dashboard/stats`, auth());


export const fetchAllBookings = () =>
  axios.get(`${API.ADMIN}/dashboard/bookings`, auth());


export const fetchPendingEvents = () =>
  axios.get(`${API.ADMIN}/events/pending`, auth());

export const approveEvent = (id) =>
  axios.put(`${API.ADMIN}/events/${id}/approve`, {}, auth());

export const rejectEvent = (id) =>
  axios.put(`${API.ADMIN}/events/${id}/reject`, {}, auth());



/* 📊 Dashboard analytics */
export const getAdminAnalytics = () =>
  api.get("/admin/dashboard/analytics");

/* 📋 All bookings */
export const getAdminBookings = () =>
  api.get("/admin/dashboard/bookings");

/* ➕ Create user */
export const createUser = (user) =>
  api.post("/admin/users", user);

/* ✏️ Update user */
export const updateUser = (id, user) =>
  api.put(`/admin/users/${id}`, user);