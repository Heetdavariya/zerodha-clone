import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// Singleton socket — only 1 connection shared across all components
let socket = null;
const listeners = new Set();
let sharedPrices = {};

function getSocket() {
  if (!socket) {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3002";
    socket = io(BACKEND_URL, { transports: ["websocket"] });

    socket.on("price_snapshot", (data) => {
      sharedPrices = data;
      listeners.forEach((fn) => fn({ ...sharedPrices }));
    });

    socket.on("price_update", (data) => {
      sharedPrices = { ...sharedPrices, ...data };
      listeners.forEach((fn) => fn({ ...sharedPrices }));
    });
  }
  return socket;
}

export default function useLivePrices() {
  const [prices, setPrices] = useState(sharedPrices);

  useEffect(() => {
    getSocket();
    const handler = (p) => setPrices(p);
    listeners.add(handler);
    if (Object.keys(sharedPrices).length > 0) setPrices({ ...sharedPrices });
    return () => listeners.delete(handler);
  }, []);

  return { prices };
}