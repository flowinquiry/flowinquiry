import React from "react";

import ProjectView from "@/components/projects/project-view";

interface ProjectDetailPageProps {
  params: Promise<{ teamId: string; projectId: string }>;
}

const ProjectDetailPage = async (props: ProjectDetailPageProps) => {
  const params = await props.params;

  return <ProjectView projectShortName={params.projectId} />;
};

export default ProjectDetailPage;
