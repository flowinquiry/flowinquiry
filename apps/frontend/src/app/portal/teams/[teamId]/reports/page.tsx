import type { Metadata } from "next";
import { Suspense } from "react";

import TeamReportsView from "@/components/teams/reports/team-reports-view";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("reports") };
}

const Page = () => {
  // Suspense is required because TeamReportsView uses useSearchParams()
  return (
    <Suspense>
      <TeamReportsView />
    </Suspense>
  );
};

export default Page;
