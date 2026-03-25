import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = window.location.origin;

let globalSocket: Socket | null = null;
const mountedHooks = new Set<string>();

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
      // Connected — id available via globalSocket.id
    });

    globalSocket.on("disconnect", () => {
      // Will auto-reconnect based on reconnection settings
    });

    globalSocket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });
  }
  return globalSocket;
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const idRef = useRef(Math.random().toString(36));

  useEffect(() => {
    mountedHooks.add(idRef.current);
    const s = getSocket();
    setSocket(s);

    return () => {
      mountedHooks.delete(idRef.current);
      if (mountedHooks.size === 0 && globalSocket) {
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
      if (socket) {
        socket.off("new_message", callback);
      }
    };
  }, [socket, callback]);
}
