import React from "react";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import TeamProjectListView from "@/components/projects/team-project-list-view";
import { getAppTranslations } from "@/lib/translation";

const Page = async () => {
  const t = await getAppTranslations();

  return (
    <ContentLayout title={t.common.navigation("teams")}>
      <TeamProjectListView />
    </ContentLayout>
  );
};

export default Page;
