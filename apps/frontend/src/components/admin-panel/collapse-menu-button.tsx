"use client";

import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
}

export function CollapseMenuButton({
  icon: Icon,
  label,
  active,
  submenus,
  isOpen,
}: CollapseMenuButtonProps) {
  const pathname = usePathname();
  const isSubmenuActive = submenus.some((submenu) =>
    submenu.active === undefined
      ? pathname.startsWith(submenu.href)
      : submenu.active,
  );
  const [isCollapsed, setIsCollapsed] = useState<boolean>(isSubmenuActive);

  return isOpen ? (
    <Collapsible
      open={isCollapsed}
      onOpenChange={setIsCollapsed}
      className="w-full"
    >
      <CollapsibleTrigger
        className="[&[data-state=open]>div>svg.chevron]:rotate-180 w-full mb-0.5"
        asChild
      >
        <div
          className={cn(
            "flex items-center justify-between w-full px-3 h-10 rounded-md cursor-pointer transition-colors border-l-2",
            isSubmenuActive || active
              ? "bg-primary/10 border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Icon size={18} className="shrink-0" />
            <p
              className={cn(
                "text-sm max-w-37.5 truncate transition-all",
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-96",
              )}
            >
              {label}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={cn(
              "chevron shrink-0 transition-transform duration-200",
              isOpen ? "opacity-100" : "opacity-0 -translate-x-96",
            )}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l-2 border-muted pl-3">
          {submenus.map(({ href, label, active }, index) => {
            const isActive =
              (active === undefined && pathname.startsWith(href)) || active;
            return (
              <li key={index}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 h-9 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-current opacity-60" />
                  <p className="max-w-42.5 truncate">{label}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  ) : (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex justify-center items-center h-10 w-auto px-3 mb-0.5 rounded-md cursor-pointer transition-colors border-l-2",
                  isSubmenuActive || active
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon size={18} />
              </div>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="z-50">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        side="right"
        sideOffset={5}
        align="start"
        className="z-40 w-48 p-1"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider max-w-47.5 truncate">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {submenus.map(({ href, label, active }, index) => {
          const isActive =
            (active === undefined && pathname.startsWith(href)) || active;
          return (
            <DropdownMenuItem key={index} asChild>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-current opacity-60" />
                <p className="max-w-45 truncate">{label}</p>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuArrow className="fill-border" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
