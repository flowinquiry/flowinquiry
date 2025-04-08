import React from "react";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { AuthoritiesView } from "@/components/authorities/authority-list";
import { getAppTranslations } from "@/lib/translation";

const Page = async () => {
  const t = await getAppTranslations("en");

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("settings"), link: "/portal/settings" },
    {
      title: t.common.navigation("authorities"),
      link: "/portal/settings/authorities",
    },
  ];

  return (
    <SimpleContentView
      title={t.common.navigation("authorities")}
      breadcrumbItems={breadcrumbItems}
    >
      <AuthoritiesView />
    </SimpleContentView>
  );
};

export default Page;
