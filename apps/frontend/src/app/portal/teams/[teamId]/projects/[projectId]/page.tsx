import React, { Suspense } from "react";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import ProjectView from "@/components/projects/project-view";
import { getAppTranslations } from "@/lib/translation";

interface ProjectDetailPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

const ProjectDetailPage = async (props: ProjectDetailPageProps) => {
  const params = await props.params;
  const t = await getAppTranslations();

  return (
    <SimpleContentView title={t.common.navigation("projects")}>
      <Suspense>
        <ProjectView projectShortName={params.projectId} />
      </Suspense>
    </SimpleContentView>
  );
};

export default ProjectDetailPage;
