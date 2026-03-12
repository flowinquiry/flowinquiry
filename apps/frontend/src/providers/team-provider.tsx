"use client";

/**
 * Team Provider Module
 *
 * This module provides access to team data throughout the application.
 * It creates a React context that allows components to access the current team's information.
 * The team data is fetched from the server based on the provided team ID.
 */

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { findTeamById } from "@/lib/actions/teams.action";
import { useError } from "@/providers/error-provider";
import { TeamDTO } from "@/types/teams";

/**
 * Props interface for the TeamProvider component
 *
 * @property {number} teamId - The ID of the team to fetch and provide
 * @property {ReactNode} children - Child components that will have access to the team context
 */
interface TeamProviderProps {
  teamId: number;
  children: ReactNode;
}

interface TeamContextValue {
  team: TeamDTO;
  refreshTeam: () => void;
}

/**
 * Create the team context with a default null value
 * This context will be provided by the TeamProvider
 */
const TeamContext = createContext<TeamContextValue | null>(null);

/**
 * Custom hook to access the team context
 *
 * Provides access to the current team's data from any component within the TeamProvider.
 *
 * @returns {TeamDTO} The team data
 * @throws {Error} If used outside of a TeamProvider
 */
export const useTeam = (): TeamDTO => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context.team;
};

/**
 * Custom hook to refresh the team data
 *
 * Provides a function to refresh the current team's data from any component within the TeamProvider.
 *
 * @returns {function} The function to refresh the team data
 * @throws {Error} If used outside of a TeamProvider
 */
export const useTeamRefresh = (): (() => void) => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeamRefresh must be used within a TeamProvider");
  }
  return context.refreshTeam;
};

/**
 * TeamProvider Component
 *
 * Provides team data to the application.
 * Fetches the team information from the server based on the provided team ID.
 * Makes team data available to all child components through the context.
 * Shows a loading indicator while the team data is being fetched.
 *
 * @param {TeamProviderProps} props - Component props
 * @param {number} props.teamId - The ID of the team to fetch
 * @param {ReactNode} props.children - Child components that will have access to the team context
 */
export const TeamProvider: React.FC<TeamProviderProps> = ({
  teamId,
  children,
}) => {
  // State to store the team data
  const [team, setTeam] = useState<TeamDTO | null>(null);
  const { setError } = useError();

  /**
   * Function to fetch team data
   *
   * Fetches the team data from the server and updates the state.
   * This function is exposed through the context to allow manual refreshing of the team data.
   */
  const fetchTeam = useCallback(() => {
    findTeamById(teamId, setError).then((data) => setTeam(data));
  }, [teamId, setError]);

  /**
   * Effect to fetch team data when the component mounts or teamId changes
   */
  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Show loading indicator while team data is being fetched
  if (!team) {
    return <div>Loading...</div>;
  }

  return (
    <TeamContext.Provider value={{ team, refreshTeam: fetchTeam }}>
      {children}
    </TeamContext.Provider>
  );
};
