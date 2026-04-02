import axios from "axios";
import api from "./axios";
import { getToken } from "../utils/jwtUtil";
import { API } from "../../src/config/api";

// const API = "http://localhost:8080/api/superadmin";

const auth = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

export const fetchSuperAdminStats = () =>
  axios.get(`${API.SUPER_ADMIN}/dashboard/stats`, auth());

export const fetchAllUsers = () =>
  axios.get(`${API.SUPER_ADMIN}/users`, auth());

export const fetchRevenueTimeline = () =>
  axios.get(`${API.SUPER_ADMIN}/revenue`, auth());


/* ➕ Create user */
export const createSuperUser = (user) =>
  
  api.post("/superadmin/users", user);

/* ✏️ Update user */
export const updateSuperUser = (id, user) =>
  api.put(`/superadmin/users/${id}`, user);

/* ❌ Delete user */
export const deleteUser = (id) =>
  api.delete(`/superadmin/users/${id}`);