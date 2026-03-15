"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  /** Icon shown left of the title in the card header */
  icon?: React.ReactNode;
  /** Card section heading */
  title: string;
  /** Whether the card body is visible on first render. Defaults to true */
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** Optional extra content rendered beside the chevron (e.g. a badge or action button) */
  headerAction?: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

const CollapsibleCard = ({
  icon,
  title,
  defaultOpen = true,
  children,
  headerAction,
  className,
  "data-testid": testId,
}: CollapsibleCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={cn("gap-0 py-0", className)} data-testid={testId}>
      <CardHeader className="p-0 border-b pt-2 pb-1! px-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {icon}
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {headerAction}
            <button
              onClick={() => setOpen((o) => !o)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={open ? "Collapse" : "Expand"}
              aria-expanded={open}
            >
              {open ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>
      {open && <CardContent className="p-0 px-2 py-1">{children}</CardContent>}
    </Card>
  );
};

export default CollapsibleCard;
