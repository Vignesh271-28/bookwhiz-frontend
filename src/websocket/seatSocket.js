import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let client = null;

export const connectSeatSocket = (showId, onMessage) => {
  if (client) client.deactivate();

  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    reconnectDelay: 3000, // ✅ auto reconnect
    onConnect: () => {
      client.subscribe(`/topic/seats/${showId}`, msg =>
        onMessage(JSON.parse(msg.body))
      );
    }
  });

  client.activate();
};

export const disconnectSeatSocket = () => {
  if (client) {
    client.deactivate();
    client = null;
  }
};