import React from "react";

import TeamWorkflowDetailView from "@/components/teams/team-workflow-detail-view";
import { deobfuscateToNumber } from "@/lib/endecode";

const Page = async (props: {
  params: Promise<{ teamId: string; workflowId: string }>;
}) => {
  const params = await props.params;

  return (
    <TeamWorkflowDetailView
      workflowId={deobfuscateToNumber(params.workflowId)}
    />
  );
};

export default Page;
