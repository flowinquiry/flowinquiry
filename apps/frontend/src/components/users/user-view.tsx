"use client";

import {
  Building2,
  CalendarClock,
  Edit,
  Globe,
  Mail,
  MapPin,
  Network,
  User,
} from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { TeamAvatar, UserAvatar } from "@/components/shared/avatar-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OrgChartDialog from "@/components/users/org-chart-dialog";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { findTeamsByMemberId } from "@/lib/actions/teams.action";
import { findUserById, getDirectReports } from "@/lib/actions/users.action";
import { obfuscate } from "@/lib/endecode";
import { safeFormatDistanceToNow } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { PermissionUtils } from "@/types/resources";
import { TeamDTO } from "@/types/teams";
import { UserDTO } from "@/types/users";

export const UserView = ({ userId }: { userId: number }) => {
  const t = useAppClientTranslations();
  const [user, setUser] = useState<UserDTO | undefined | null>(undefined);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [directReports, setDirectReports] = useState<UserDTO[] | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(true);
  const [isOrgChartOpen, setIsOrgChartOpen] = useState(false);
  const router = useRouter();
  const permissionLevel = usePagePermission();
  const { setError } = useError();

  useEffect(() => {
    async function fetchData() {
      try {
        const userData = await findUserById(userId, setError);
        setUser(userData ?? null);
        if (!userData) return;
        const [teamData, reportData] = await Promise.all([
          findTeamsByMemberId(userId, setError),
          getDirectReports(userId, setError),
        ]);
        setTeams(teamData ?? []);
        setDirectReports(reportData ?? []);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4" data-testid="user-view-loading">
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          {/* Left skeleton */}
          <div className="w-full md:w-64 shrink-0 rounded-xl border p-6 flex flex-col items-center gap-4">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
            <div className="w-full space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          {/* Right skeleton */}
          <div className="flex-1 rounded-xl border p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("users"), link: "/portal/users" },
    { title: `${user.firstName} ${user.lastName}`, link: "#" },
  ];

  const location = [user.city, user.state, user.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-4" data-testid="user-view-container">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex flex-col md:flex-row items-start gap-4">
        {/* ── Left panel: profile card ── */}
        <Card className="w-full md:w-64 shrink-0" data-testid="user-info-card">
          <CardHeader className="flex flex-col items-center gap-3 pb-4">
            {/* Avatar + status dot */}
            <div className="relative" data-testid="user-avatar">
              <UserAvatar imageUrl={user.imageUrl} size="w-28 h-28" />
              <span
                className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background ${
                  user.status === "ACTIVE" && !user.isDeleted
                    ? "bg-green-500"
                    : "bg-yellow-400"
                }`}
              />
            </div>

            {/* Name + title */}
            <div className="text-center">
              <p
                className="font-semibold text-base leading-snug"
                data-testid="user-full-name-left"
              >
                {user.firstName} {user.lastName}
              </p>
              {user.title && (
                <p
                  className="text-xs text-muted-foreground mt-0.5"
                  data-testid="user-title"
                >
                  {user.title}
                </p>
              )}
              {(user.status !== "ACTIVE" || user.isDeleted) && (
                <span
                  className="mt-1 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  data-testid="user-inactive-badge"
                >
                  {t.users.common("not_activated")}
                </span>
              )}
            </div>
          </CardHeader>

          <Separator />

          {/* Info rows */}
          <CardContent className="pt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2" data-testid="user-email">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t.users.form("email")}
                </p>
                <Link
                  href={`mailto:${user.email}`}
                  className="truncate text-sm hover:text-primary hover:underline underline-offset-4 transition-colors block"
                >
                  {user.email}
                </Link>
              </div>
            </div>

            {user.timezone && (
              <div
                className="flex items-start gap-2"
                data-testid="user-timezone"
              >
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t.users.form("timezone")}
                  </p>
                  <p className="text-sm">{user.timezone}</p>
                </div>
              </div>
            )}

            {location && (
              <div
                className="flex items-start gap-2"
                data-testid="user-location"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t.users.form("city")} / {t.users.form("country")}
                  </p>
                  <p className="text-sm">{location}</p>
                </div>
              </div>
            )}

            <div
              className="flex items-start gap-2"
              data-testid="user-last-login"
            >
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {t.users.form("last_login_time")}
                </p>
                {user.lastLoginTime ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm cursor-default">
                        {safeFormatDistanceToNow(user.lastLoginTime, {
                          addSuffix: true,
                        })}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      {new Date(user.lastLoginTime).toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <p className="text-sm text-muted-foreground/70">
                    {t.users.common("no_recent_login")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Right panel ── */}
        <Card className="w-full flex-1" data-testid="user-details-card">
          {/* Header: full name + actions */}
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4 border-b">
            <div data-testid="user-full-name">
              <p className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </p>
              {user.title && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.title}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {PermissionUtils.canWrite(permissionLevel) && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/portal/users/${obfuscate(user.id)}/edit`)
                  }
                  data-testid="edit-user-button"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t.common.buttons("edit")}
                </Button>
              )}
              <Button
                onClick={() => setIsOrgChartOpen(true)}
                data-testid="org-chart-button"
              >
                <Network className="mr-2 h-4 w-4" />
                {t.users.common("org_chart")}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex flex-col gap-6">
            {/* About */}
            {user.about && (
              <section data-testid="user-about-section">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  <User className="h-3.5 w-3.5" />
                  {t.users.form("about")}
                </CardTitle>
                <p
                  className="text-sm leading-relaxed"
                  data-testid="user-about-details"
                >
                  {user.about}
                </p>
              </section>
            )}

            {/* Address */}
            {(user.address || user.city || user.state || user.country) && (
              <section data-testid="user-address-section">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  <Building2 className="h-3.5 w-3.5" />
                  {t.users.form("address")}
                </CardTitle>
                <div className="text-sm space-y-0.5">
                  {user.address && (
                    <p data-testid="user-address">{user.address}</p>
                  )}
                  {(user.city || user.state || user.country) && (
                    <p data-testid="user-city-state-country">{location}</p>
                  )}
                </div>
              </section>
            )}

            {/* Reporting */}
            {(user.managerId ||
              (directReports && directReports.length > 0)) && (
              <section data-testid="user-reporting-section">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  <Network className="h-3.5 w-3.5" />
                  {t.users.form("report_to")} / {t.users.form("direct_reports")}
                </CardTitle>

                {user.managerId && (
                  <div className="mb-3" data-testid="user-manager">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {t.users.form("report_to")}
                    </p>
                    <Link
                      href={`/portal/users/${obfuscate(user.managerId)}`}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all hover:shadow-sm hover:bg-muted/50 hover:text-primary"
                      data-testid="manager-link"
                    >
                      <UserAvatar
                        imageUrl={user.managerImageUrl}
                        size="w-5 h-5"
                      />
                      {user.managerName}
                    </Link>
                  </div>
                )}

                {directReports && directReports.length > 0 && (
                  <div data-testid="direct-reports-container">
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {t.users.form("direct_reports")}
                    </p>
                    <div
                      className="flex flex-row flex-wrap gap-2"
                      data-testid="direct-reports-list"
                    >
                      {directReports.map((report) => (
                        <Link
                          key={report.id}
                          href={`/portal/users/${obfuscate(report.id)}`}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all hover:shadow-sm hover:bg-muted/50 hover:text-primary"
                          data-testid={`direct-report-${report.id}`}
                        >
                          <UserAvatar
                            imageUrl={report.imageUrl}
                            size="w-5 h-5"
                          />
                          {report.firstName} {report.lastName}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Teams */}
            <section data-testid="user-teams-section">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                <Building2 className="h-3.5 w-3.5" />
                {t.users.form("member_of_teams")}
              </CardTitle>
              {teams.length > 0 ? (
                <div
                  className="flex flex-row flex-wrap gap-2"
                  data-testid="user-teams-list"
                >
                  {teams.map((team) => (
                    <Link
                      key={team.id}
                      href={`/portal/teams/${obfuscate(team.id)}`}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all hover:shadow-sm hover:bg-muted/50 hover:text-primary"
                      data-testid={`user-team-${team.id}`}
                    >
                      <TeamAvatar imageUrl={team.logoUrl} size="w-5 h-5" />
                      {team.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground/70 italic"
                  data-testid="user-no-teams"
                >
                  {t.common.misc("no_data_available")}
                </p>
              )}
            </section>
          </CardContent>
        </Card>
      </div>

      <OrgChartDialog
        userId={user.id!}
        isOpen={isOrgChartOpen}
        onClose={() => setIsOrgChartOpen(false)}
        data-testid="org-chart-dialog"
      />
    </div>
  );
};
