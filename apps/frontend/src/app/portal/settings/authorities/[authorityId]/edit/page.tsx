import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import AuthorityForm from "@/components/authorities/authority-form";
import { deobfuscateToString } from "@/lib/endecode";
import { getAppTranslations } from "@/lib/translation";

const Page = async (props: {
  params: Promise<{ authorityId: string | "new" }>;
}) => {
  const params = await props.params;
  const authorityId =
    params.authorityId !== "new"
      ? deobfuscateToString(params.authorityId)
      : undefined;
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    {
      title: t.common.navigation("authorities"),
      link: "/portal/settings/authorities",
    },
    {
      title: authorityId ? t.common.buttons("edit") : t.common.buttons("add"),
      link: "#",
    },
  ];

  return (
    <SimpleContentView
      title={t.common.navigation("authorities")}
      breadcrumbItems={breadcrumbItems}
    >
      <AuthorityForm authorityId={authorityId} />
    </SimpleContentView>
  );
};

export default Page;
