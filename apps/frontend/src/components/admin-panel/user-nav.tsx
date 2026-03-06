"use client";

import {
  BookText,
  CircleUserRound,
  ExternalLink,
  LogOut,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import AppLogo from "@/components/app-logo";
import { UserAvatar } from "@/components/shared/avatar-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getVersion } from "@/lib/actions/shared.action";
import { BASE_URL } from "@/lib/constants";

export function UserNav() {
  const { data: session } = useSession();
  const t = useAppClientTranslations();

  const [versionInfo, setVersionInfo] = useState<{
    version: string;
    edition: string;
  } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    getVersion().then((data) => {
      setVersionInfo(data);
    });
  }, []);

  const menuItems = [
    {
      icon: CircleUserRound,
      label: t.header.nav("profile"),
      href: "/portal/profile",
    },
    {
      icon: BookText,
      label: t.header.nav("user_guide"),
      href: "https://docs.flowinquiry.io/user_guides/introduction",
      target: "_blank",
      external: true,
    },
  ];

  return (
    <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
      <DropdownMenu>
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="relative h-10 w-10 rounded-full p-0"
                >
                  <UserAvatar
                    imageUrl={session?.user?.imageUrl}
                    size="h-10 w-10"
                  />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {session?.user?.firstName} {session?.user?.lastName}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          className="w-56 p-0 shadow-lg"
          align="end"
          forceMount
        >
          {/* User header */}
          <div className="flex items-center gap-3 px-4 py-3">
            <UserAvatar imageUrl={session?.user?.imageUrl} size="h-9 w-9" />
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {session?.user?.firstName} {session?.user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground leading-none mt-1 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <Separator />

          {/* Nav items */}
          <div className="flex flex-col py-1 px-2">
            {menuItems.map(({ icon: Icon, label, href, target, external }) => (
              <Link
                key={label}
                href={href}
                target={target}
                rel={target === "_blank" ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1">{label}</span>
                {external && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}
              </Link>
            ))}

            {/* About — opens dialog */}
            <DialogTrigger asChild>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted">
                <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1">{t.header.nav("about")}</span>
              </div>
            </DialogTrigger>
          </div>

          <Separator />

          {/* Logout */}
          <div className="py-1 px-2">
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-destructive/10"
              onClick={() => signOut({ redirectTo: BASE_URL, redirect: true })}
            >
              <LogOut className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive flex-1">
                {t.header.nav("logout")}
              </span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* About Dialog */}
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Gradient header */}
        <div className="flex flex-col items-center gap-3 bg-linear-to-b from-primary/10 to-background px-6 pt-8 pb-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-md p-3 ring-1 ring-black/5 dark:ring-white/10">
            <AppLogo size={56} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">FlowInquiry</h2>
            {versionInfo && (
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-xs">
                  {versionInfo.edition}
                </Badge>
                <Badge variant="outline" className="text-xs font-mono">
                  v{versionInfo.version}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            {t.header.nav("intro")}
          </p>
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FlowInquiry.{" "}
            {t.header.nav("copyright")}.
          </p>
          <a
            href="https://www.flowinquiry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4 transition-colors"
          >
            flowinquiry.io
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
