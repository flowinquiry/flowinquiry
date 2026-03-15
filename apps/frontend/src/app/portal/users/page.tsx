import type { Metadata } from "next";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { UserList } from "@/components/users/user-list";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("users") };
}

const Page = async () => {
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("users"), link: "/portal/users" },
  ];

  return (
    <SimpleContentView
      title={t.common.navigation("users")}
      breadcrumbItems={breadcrumbItems}
    >
      <UserList />
    </SimpleContentView>
  );
};

export default Page;
