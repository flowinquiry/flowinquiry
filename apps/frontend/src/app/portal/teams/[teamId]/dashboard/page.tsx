import type { Metadata } from "next";
import React from "react";

import TeamDashboard from "@/components/teams/team-dashboard";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("dashboard") };
}

const Page = async () => {
  return <TeamDashboard />;
};

export default Page;
