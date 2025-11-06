import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = window.location.origin;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket.IO connected:", newSocket.id);
      setSocket(newSocket); // Trigger re-render when connected
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Set socket immediately so listeners can attach
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, []);

  return socket;
}

interface NewMessageEvent {
  provider: string;
  conversationId: string;
  message: any;
}

export function useNewMessageListener(
  callback: (event: NewMessageEvent) => void
) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", callback);

    return () => {
      socket.off("new_message", callback);
    };
  }, [socket, callback]);
}
