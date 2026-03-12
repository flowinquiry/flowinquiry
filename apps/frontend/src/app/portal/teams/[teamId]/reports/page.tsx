import { Suspense } from "react";

import TeamReportsView from "@/components/teams/reports/team-reports-view";

const Page = () => {
  // Suspense is required because TeamReportsView uses useSearchParams()
  return (
    <Suspense>
      <TeamReportsView />
    </Suspense>
  );
};

export default Page;
