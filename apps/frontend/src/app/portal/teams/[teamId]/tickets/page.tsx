import type { Metadata } from "next";
import React from "react";

import TicketListView from "@/components/teams/ticket-list-view";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("tickets") };
}

const Page = async () => {
  return <TicketListView />;
};

export default Page;
