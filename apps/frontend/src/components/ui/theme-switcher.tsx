"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
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

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentThemeVariant, setCurrentThemeVariant] =
    useState<string>("default");

  // Apply theme variant as a class to the html element
  useEffect(() => {
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
  }, [currentThemeVariant]);

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Theme:{" "}
            {themes.find((t) => t.value === currentThemeVariant)?.name ||
              "Default"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map((t) => (
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
