import { useState, useEffect, useRef } from 'react';

// Basic UUID generator for the client
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function useGameWebSocket(roomId) {
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  
  // Persist user ID and session token in sessionStorage per room (per tab)
  const getStoredId = (key) => sessionStorage.getItem(`cards304_${key}_${roomId}`);
  const setStoredId = (key, val) => sessionStorage.setItem(`cards304_${key}_${roomId}`, val);

  const userId = useRef(getStoredId('userid') || generateUUID());
  const sessionToken = useRef(getStoredId('sessionToken') || generateUUID());

  useEffect(() => {
    if (!roomId) return;
    
    setStoredId('userid', userId.current);
    setStoredId('sessionToken', sessionToken.current);

    const connect = () => {
        const baseUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8015/ws";
        const wsUrl = `${baseUrl}/room/${roomId}?user_id=${userId.current}&session_token=${sessionToken.current}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            setConnected(true);
        };
        
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setGameState(data);
        };

        ws.current.onclose = () => {
            setConnected(false);
            reconnectTimeout.current = setTimeout(connect, 3000);
        };
    };

    connect();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
          ws.current.onclose = null; // prevent reconnect loop on unmount
          ws.current.close();
      }
    };
  }, [roomId]);

  const sendAction = (action) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(action));
    }
  };

  return { gameState, connected, sendAction, userId: userId.current };
}
