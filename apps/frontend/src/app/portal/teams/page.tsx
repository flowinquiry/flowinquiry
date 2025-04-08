import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { TeamList } from "@/components/teams/team-list";
import { getAppTranslations } from "@/lib/translation";

const Page = async () => {
  const t = await getAppTranslations("en");

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
