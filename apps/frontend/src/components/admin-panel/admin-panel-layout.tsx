"use client";

import { Footer } from "@/components/admin-panel/footer";
import { Sidebar } from "@/components/admin-panel/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { getOpenState, settings } = sidebar;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div
        className={cn(
          "flex flex-col min-w-0 w-full h-full transition-[margin-left] ease-in-out duration-300",
          !settings.disabled && (!getOpenState() ? "lg:ml-22.5" : "lg:ml-72"),
        )}
      >
        <main className="flex-1 overflow-auto bg-zinc-100/70 dark:bg-zinc-950/60">
          <div className="min-h-full min-w-0">{children}</div>
        </main>

        <footer className="shrink-0 border-t border-border/60">
          <Footer />
        </footer>
      </div>
    </div>
  );
}
