import React from "react";

import TicketDetailView from "@/components/teams/ticket-detail-view";

interface ProjectTaskDetailProps {
  params: Promise<{ teamId: string; projectId: string; taskId: number }>;
}

const ProjectTaskDetailPage = async (props: ProjectTaskDetailProps) => {
  const params = await props.params;

  return <TicketDetailView ticketId={params.taskId} />;
};

export default ProjectTaskDetailPage;
