"use client";

/**
 * User Team Role Provider Module
 *
 * This module provides access to the current user's role within a specific team.
 * It creates a React context that allows components to access and update the user's role.
 * The role is fetched from the server based on the user ID and team ID.
 */

import { useSession } from "next-auth/react";
import React, { createContext, useContext, useEffect, useState } from "react";

import { getUserRoleInTeam } from "@/lib/actions/teams.action";
import { useError } from "@/providers/error-provider";
import { TeamRole } from "@/types/teams";

/**
 * Type definition for the User Team Role context
 *
 * @property {TeamRole} role - The user's role within the team (e.g., "admin", "member", "guest")
 * @property {Function} setRole - Function to update the user's role
 */
type UserTeamRoleContextType = {
  role: TeamRole;
  setRole: (role: TeamRole) => void;
};

/**
 * Create the user team role context with a default undefined value
 * This context will be provided by the UserTeamRoleProvider
 */
const UserTeamRoleContext = createContext<UserTeamRoleContextType | undefined>(
  undefined,
);

/**
 * UserTeamRoleProvider Component
 *
 * Provides access to the current user's role within a specific team.
 * Fetches the user's role from the server based on the user ID and team ID.
 * Makes the role available to all child components through the context.
 *
 * @param {Object} props - Component props
 * @param {number} props.teamId - The ID of the team to check the user's role in
 * @param {React.ReactNode} props.children - Child components that will have access to the role context
 */
export const UserTeamRoleProvider: React.FC<{
  teamId: number;
  children: React.ReactNode;
}> = ({ teamId, children }) => {
  // Initialize role state with "guest" as the default role
  const [role, setRole] = useState<TeamRole>("guest");
  const { setError } = useError();
  const { data: session, status } = useSession();

  // Extract user ID from the session
  const userId = session?.user?.id ? Number(session.user.id) : null;

  /**
   * Effect to fetch the user's role in the team when authenticated
   * Only fetches the role if the user is authenticated and has an ID
   */
  useEffect(() => {
    async function fetchTeamRole() {
      if (status === "authenticated" && userId) {
        const roleName = await getUserRoleInTeam(userId, teamId, setError);
        setRole(roleName.role as TeamRole);
      }
    }
    fetchTeamRole();
  }, [teamId, userId, status]);

  return (
    <UserTeamRoleContext.Provider value={{ role, setRole }}>
      {children}
    </UserTeamRoleContext.Provider>
  );
};

/**
 * Custom hook to access the user team role context
 *
 * Provides access to the user's role within the current team from any component
 * within the UserTeamRoleProvider.
 *
 * @returns {UserTeamRoleContextType} The user team role context containing the role and setter function
 * @throws {Error} If used outside of a UserTeamRoleProvider
 */
export const useUserTeamRole = (): UserTeamRoleContextType => {
  const context = useContext(UserTeamRoleContext);
  if (!context) {
    throw new Error(
      "useUserTeamRole must be used within a UserTeamRoleProvider",
    );
  }
  return context;
};
