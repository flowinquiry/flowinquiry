"use client";

import React from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Separator } from "@/components/ui/separator";
import NewWorkflowFromScratch from "@/components/workflows/workflow-create-from-scratch";
import { useAppClientTranslations } from "@/hooks/use-translations";

const WorkflowNew = () => {
  const t = useAppClientTranslations();
  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    {
      title: t.common.navigation("workflows"),
      link: `/portal/settings/workflows`,
    },
    { title: t.common.buttons("create"), link: "#" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs items={breadcrumbItems} />
      <Separator />
      <NewWorkflowFromScratch />
    </div>
  );
};

export default WorkflowNew;
