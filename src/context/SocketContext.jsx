import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || "https://realstatesecondtrysocket-3c75c8909778.herokuapp.com", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentUser && socket && isConnected) {
      console.log("Emitting newUser event for:", currentUser.id);
      socket.emit("newUser", currentUser.id);
    }
  }, [currentUser, socket, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
