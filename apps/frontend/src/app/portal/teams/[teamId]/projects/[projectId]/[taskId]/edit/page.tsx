import React from "react";

import { TicketForm } from "@/components/teams/ticket-form";
import { deobfuscateToNumber } from "@/lib/endecode";

const Page = async (props: {
  params: Promise<{ teamId: string; projectId: string; taskId: string }>;
}) => {
  const params = await props.params;
  const ticketId = deobfuscateToNumber(params.taskId);

  return <TicketForm ticketId={ticketId} />;
};

export default Page;
