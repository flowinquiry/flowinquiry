import type { Metadata } from "next";
import React from "react";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import ProjectListView from "@/components/projects/project-list-view";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("projects") };
}

const Page = async () => {
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("projects"), link: "/portal/projects" },
  ];

  return (
    <SimpleContentView
      title={t.common.navigation("projects")}
      breadcrumbItems={breadcrumbItems}
    >
      <ProjectListView />
    </SimpleContentView>
  );
};

export default Page;
