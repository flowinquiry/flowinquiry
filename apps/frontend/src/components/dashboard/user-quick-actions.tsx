"use client";

import { CheckCircle, ClipboardList, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const actions = [
  {
    key: "reported_tickets",
    icon: FileText,
    route: "/portal/my/tickets?ticketType=reported",
  },
  {
    key: "assigned_tickets",
    icon: CheckCircle,
    route: "/portal/my/tickets?ticketType=assigned",
  },
] as const;

export function UserQuickAction() {
  const router = useRouter();
  const compT = useTranslations("header.my_tickets");

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative h-10 w-10 rounded-full"
              aria-label={compT("title")}
            >
              <ClipboardList className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{compT("title")}</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-52 p-0 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{compT("title")}</span>
        </div>

        <Separator />

        {/* Items */}
        <div className="flex flex-col py-1 px-2">
          {actions.map(({ key, icon: Icon, route }) => (
            <div
              key={key}
              onClick={() => router.push(route)}
              className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors hover:bg-muted"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">{compT(key)}</span>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
