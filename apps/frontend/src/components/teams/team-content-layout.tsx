"use client";

import { Pencil } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import { Navbar } from "@/components/admin-panel/navbar";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { VersionUpgradeBanner } from "@/components/dashboard/version-upgrade-banner";
import { TeamAvatar } from "@/components/shared/avatar-display";
import TeamNavLayout from "@/components/teams/team-nav";
import TeamNewSheet from "@/components/teams/team-new-sheet";
import { Button } from "@/components/ui/button";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { obfuscate } from "@/lib/endecode";
import { useTeam, useTeamRefresh } from "@/providers/team-provider";
import { PermissionUtils } from "@/types/resources";

/** Map URL segment → translation key (must match navigation keys in en.json) */
const SEGMENT_TO_NAV_KEY: Record<string, string> = {
  dashboard: "dashboard",
  members: "members",
  tickets: "tickets",
  projects: "projects",
  workflows: "workflows",
  reports: "reports",
};

export function TeamContentLayout({ children }: { children: React.ReactNode }) {
  const team = useTeam();
  const refreshTeam = useTeamRefresh();
  const t = useAppClientTranslations();
  const pathname = usePathname();
  const permissionLevel = usePagePermission();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Derive the active team sub-section from the URL
  // URL shape: /portal/teams/[obfuscatedId]/<section>/...
  const segments = pathname.split("/").filter(Boolean);
  const teamIndex = segments.indexOf("teams");
  const sectionSegment = teamIndex !== -1 ? segments[teamIndex + 2] : undefined;
  const navKey = sectionSegment
    ? SEGMENT_TO_NAV_KEY[sectionSegment]
    : undefined;

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    {
      title: team.name,
      link: `/portal/teams/${obfuscate(team.id)}/dashboard`,
    },
    ...(navKey
      ? [{ title: t.common.navigation(navKey as never), link: "#" }]
      : []),
  ];

  return (
    <div className="h-full">
      <VersionUpgradeBanner />
      <Navbar title={team.name} />

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-8 pt-4 pb-12">
        <div
          className="rounded-xl border bg-background flex flex-col"
          style={{ minHeight: "calc(100vh - 4rem - 6rem)" }}
        >
          {/* ── Breadcrumbs ── */}
          <div className="px-6 pt-5 pb-3">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          {/* ── Team identity strip + Edit button ── */}
          <div className="flex items-center justify-between gap-3 px-6 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <TeamAvatar imageUrl={team.logoUrl} size="w-9 h-9" />
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">
                  {team.name}
                </p>
                {team.slogan && (
                  <p className="text-xs text-muted-foreground truncate">
                    {team.slogan}
                  </p>
                )}
              </div>
            </div>
            {PermissionUtils.canWrite(permissionLevel) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSheetOpen(true)}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                {t.teams.dashboard("edit_team")}
              </Button>
            )}
          </div>

          {/* ── Horizontal tab navigation ── */}
          <div className="px-6">
            <TeamNavLayout teamId={team.id!} />
          </div>

          {/* ── Page content ── */}
          <div className="flex-1 p-6 flex flex-col gap-4">{children}</div>
        </div>
      </div>

      <TeamNewSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        teamId={team.id!}
        onCreated={refreshTeam}
      />
    </div>
  );
}
