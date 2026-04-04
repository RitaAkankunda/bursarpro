import { useCallback, useEffect, useRef, useState } from 'react';

const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Get WebSocket URL based on environment
  const getWebSocketURL = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to backend WebSocket server on port 8000
    return `${protocol}//localhost:8000/ws/notifications/`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const wsURL = getWebSocketURL();
      console.log('Connecting to WebSocket:', wsURL);

      wsRef.current = new WebSocket(wsURL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Send auth token
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          if (data.type === 'notification') {
            setNotifications(prev => [
              {
                id: Math.random(),
                ...data.data,
                timestamp: data.timestamp
              },
              ...prev.slice(0, 49) // Keep last 50
            ]);
          } else if (data.type === 'alert') {
            setNotifications(prev => [
              {
                id: Math.random(),
                type: 'alert',
                ...data.data,
                timestamp: data.timestamp
              },
              ...prev.slice(0, 49)
            ]);
          } else if (data.type === 'connection.established') {
            console.log('WebSocket connection established');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          console.log(`Attempting to reconnect in ${delay}ms...`);
          reconnectAttemptsRef.current += 1;
          setTimeout(connect, delay);
        } else {
          setConnectionError('Failed to establish WebSocket connection');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setConnectionError('Failed to create WebSocket');
    }
  }, [getWebSocketURL]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Send message to server
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    sendMessage({
      type: 'mark_read',
      notification_id: notificationId
    });
  }, [sendMessage]);

  // Dismiss alert
  const dismissAlert = useCallback((alertId) => {
    sendMessage({
      type: 'dismiss_alert',
      alert_id: alertId
    });
  }, [sendMessage]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove specific notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    notifications,
    isConnected,
    connectionError,
    sendMessage,
    markAsRead,
    dismissAlert,
    clearNotifications,
    removeNotification,
    connect,
    disconnect
  };
};

export default useRealtimeNotifications;
