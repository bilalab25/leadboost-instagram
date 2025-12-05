import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = window.location.origin;

let globalSocket: Socket | null = null;
let connectionCount = 0;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    globalSocket.on("connect", () => {
      console.log("✅ Socket.IO connected:", globalSocket?.id);
    });

    globalSocket.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
    });

    globalSocket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });
  }
  return globalSocket;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    connectionCount++;
    const s = getSocket();
    setSocket(s);

    return () => {
      connectionCount--;
      if (connectionCount === 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, []);

  return socket;
}

export function useBrandSocket(brandId: string | null) {
  const socket = useSocket();
  const joinedRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!socket || !brandId) return;

    // Leave previous room if different
    if (joinedRoomRef.current && joinedRoomRef.current !== brandId) {
      socket.emit("leave_brand", joinedRoomRef.current);
    }

    // Join new room
    socket.emit("join_brand", brandId);
    joinedRoomRef.current = brandId;
    console.log(`📢 Joining brand room: ${brandId}`);

    return () => {
      if (joinedRoomRef.current) {
        socket.emit("leave_brand", joinedRoomRef.current);
        joinedRoomRef.current = null;
      }
    };
  }, [socket, brandId]);

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
