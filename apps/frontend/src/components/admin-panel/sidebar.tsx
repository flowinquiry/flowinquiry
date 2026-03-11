"use client";

import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import AppLogo from "@/components/app-logo";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar;
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        "bg-sidebar border-r border-border/60",
        !getOpenState() ? "w-22.5" : "w-72",
        settings.disabled && "hidden",
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col overflow-y-auto"
      >
        {/* Logo area */}
        <div className="flex items-center gap-2 h-16 px-4 border-b border-border/60 shrink-0">
          <AppLogo className="w-8 h-8 shrink-0" />
          <h1
            className={cn(
              "font-bold text-base whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300",
              !getOpenState()
                ? "-translate-x-96 opacity-0 hidden"
                : "translate-x-0 opacity-100",
            )}
          >
            FlowInquiry
          </h1>
        </div>
        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}
