import type { Metadata } from "next";
import React from "react";

import TicketDetailView from "@/components/teams/ticket-detail-view";
import { findTicketById } from "@/lib/actions/tickets.action";
import { deobfuscateToNumber } from "@/lib/endecode";

interface PageProps {
  params: Promise<{ teamId: string; ticketId: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const ticketId = deobfuscateToNumber(params.ticketId);
  try {
    const ticket = await findTicketById(ticketId);
    return { title: ticket?.requestTitle ?? "Ticket" };
  } catch {
    return { title: "Ticket" };
  }
}

const Page = async (props: PageProps) => {
  const params = await props.params;
  const ticketId = deobfuscateToNumber(params.ticketId);

  return <TicketDetailView ticketId={ticketId} />;
};

export default Page;
