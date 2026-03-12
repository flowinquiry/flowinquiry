"use client";

import { usePathname } from "next/navigation";
import React from "react";

import { TeamContentLayout } from "@/components/teams/team-content-layout";

/** Renders TeamContentLayout (tabs) for tab pages, bare children for standalone pages */
export function TeamLayoutSwitcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Match /projects/<segment> — detail pages that bypass the tab chrome
  const isStandalone = /\/projects\/[^/]+/.test(pathname);

  if (isStandalone) {
    return <>{children}</>;
  }

  return <TeamContentLayout>{children}</TeamContentLayout>;
}
