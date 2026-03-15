import type { Metadata } from "next";
import React from "react";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import MyTicketsView from "@/components/my/my-tickets";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("my_tickets") };
}

const Page = async () => {
  const t = await getAppTranslations();
  return (
    <SimpleContentView title={t.common.navigation("my_tickets")}>
      <MyTicketsView />
    </SimpleContentView>
  );
};

export default Page;
