import type { Metadata } from "next";
import React, { Suspense } from "react";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import ProjectView from "@/components/projects/project-view";
import { getAppTranslations } from "@/lib/translation";

interface ProjectDetailPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("projects") };
}

const ProjectDetailPage = async (props: ProjectDetailPageProps) => {
  const params = await props.params;
  const t = await getAppTranslations();

  return (
    <ContentLayout title={t.common.navigation("projects")}>
      <Suspense>
        <ProjectView projectShortName={params.projectId} />
      </Suspense>
    </ContentLayout>
  );
};

export default ProjectDetailPage;
