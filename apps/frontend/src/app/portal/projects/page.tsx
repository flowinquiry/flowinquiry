import React from "react";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import ProjectListView from "@/components/projects/project-list-view";
import { getAppTranslations } from "@/lib/translation";

const Page = async () => {
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("projects"), link: "/portal/projects" },
  ];

  return (
    <ContentLayout title="Projects">
      <Breadcrumbs items={breadcrumbItems} />
      <ProjectListView />
    </ContentLayout>
  );
};

export default Page;
