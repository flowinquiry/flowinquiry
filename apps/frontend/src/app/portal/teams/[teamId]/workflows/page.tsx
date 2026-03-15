import type { Metadata } from "next";
import React from "react";

import TeamWorkflowsView from "@/components/teams/team-workflows";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("workflows") };
}

const Page = async () => {
  return <TeamWorkflowsView />;
};

export default Page;
