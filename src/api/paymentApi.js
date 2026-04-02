import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { toast } from "react-toastify";
import { API } from "../../src/config/api";


// const API_URL = "http://localhost:8080/api/payments";

const authHeader = ()=> ({
  headers: {
    Authorization: `Bearer ${getToken()}`
  }
});

export const initiatePayment = (bookingId) =>
  axios.post(`${API.PAYMENTS}/initiate/${bookingId}`, {}, authHeader());

export const confirmPayment = (paymentId) =>
  axios.post(`${API.PAYMENTS}/confirm/${paymentId}`, {}, authHeader()
  
);
