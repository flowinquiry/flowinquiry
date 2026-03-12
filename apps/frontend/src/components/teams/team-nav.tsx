"use client";

import {
  Activity,
  ArrowRightCircleIcon,
  BarChart2,
  FolderKanban,
  Shuffle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppClientTranslations } from "@/hooks/use-translations";
import { obfuscate } from "@/lib/endecode";
import { cn } from "@/lib/utils";

const TeamNavLayout = ({ teamId }: { teamId: number }) => {
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
    {
      href: `/portal/teams/${obfuscate(teamId)}/reports`,
      label: t.common.navigation("reports"),
      icon: BarChart2,
    },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-0">
      {teamFeatures.map((feature) => {
        const isActive = pathname.startsWith(feature.href);
        return (
          <Link
            key={feature.href}
            href={feature.href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40",
            )}
          >
            <feature.icon className="w-4 h-4 shrink-0" />
            {feature.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default TeamNavLayout;
