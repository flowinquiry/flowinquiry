"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { CollapseMenuButton } from "@/components/admin-panel/collapse-menu-button";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMenuList } from "@/lib/menu-list";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/providers/permissions-provider";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = usePathname();
  const permissions = usePermissions()?.permissions;

  const comT = useTranslations("common.navigation");
  const menuList = getMenuList(pathname, permissions, comT);

  return (
    <ScrollArea>
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col items-start space-y-1 px-2 max-h-[calc(100vh-48px-36px)] lg:max-h-[calc(100vh-32px-40px)]">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={10}
                      className="z-50"
                    >
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) =>
                  !submenus || submenus.length === 0 ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                (active === undefined &&
                                  (href === "/portal"
                                    ? pathname === "/portal" ||
                                      pathname === "/portal/dashboard"
                                    : pathname.startsWith(href))) ||
                                active
                                  ? "default"
                                  : "ghost"
                              }
                              className={cn(
                                "h-10 mb-1",
                                isOpen === false
                                  ? "justify-center"
                                  : "w-full justify-start",
                              )}
                              asChild
                            >
                              <Link
                                href={href}
                                className={cn(
                                  isOpen === false
                                    ? "flex justify-center w-auto px-3"
                                    : "w-full",
                                )}
                              >
                                <span
                                  className={cn(isOpen === false ? "" : "mr-4")}
                                >
                                  <Icon size={18} />
                                </span>
                                {isOpen !== false && (
                                  <p className="max-w-[200px] truncate">
                                    {label}
                                  </p>
                                )}
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent
                              side="right"
                              sideOffset={10}
                              className="z-50"
                            >
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={
                          active === undefined
                            ? href === "/portal"
                              ? pathname === "/portal" ||
                                pathname === "/portal/dashboard"
                              : pathname.startsWith(href)
                            : active
                        }
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  ),
              )}
            </li>
          ))}
        </ul>
      </nav>
    </ScrollArea>
  );
}
