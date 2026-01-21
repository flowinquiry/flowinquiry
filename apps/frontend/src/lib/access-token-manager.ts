"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

let cachedAccessToken: string | null = null;

// Client-side hook to manage access token (uses useEffect to avoid side effects during render)
export const useAccessTokenManager = () => {
  const { data: session } = useSession();

  useEffect(() => {
    // Update the cached token when the session changes
    if (session?.accessToken) {
      cachedAccessToken = session.accessToken;
    }
  }, [session?.accessToken]);

  return cachedAccessToken;
};

// Setter function to update the cached token (for server-side use)
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Getter function to access the cached token
export const getAccessToken = (): string => {
  if (!cachedAccessToken) {
    throw new Error("Access token is not available. Ensure user is logged in.");
  }
  return cachedAccessToken;
};

// Optional: Clear the token on logout
export const clearAccessToken = () => {
  cachedAccessToken = null;
};
