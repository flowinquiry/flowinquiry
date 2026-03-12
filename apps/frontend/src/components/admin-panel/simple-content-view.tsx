import React from "react";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { BreadcrumbItemProps, Breadcrumbs } from "@/components/breadcrumbs";

interface ISimpleContentViewProps {
  title: string;
  breadcrumbItems?: BreadcrumbItemProps[];
  children: React.ReactNode;
}

export const SimpleContentView: React.FC<ISimpleContentViewProps> = ({
  title,
  breadcrumbItems,
  children,
}) => {
  return (
    <ContentLayout title={title}>
      <div
        className="rounded-xl border bg-background p-6 flex flex-col gap-4"
        style={{ minHeight: "calc(100vh - 4rem - 6rem)" }}
      >
        {breadcrumbItems && <Breadcrumbs items={breadcrumbItems} />}
        <div className="flex flex-col flex-1">{children}</div>
      </div>
    </ContentLayout>
  );
};
