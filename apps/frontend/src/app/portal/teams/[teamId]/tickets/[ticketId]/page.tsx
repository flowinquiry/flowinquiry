import React from "react";

import TicketDetailView from "@/components/teams/ticket-detail-view";
import { deobfuscateToNumber } from "@/lib/endecode";

interface PageProps {
  params: Promise<{ teamId: string; ticketId: string }>;
}

const Page = async (props: PageProps) => {
  const params = await props.params;
  const ticketId = deobfuscateToNumber(params.ticketId);

  return <TicketDetailView ticketId={ticketId} />;
};

export default Page;
