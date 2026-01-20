/**
 * SSE Hook for Real-time Notifications
 *
 * This hook establishes a Server-Sent Events (SSE) connection to receive
 * real-time notifications for the authenticated user. It handles connection setup,
 * authentication, subscription to user-specific notification channels, and cleanup.
 *
 * The hook manages the SSE lifecycle based on user authentication state and
 * maintains a list of received notifications that can be used by components.
 */
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { BASE_URL } from "@/lib/constants";
import { NotificationDTO } from "@/types/commons";

/**
 * Custom hook for SSE connection and notification management
 * @returns {Object} Object containing notifications array and setter function
 */
const useSSE = () => {
  // Extract authentication data from the user session
  const { data: session } = useSession();
  const token = session?.user?.accessToken || null;
  const userId = session?.user?.id || null;

  // State to store received notifications
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);

  /**
   * Set up SSE connection when user authentication is available
   * This effect runs when userId or token changes
   */
  useEffect(() => {
    // Skip SSE initialization if authentication is missing
    if (!userId || !token) {
      console.warn("❌ SSE not initialized: Missing userId or token");
      return;
    }

    // Create SSE connection with token as query parameter for authentication
    const sseUrl = `${BASE_URL}/sse/events/${userId}?token=${token}`;
    const eventSource = new EventSource(sseUrl);

    // Handle incoming SSE events based on EventPayloadType.NOTIFICATION
    eventSource.addEventListener("NOTIFICATION", (event) => {
      try {
        // Parse the event data which contains the EventPayload
        const eventData = JSON.parse(event.data);
        const notification: NotificationDTO = eventData.data;
        setNotifications((prev) => [...prev, notification]);
        console.log("✅ Received notification:", notification);
      } catch (error) {
        console.error("❌ Error parsing SSE message:", error);
      }
    });

    // Handle connection open
    eventSource.onopen = () => {
      console.log("✅ SSE Connected for user:", userId);
    };

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
      eventSource.close();
    };

    // Cleanup function to close SSE connection when component unmounts
    // or when userId/token changes
    return () => {
      eventSource.close();
      console.log("❌ Disconnected from SSE");
    };
  }, [userId, token]);

  // Return notifications array and setter function for components to use
  return { notifications, setNotifications };
};

export default useSSE;
