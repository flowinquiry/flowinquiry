"use client";

import { Navbar } from "@/components/admin-panel/navbar";
import { VersionUpgradeBanner } from "@/components/dashboard/version-upgrade-banner";
import { cn } from "@/lib/utils";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  useDefaultStyles?: boolean; // Add flag to control default styles
}

export function ContentLayout({
  title,
  children,
  className,
  useDefaultStyles = true, // Default to true to maintain backward compatibility
}: ContentLayoutProps) {
  // Default styles that will be applied if useDefaultStyles is true
  const defaultStyles = "container pt-8 pb-8 px-4 sm:px-8";

  // Apply either default + custom styles, or just custom styles
  const containerClasses = useDefaultStyles
    ? cn(defaultStyles, className)
    : className || "";

  return (
    <div className="h-full">
      <VersionUpgradeBanner />
      <Navbar title={title} />
      <div className={containerClasses}>{children}</div>
    </div>
  );
}
