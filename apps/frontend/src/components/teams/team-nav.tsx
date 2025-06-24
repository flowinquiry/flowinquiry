"use client";

import {
  Activity,
  ArrowRightCircleIcon,
  FolderKanban,
  Shuffle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { obfuscate } from "@/lib/endecode";
import { useBreadcrumb } from "@/providers/breadcrumb-provider";

const TeamNavLayout = ({
  teamId,
  children,
}: {
  teamId: number;
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const t = useAppClientTranslations();

  const teamFeatures = [
    {
      href: `/portal/teams/${obfuscate(teamId)}/dashboard`,
      label: t.common.navigation("dashboard"),
      icon: Activity,
    },
    {
      href: `/portal/teams/${obfuscate(teamId)}/members`,
      label: t.common.navigation("members"),
      icon: Users,
    },
    {
      href: `/portal/teams/${obfuscate(teamId)}/tickets`,
      label: t.common.navigation("tickets"),
      icon: ArrowRightCircleIcon,
    },
    {
      href: `/portal/teams/${obfuscate(teamId)}/projects`,
      label: t.common.navigation("projects"),
      icon: FolderKanban,
    },
    {
      href: `/portal/teams/${obfuscate(teamId)}/workflows`,
      label: t.common.navigation("workflows"),
      icon: Shuffle,
    },
  ];

  const breadcrumbsItems = useBreadcrumb();

  return (
    <div className="h-full flex flex-col">
      <Breadcrumbs items={breadcrumbsItems} />

      <div className="flex flex-1 gap-4 pt-4">
        <aside className="w-64 bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] h-full">
          <div>
            <nav className="space-y-2">
              {teamFeatures.map((feature) => (
                <Button
                  key={feature.href}
                  asChild
                  variant={
                    pathname.startsWith(feature.href) ? "default" : "ghost"
                  }
                  className="w-full justify-start text-sm font-medium"
                >
                  <Link
                    href={feature.href}
                    className="flex items-center p-2 rounded-md"
                  >
                    <feature.icon className="w-5 h-5 mr-2" />
                    {feature.label}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default TeamNavLayout;
