import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { AuthorityView } from "@/components/authorities/authority-view";
import { deobfuscateToString } from "@/lib/endecode";
import { getAppTranslations } from "@/lib/translation";

const Page = async (props: { params: Promise<{ authorityId: string }> }) => {
  const params = await props.params;
  const authorityId = deobfuscateToString(params.authorityId);
  const t = await getAppTranslations();

  return (
    <SimpleContentView title={t.common.navigation("authorities")}>
      <AuthorityView authorityId={authorityId} />
    </SimpleContentView>
  );
};

export default Page;
