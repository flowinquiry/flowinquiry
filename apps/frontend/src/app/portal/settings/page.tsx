import { ArrowRight, Mail, ShieldCheck, Shuffle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import React from "react";

import { ContentLayout } from "@/components/admin-panel/content-layout";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Heading } from "@/components/heading";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAppTranslations } from "@/lib/translation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getAppTranslations();
  return { title: t.common.navigation("settings") };
}

const Page = async () => {
  const t = await getAppTranslations();

  const breadcrumbItems = [
    { title: t.common.navigation("dashboard"), link: "/portal" },
    { title: t.common.navigation("settings"), link: "/portal/settings" },
  ];

  const settingsItems = [
    {
      id: "authorities",
      href: "/portal/settings/authorities",
      icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />,
      title: t.common.navigation("authorities"),
      description: t.authorities.list("description"),
    },
    {
      id: "workflows",
      href: "/portal/settings/workflows",
      icon: <Shuffle className="h-5 w-5" aria-hidden="true" />,
      title: t.common.navigation("workflows"),
      description: t.workflows.list("description"),
    },
    {
      id: "mail",
      href: "/portal/settings/mail",
      icon: <Mail className="h-5 w-5" aria-hidden="true" />,
      title: t.common.navigation("mail"),
      description: t.mail("description"),
    },
  ];

  return (
    <ContentLayout title={t.common.navigation("settings")}>
      <Breadcrumbs items={breadcrumbItems} />
      <div className="flex flex-col gap-4">
        <Heading
          title={t.common.navigation("settings")}
          description={t.settings.list("description")}
        />
        <Separator />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {settingsItems.map((item) => (
            <Link key={item.id} href={item.href} className="group outline-none">
              <Card className="flex flex-col h-full transition-all group-hover:shadow-md group-hover:bg-muted/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {item.icon}
                  </span>
                  <CardTitle className="text-base group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 text-sm text-muted-foreground">
                  {item.description}
                </CardContent>
                <CardFooter className="border-t pt-3">
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    {t.common.buttons("view")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </ContentLayout>
  );
};

export default Page;
