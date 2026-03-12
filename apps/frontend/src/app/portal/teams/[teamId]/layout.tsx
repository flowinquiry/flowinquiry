import React from "react";

import { TeamContentLayout } from "@/components/teams/team-content-layout";
import { deobfuscateToNumber } from "@/lib/endecode";
import { TeamProvider } from "@/providers/team-provider";
import { UserTeamRoleProvider } from "@/providers/user-team-role-provider";

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) => {
  const resolvedParams = await params;

  const teamIdNum =
    resolvedParams.teamId === "new"
      ? null
      : deobfuscateToNumber(resolvedParams.teamId);

  if (teamIdNum == null) {
    return children;
  }

  return (
    <TeamProvider teamId={teamIdNum}>
      <UserTeamRoleProvider teamId={teamIdNum}>
        <TeamContentLayout>{children}</TeamContentLayout>
      </UserTeamRoleProvider>
    </TeamProvider>
  );
};

export default Layout;
