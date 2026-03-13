"use client";

import { BookOpen } from "lucide-react";
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

      {/* Documentation banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
        <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          New to workflows? Learn how to create and manage workflows
          effectively.{" "}
          <a
            href="https://docs.flowinquiry.io/user_guides/workflow_management"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-200"
          >
            View workflow management guide →
          </a>
        </span>
      </div>

      <NewWorkflowFromScratch />
    </div>
  );
};

export default WorkflowNew;
