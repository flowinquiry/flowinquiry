import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import WorkflowDetailView from "@/components/workflows/workflow-detail-view";
import { deobfuscateToNumber } from "@/lib/endecode";
import { getAppTranslations } from "@/lib/translation";

const Page = async (props: { params: Promise<{ workflowId: string }> }) => {
  const params = await props.params;
  const workflowId = deobfuscateToNumber(params.workflowId);
  const t = await getAppTranslations();

  return (
    <SimpleContentView title={t.common.navigation("workflows")}>
      <WorkflowDetailView workflowId={workflowId} />
    </SimpleContentView>
  );
};

export default Page;
