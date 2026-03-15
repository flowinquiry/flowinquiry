import type { Metadata } from "next";
import React from "react";

import { SimpleContentView } from "@/components/admin-panel/simple-content-view";
import { UserView } from "@/components/users/user-view";
import { deobfuscateToNumber } from "@/lib/endecode";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("users") };
}

const Page = async (props: { params: Promise<{ userId: string }> }) => {
  const params = await props.params;
  const userId = deobfuscateToNumber(params.userId);
  const t = await getAppTranslations();

  return (
    <SimpleContentView title={t.common.navigation("users")}>
      <UserView userId={userId} />
    </SimpleContentView>
  );
};

export default Page;
