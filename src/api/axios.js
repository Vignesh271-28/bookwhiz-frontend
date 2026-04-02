import axios from "axios";
import { API } from "../../src/config/api";

const api = axios.create({
  baseURL: API.API_URL
     
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;