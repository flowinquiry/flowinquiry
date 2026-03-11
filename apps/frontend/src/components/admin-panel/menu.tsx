"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { CollapseMenuButton } from "@/components/admin-panel/collapse-menu-button";
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
      <nav className="mt-4 h-full w-full">
        <ul className="flex flex-col items-start space-y-0.5 px-2 max-h-[calc(100vh-48px-36px)] lg:max-h-[calc(100vh-32px-40px)]">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-4" : "")} key={index}>
              {/* Group label */}
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 pb-1.5 max-w-62 truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center py-1">
                        <Ellipsis className="h-4 w-4 text-muted-foreground/50" />
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
                <p className="pb-1" />
              )}

              {/* Menu items */}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) => {
                  const isActive =
                    (active === undefined &&
                      (href === "/portal"
                        ? pathname === "/portal" ||
                          pathname === "/portal/dashboard"
                        : pathname.startsWith(href))) ||
                    active;

                  return !submenus || submenus.length === 0 ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Link
                              href={href}
                              className={cn(
                                "flex items-center rounded-md transition-colors mb-0.5",
                                "border-l-2",
                                isOpen === false
                                  ? "justify-center px-3 h-10 w-auto border-transparent hover:bg-muted"
                                  : "w-full px-3 h-10",
                                isActive
                                  ? "bg-primary/10 border-primary text-primary font-medium"
                                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <span
                                className={cn(isOpen === false ? "" : "mr-3")}
                              >
                                <Icon size={18} />
                              </span>
                              {isOpen !== false && (
                                <p className="max-w-50 truncate text-sm">
                                  {label}
                                </p>
                              )}
                            </Link>
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
                  );
                },
              )}
            </li>
          ))}
        </ul>
      </nav>
    </ScrollArea>
  );
}
