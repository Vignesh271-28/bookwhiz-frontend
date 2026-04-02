import axios from "axios";
import { API } from "../../src/config/api";

// const API_URL = "http://localhost:8080/api/auth";

export const registerUser = (data) =>
  axios.post(`${API.AUTH}/register`, data);

export const loginUser = (data) =>
  axios.post(`${API.AUTH}/login`, data);
