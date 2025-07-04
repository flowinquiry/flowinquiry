import { ContentLayout } from "@/components/admin-panel/content-layout";
import { getAppTranslations } from "@/lib/translation";

const Page = async () => {
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("projects"), link: "/portal/projects" },
  ];

  return (
    <ContentLayout title="Projects">
      <h1 className="text-2xl mb-4">{t.common.navigation("dashboard")}</h1>
    </ContentLayout>
  );
};

export default Page;
