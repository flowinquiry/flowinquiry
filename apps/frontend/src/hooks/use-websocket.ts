/**
 * WebSocket Hook for Real-time Notifications
 *
 * This hook establishes a WebSocket connection using STOMP protocol to receive
 * real-time notifications for the authenticated user. It handles connection setup,
 * authentication, subscription to user-specific notification channels, and cleanup.
 *
 * The hook manages the WebSocket lifecycle based on user authentication state and
 * maintains a list of received notifications that can be used by components.
 */
import { Client } from "@stomp/stompjs";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { BASE_URL } from "@/lib/constants";
import { NotificationDTO } from "@/types/commons";

/**
 * Custom hook for WebSocket connection and notification management
 * @returns {Object} Object containing notifications array and setter function
 */
const useWebSocket = () => {
  // Extract authentication data from the user session
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;
  const userId = session?.user?.id || null;

  // State to store received notifications
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  // State to store the STOMP client instance
  const [client, setClient] = useState<Client | null>(null);

  /**
   * Set up WebSocket connection when user authentication is available
   * This effect runs when userId or token changes
   */
  useEffect(() => {
    // Skip WebSocket initialization if authentication is missing
    if (!userId || !token) {
      console.warn("❌ WebSocket not initialized: Missing userId or token");
      return;
    }

    // ✅ Convert `http` to `ws`, and `https` to `wss`
    const WEBSOCKET_URL = BASE_URL!.replace(/^http/, "ws") + "/fiws";

    // Create and configure STOMP client
    const stompClient = new Client({
      brokerURL: WEBSOCKET_URL,
      reconnectDelay: 5000, // Retry connection after 5 seconds if disconnected
      connectHeaders: {
        Authorization: `Bearer ${token}`, // Authenticate WebSocket connection
      },
      onConnect: () => {
        console.log("✅ WebSocket Connected for user:", userId);

        // Subscribe to user-specific notification channel
        stompClient.subscribe(
          `/user/${userId}/queue/notifications`,
          (message) => {
            try {
              // Parse and store incoming notifications
              const notification: NotificationDTO = JSON.parse(message.body);
              setNotifications((prev) => [...prev, notification]);
            } catch (error) {
              console.error("❌ Error parsing WebSocket message:", error);
            }
          },
        );
      },
      onStompError: (frame) => {
        console.error("❌ WebSocket STOMP error:", frame);
      },
      onDisconnect: () => console.log("❌ Disconnected from WebSocket"),
    });

    // Activate the WebSocket connection
    stompClient.activate();
    setClient(stompClient);

    // Cleanup function to disconnect WebSocket when component unmounts
    // or when userId/token changes
    return () => {
      stompClient.deactivate();
    };
  }, [userId, token]);

  // Return notifications array and setter function for components to use
  return { notifications, setNotifications };
};

export default useWebSocket;
