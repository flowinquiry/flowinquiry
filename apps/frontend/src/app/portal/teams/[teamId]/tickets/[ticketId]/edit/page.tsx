import React from "react";

import { TicketForm } from "@/components/teams/ticket-form";
import { deobfuscateToNumber } from "@/lib/endecode";

const Page = async (props: {
  params: Promise<{ teamId: string; ticketId: string }>;
}) => {
  const params = await props.params;
  const ticketId = deobfuscateToNumber(params.ticketId);

  return <TicketForm ticketId={ticketId} />;
};

export default Page;
