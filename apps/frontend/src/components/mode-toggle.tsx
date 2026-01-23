"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import * as React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";

const themeVariants = [
  { name: "Default", value: "default" },
  { name: "Dark", value: "dark" },
  { name: "Rose", value: "rose" },
  { name: "Gray", value: "gray" },
  { name: "Steel Blue", value: "steel-blue" },
  { name: "Purple", value: "purple" },
  { name: "Redwood", value: "redwood" },
  { name: "Green", value: "green" },
  { name: "Ocean Blue", value: "ocean-blue" },
];

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const t = useAppClientTranslations();
  const [mounted, setMounted] = useState(false);
  const [currentThemeVariant, setCurrentThemeVariant] =
    useState<string>("default");

  const tooltipText =
    theme === "light"
      ? t.common.misc("switch_to_dark_mode")
      : t.common.misc("switch_to_light_mode");

  // Load theme variant from localStorage on mount
  useEffect(() => {
    const savedThemeVariant = localStorage.getItem("theme-variant");
    if (savedThemeVariant) {
      setCurrentThemeVariant(savedThemeVariant);
    }
    setMounted(true);
  }, []);

  // Apply theme variant as a class to the html element and save to localStorage
  useEffect(() => {
    if (!mounted) return;

    // Save to localStorage
    localStorage.setItem("theme-variant", currentThemeVariant);

    if (currentThemeVariant === "default") {
      document.documentElement.classList.remove(
        "theme-dark",
        "theme-rose",
        "theme-gray",
        "theme-steel-blue",
        "theme-purple",
        "theme-redwood",
        "theme-green",
        "theme-ocean-blue",
      );
    } else {
      // Remove all theme classes first
      document.documentElement.classList.remove(
        "theme-dark",
        "theme-rose",
        "theme-gray",
        "theme-steel-blue",
        "theme-purple",
        "theme-redwood",
        "theme-green",
        "theme-ocean-blue",
      );
      // Add the selected theme class
      document.documentElement.classList.add(`theme-${currentThemeVariant}`);
    }
  }, [currentThemeVariant, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full w-8 h-8 bg-background"
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <SunIcon className="w-[1.2rem] h-[1.2rem] rotate-90 scale-0 transition-transform ease-in-out duration-500 dark:rotate-0 dark:scale-100" />
              <MoonIcon className="absolute w-[1.2rem] h-[1.2rem] rotate-0 scale-1000 transition-transform ease-in-out duration-500 dark:-rotate-90 dark:scale-0" />
              <span className="sr-only">{tooltipText}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
            {themeVariants.find((t) => t.value === currentThemeVariant)?.name ||
              "Default"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themeVariants.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setCurrentThemeVariant(t.value)}
            >
              {t.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
