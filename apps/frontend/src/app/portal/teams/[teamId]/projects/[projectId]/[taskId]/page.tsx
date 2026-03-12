import React from "react";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import TicketDetailView from "@/components/teams/ticket-detail-view";
import { getAppTranslations } from "@/lib/translation";

interface ProjectTaskDetailProps {
  params: Promise<{ teamId: string; projectId: string; taskId: number }>;
}

const ProjectTaskDetailPage = async (props: ProjectTaskDetailProps) => {
  const params = await props.params;
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("teams"), link: "/portal/teams" },
    {
      title: t.common.navigation("projects"),
      link: `/portal/teams/${params.teamId}/projects`,
    },
    {
      title: t.common.navigation("tickets"),
      link: `/portal/teams/${params.teamId}/projects/${params.projectId}`,
    },
  ];

  return (
    <SimpleContentView
      title={t.common.navigation("tickets")}
      breadcrumbItems={breadcrumbItems}
    >
      <TicketDetailView ticketId={params.taskId} />
    </SimpleContentView>
  );
};

export default ProjectTaskDetailPage;
