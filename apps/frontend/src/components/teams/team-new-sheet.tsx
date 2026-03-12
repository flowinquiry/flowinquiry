"use client";

import React from "react";

import { TeamForm } from "@/components/teams/team-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppClientTranslations } from "@/hooks/use-translations";

interface TeamNewSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  /** Pass a teamId to edit an existing team instead of creating a new one */
  teamId?: number;
}

const TeamNewSheet = ({
  open,
  onClose,
  onCreated,
  teamId,
}: TeamNewSheetProps) => {
  const t = useAppClientTranslations();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className={[
          // Override default bottom sheet to sit bottom-right
          "!inset-auto !bottom-4 !right-4 !left-auto !top-auto",
          "w-full sm:w-[420px]",
          "max-h-[85vh] overflow-hidden",
          "rounded-xl border shadow-xl",
          "p-0 flex flex-col",
        ].join(" ")}
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>
            {teamId ? t.teams.dashboard("edit_team") : t.teams.list("new_team")}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="overflow-y-auto">
          <div className="px-6 py-5">
            <TeamForm
              teamId={teamId}
              isSheet
              onCancel={onClose}
              onSuccess={() => {
                onCreated();
                onClose();
              }}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default TeamNewSheet;
