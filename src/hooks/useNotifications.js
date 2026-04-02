import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import { getToken } from "../utils/jwtUtil";
import { API } from "../config/api";


// const API = "http://localhost:8080/api";
// const WS  = "http://localhost:8080/ws";

const auth = () => ({ Authorization: `Bearer ${getToken()}` });

/**
 * useNotifications(role, email)
 *
 * role  — "SUPER_ADMIN" | "ADMIN" | "MANAGER"
 * email — current user's email
 *
 * Returns: { notifications, unreadCount, markAllRead, markOneRead }
 */
export default function useNotifications(role, email) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const clientRef = useRef(null);

  // ── Fetch existing notifications from REST ────────────────
  const fetchAll = useCallback(async () => {
    try {
      const r = await axios.get(`${API.NOTIFICATIONS}`, { headers: auth() });
      const data = r.data ?? [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch { /* silent */ }
  }, []);

  // ── Connect STOMP WebSocket ───────────────────────────────
  useEffect(() => {
    if (!role || !email) return;

    fetchAll();

    const client = new Client({
      webSocketFactory: () => new SockJS(API.WS),
      connectHeaders: { Authorization: `Bearer ${getToken()}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe to role-wide channel (e.g. SUPER_ADMIN sees all new requests)
        client.subscribe(`/topic/notifications/${role}`, (msg) => {
          const notif = JSON.parse(msg.body);
          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(c => c + 1);
        });

        // Subscribe to personal channel (approve/reject feedback)
        const safeTopic = `/topic/notifications/user/${email.replace("@", "_at_")}`;
        client.subscribe(safeTopic, (msg) => {
          const notif = JSON.parse(msg.body);
          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(c => c + 1);
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [role, email]);

  // ── Mark all read ─────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await axios.post(`${API.NOTIFICATIONS}/read`, {}, { headers: auth() });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  // ── Mark one read ─────────────────────────────────────────
  const markOneRead = useCallback(async (id) => {
    try {
      await axios.post(`${API.NOTIFICATIONS}/${id}/read`, {}, { headers: auth() });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  return { notifications, unreadCount, markAllRead, markOneRead };p
}