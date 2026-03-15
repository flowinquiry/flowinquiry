import type { Metadata } from "next";
import React from "react";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { MailSettings } from "@/components/mail/mail-settings";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("mail") };
}

const Page = async () => {
  const t = await getAppTranslations();
  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("settings"), link: "/portal/settings" },
    {
      title: t.common.navigation("mail"),
      link: "/portal/settings/mail",
    },
  ];
  return (
    <SimpleContentView
      title={t.common.navigation("mail")}
      breadcrumbItems={breadcrumbItems}
    >
      <MailSettings />
    </SimpleContentView>
  );
};

export default Page;
