import type { Metadata } from "next";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { ProfileForm } from "@/components/forms/profile-form";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("profile") };
}

const Page = async () => {
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("profile"), link: "/portal/profile" },
  ];

  return (
    <SimpleContentView
      title={t.common.navigation("profile")}
      breadcrumbItems={breadcrumbItems}
    >
      <ProfileForm />
    </SimpleContentView>
  );
};

export default Page;
