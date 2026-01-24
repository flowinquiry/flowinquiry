"use client";

import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITIES_ORDERED,
  PRIORITY_CONFIG,
} from "@/lib/constants/ticket-priorities";
import { TicketPriority } from "@/types/tickets";

export const TicketPrioritySelect = ({
  value,
  onChange,
}: {
  value: TicketPriority;
  onChange: (value: TicketPriority) => void;
}) => {
  const priorityKey = value as TicketPriority;

  // Create a PriorityItem component for consistent rendering
  const PriorityItem = ({ priority }: { priority: TicketPriority }) => {
    const itemConfig = PRIORITY_CONFIG[priority];
    return (
      <div className="flex items-center gap-2">
        <span className={itemConfig.iconColor}>{itemConfig.icon}</span>
        <span className={`${itemConfig.textColor} font-medium`}>
          {priority}
        </span>
      </div>
    );
  };

  return (
    <Select
      value={value}
      onValueChange={(value: TicketPriority) => onChange(value)}
    >
      <SelectTrigger className="w-[16rem]">
        <SelectValue>
          <PriorityItem priority={priorityKey} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PRIORITIES_ORDERED.map((priority) => (
          <SelectItem key={priority} value={priority}>
            <PriorityItem priority={priority} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
