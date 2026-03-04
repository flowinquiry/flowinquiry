"use client";

import React, { createContext, useContext, useState } from "react";
import { DateRange } from "react-day-picker";

// Define time range options
export type TimeRange = "7d" | "14d" | "30d" | "90d" | "custom";

interface TimeRangeContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange, dates?: DateRange) => void;
  customDates?: DateRange;
}

const TimeRangeContext = createContext<TimeRangeContextType | null>(null);

// Hook for accessing the time range context
export const useTimeRange = () => {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error("❌ useTimeRange must be used within a TimeRangeProvider");
  }
  return context;
};

export const TimeRangeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [timeRange, setTimeRangeState] = useState<TimeRange>("7d");
  const [customDates, setCustomDates] = useState<DateRange | undefined>(
    undefined,
  );

  const setTimeRange = (range: TimeRange, dates?: DateRange) => {
    setTimeRangeState(range);
    setCustomDates(dates);
  };

  return (
    <TimeRangeContext.Provider value={{ timeRange, setTimeRange, customDates }}>
      {children}
    </TimeRangeContext.Provider>
  );
};
