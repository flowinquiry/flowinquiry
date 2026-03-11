import { SheetMenu } from "@/components/admin-panel/sheet-menu";
import { UserNav } from "@/components/admin-panel/user-nav";
import NotificationsDropdown from "@/components/dashboard/notifications-dropdown";
import { UserQuickAction } from "@/components/dashboard/user-quick-actions";
import LocaleSwitcher from "@/components/shared/locale-switcher";
import { Separator } from "@/components/ui/separator";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-sm border-b border-border/60 shadow-sm dark:shadow-secondary">
      <div className="mx-4 sm:mx-8 flex h-16 items-center gap-4">
        {/* Left: mobile menu + title */}
        <div className="flex items-center gap-3 min-w-0">
          <SheetMenu />
          <Separator orientation="vertical" className="h-6 hidden lg:block" />
          <h1 className="font-semibold text-sm truncate">{title}</h1>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <UserQuickAction />
          <LocaleSwitcher />
          <NotificationsDropdown />
          <Separator orientation="vertical" className="h-6" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
