import { MenuIcon } from "lucide-react";
import Link from "next/link";

import { Menu } from "@/components/admin-panel/menu";
import AppLogo from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SheetMenu() {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader className="px-1 py-2">
          <Link
            href="/portal"
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted transition-colors"
          >
            <AppLogo className="w-7 h-7 shrink-0" />
            <SheetTitle className="font-bold text-base">FlowInquiry</SheetTitle>
          </Link>
        </SheetHeader>
        <Separator className="mb-2" />
        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
}
