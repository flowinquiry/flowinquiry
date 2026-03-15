import type { Metadata } from "next";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { TeamList } from "@/components/teams/team-list";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("teams") };
}

const Page = async () => {
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
  ];

  return (
    <SimpleContentView
      title={t.common.navigation("teams")}
      breadcrumbItems={breadcrumbItems}
    >
      <TeamList />
    </SimpleContentView>
  );
};

export default Page;
