import type { Metadata } from "next";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import RecentUserTeamActivities from "@/components/dashboard/global-dashboard-recent-activities";
import UserNotifications from "@/components/dashboard/notifications-user";
import TeamUnresolvedTicketsPriorityDistributionChart from "@/components/dashboard/team-unresolved-tickets-priority-distribution";
import UserTeamsOverdueTickets from "@/components/dashboard/user-tickets-overdue";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("dashboard") };
}

const Page = async () => {
  const t = await getAppTranslations();

  return (
    <ContentLayout title="Dashboard">
      <h1 className="text-2xl font-semibold mb-6">
        {t.common.navigation("dashboard")}
      </h1>

      {/* Activities + Notifications: full-width stacked so unequal heights never clash */}
      <div className="flex flex-col gap-4 mb-4">
        <RecentUserTeamActivities />
        <UserNotifications />
      </div>

      {/* Charts: always similar height so 2-col grid is safe */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamUnresolvedTicketsPriorityDistributionChart />
        <UserTeamsOverdueTickets />
      </div>
    </ContentLayout>
  );
};

export default Page;
