"use client";

/**
 * Permissions Provider Module
 *
 * This module provides a global permissions management system for the application.
 * It creates a React context that allows components to access user permissions
 * and check if the current user has access to specific resources.
 * Permissions are fetched from the server when the user is authenticated.
 */

import { useSession } from "next-auth/react";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAccessTokenManager } from "@/lib/access-token-manager";
import { getUserPermissions } from "@/lib/actions/users.action";
import { useError } from "@/providers/error-provider";
import { PermissionLevel, ResourceId } from "@/types/resources";

/**
 * Permission type definition
 *
 * @property {ResourceId} resourceName - The identifier of the resource
 * @property {PermissionLevel} permission - The level of access the user has to the resource
 */
export type Permission = {
  resourceName: ResourceId;
  permission: PermissionLevel;
};

/**
 * Interface defining the shape of the permissions context
 *
 * @property {Permission[]} permissions - Array of user permissions
 * @property {Function} setPermissions - Function to update the permissions array
 */
interface PermissionsContextType {
  permissions: Permission[];
  setPermissions: (permissions: Permission[]) => void;
}

/**
 * Create the permissions context with a default undefined value
 * This context will be provided by the PermissionsProvider
 */
const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined,
);

/**
 * Custom hook to access the permissions context
 *
 * Provides access to the user's permissions from any component within the PermissionsProvider.
 * Components can use this hook to check if the user has access to specific resources.
 *
 * @returns {PermissionsContextType} The permissions context containing the permissions array and setter function
 * @throws {Error} If used outside of a PermissionsProvider
 */
export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};

/**
 * Props interface for the PermissionsProvider component
 *
 * @property {ReactNode} children - Child components that will have access to the permissions context
 */
interface PermissionsProviderProps {
  children: ReactNode;
}

/**
 * PermissionsProvider Component
 *
 * Provides permissions management functionality to the application.
 * Fetches the user's permissions from the server when authenticated.
 * Makes permissions available to all child components through the context.
 *
 * @param {PermissionsProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the permissions context
 */
export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({
  children,
}) => {
  const { setError } = useError();
  const { data: session, status } = useSession();
  // State to store the user's permissions
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Extract user ID from the session
  const userId = session?.user?.id ? Number(session.user.id) : null;

  // Ensure the access token is available for API requests
  useAccessTokenManager();

  /**
   * Effect to fetch user permissions when authenticated
   * Only fetches permissions if the user is authenticated, has an ID, and permissions haven't been loaded yet
   */
  useEffect(() => {
    if (status === "authenticated" && userId && permissions.length === 0) {
      getUserPermissions(userId, setError).then(setPermissions);
    }
  }, [status, userId, permissions]);

  // Don't render anything until the session is fully loaded to avoid potential issues
  if (status === "loading") return null;

  return (
    <PermissionsContext.Provider value={{ permissions, setPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
};
