import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on("connect", () => {
        console.log("✅ Socket.IO connected:", socketRef.current?.id);
      });

      socketRef.current.on("disconnect", () => {
        console.log("❌ Socket.IO disconnected");
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
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
