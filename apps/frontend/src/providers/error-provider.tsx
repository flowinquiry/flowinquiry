"use client";

/**
 * Error Provider Module
 *
 * This module provides a global error handling mechanism for the application.
 * It creates a React context that allows components to set and display error messages.
 * It also handles special error cases like authentication errors by redirecting to the login page.
 */

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

import { HttpError } from "@/lib/errors";

/**
 * Defines the possible error types that can be handled by the provider
 * Can be a string message, an HttpError object, or null (no error)
 */
type ErrorType = string | HttpError | null;

/**
 * Interface for the Error Context props
 * Provides a method to set errors from anywhere in the application
 */
interface ErrorContextProps {
  setError?: (error: ErrorType) => void; // To set global errors
}

/**
 * Create a context for error handling with an initial undefined value
 */
const ErrorContext = createContext<ErrorContextProps | undefined>(undefined);

/**
 * ErrorProvider Component
 *
 * Provides error handling functionality to the application.
 * Manages error state and displays error messages in a banner.
 * Handles authentication errors by redirecting to the login page.
 * Automatically dismisses error messages after a timeout.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the error context
 */
export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State to store the current error
  const [error, setError] = useState<ErrorType>(null);

  const router = useRouter();

  // Function to dismiss the error banner
  const handleClose = () => setError(null);

  // Compute whether current error is an auth error
  const isAuthError = (() => {
    if (!error) return false;
    const errorMessage =
      typeof error === "string" ? error : error?.message || null;
    return (
      (error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 401) ||
      errorMessage?.includes("Token expired or invalid")
    );
  })();

  /**
   * Effect to handle authentication errors
   * Redirects to login page when a 401 error occurs or token is invalid
   */
  useEffect(() => {
    if (isAuthError) {
      // Redirect to login on HTTP 401 status or token expiration
      router.push("/login");
    }
  }, [isAuthError, router]);

  /**
   * Effect to automatically dismiss error messages after 10 seconds
   */
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000); // 10 seconds
      return () => clearTimeout(timer); // Cleanup the timer on unmount or when error changes
    }
  }, [error]);

  return (
    <ErrorContext.Provider value={{ setError }}>
      {children}
      {/* Error banner that appears at the bottom of the screen when an error is present */}
      {error && (
        <div
          className="fixed bottom-0 left-0 right-0 p-4 bg-red-500 text-white text-center z-50 flex items-center justify-center"
          style={{ minHeight: "50px" }}
        >
          <span className="text-center">
            {isAuthError
              ? "Unauthorized. Redirecting to login..."
              : typeof error === "string"
                ? error
                : error?.message || ""}
          </span>
          <button
            onClick={handleClose}
            className="ml-4 px-4 py-2 bg-white text-red-500 font-bold rounded hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      )}
    </ErrorContext.Provider>
  );
};

/**
 * Custom hook to access the error context
 *
 * Provides access to the error context from any component within the ErrorProvider.
 * Components can use this hook to set global errors.
 *
 * @returns {ErrorContextProps} The error context containing the setError function
 * @throws {Error} If used outside of an ErrorProvider
 */
export const useError = (): ErrorContextProps => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};
