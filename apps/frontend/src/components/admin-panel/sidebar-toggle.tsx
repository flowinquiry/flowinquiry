import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  isOpen: boolean | undefined;
  setIsOpen?: () => void;
}

export function SidebarToggle({ isOpen, setIsOpen }: SidebarToggleProps) {
  return (
    <div className="invisible lg:visible absolute top-[20px] -right-[14px] z-20">
      <Button
        onClick={() => setIsOpen?.()}
        className="rounded-full w-7 h-7 shadow-md border border-border/80 bg-background hover:bg-muted"
        variant="outline"
        size="icon"
      >
        <ChevronLeft
          className={cn(
            "h-3.5 w-3.5 transition-transform ease-in-out duration-300",
            isOpen === false ? "rotate-180" : "rotate-0",
          )}
        />
      </Button>
    </div>
  );
}
