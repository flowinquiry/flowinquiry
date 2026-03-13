"use client";

import { motion } from "framer-motion";
import { Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { cn } from "@/lib/utils";

const themeVariants = [
  { name: "Default", value: "default", color: "#6366f1" },
  { name: "Slate", value: "slate", color: "#1e293b" },
  { name: "Rose", value: "rose", color: "#f43f5e" },
  { name: "Gray", value: "gray", color: "#6b7280" },
  { name: "Steel Blue", value: "steel-blue", color: "#3b82f6" },
  { name: "Purple", value: "purple", color: "#a855f7" },
  { name: "Redwood", value: "redwood", color: "#b45309" },
  { name: "Green", value: "green", color: "#22c55e" },
  { name: "Ocean Blue", value: "ocean-blue", color: "#0ea5e9" },
];

const ALL_THEME_CLASSES = themeVariants
  .filter((v) => v.value !== "default")
  .map((v) => `theme-${v.value}`);

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const t = useAppClientTranslations();
  const [mounted, setMounted] = useState(false);
  const [currentThemeVariant, setCurrentThemeVariant] =
    useState<string>("default");

  const isDark = theme === "dark";
  const tooltipText = isDark
    ? t.common.misc("switch_to_light_mode")
    : t.common.misc("switch_to_dark_mode");

  // Load theme variant from localStorage on mount
  useEffect(() => {
    let saved = localStorage.getItem("theme-variant");
    // Migrate legacy "dark" value to "slate"
    if (saved === "dark") {
      saved = "slate";
      localStorage.setItem("theme-variant", "slate");
    }
    if (saved) setCurrentThemeVariant(saved);
    setMounted(true);
  }, []);

  // Apply theme variant class to <html>
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme-variant", currentThemeVariant);
    document.documentElement.classList.remove(...ALL_THEME_CLASSES);
    if (currentThemeVariant !== "default") {
      document.documentElement.classList.add(`theme-${currentThemeVariant}`);
    }
  }, [currentThemeVariant, mounted]);

  if (!mounted) return null;

  const activeVariant = themeVariants.find(
    (v) => v.value === currentThemeVariant,
  );

  return (
    <div className="flex items-center gap-2">
      {/* ── Dark / Light pill toggle ── */}
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button
              aria-label={tooltipText}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={cn(
                "relative flex items-center w-14 h-7 rounded-full border px-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-amber-50 border-amber-200",
              )}
            >
              {/* Track icons */}
              <Sun
                className={cn(
                  "absolute left-1.5 w-3.5 h-3.5 transition-opacity duration-300",
                  isDark
                    ? "opacity-30 text-slate-400"
                    : "opacity-100 text-amber-500",
                )}
              />
              <Moon
                className={cn(
                  "absolute right-1.5 w-3.5 h-3.5 transition-opacity duration-300",
                  isDark
                    ? "opacity-100 text-indigo-300"
                    : "opacity-30 text-slate-400",
                )}
              />
              {/* Sliding thumb */}
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className={cn(
                  "absolute w-5 h-5 rounded-full shadow-md",
                  isDark
                    ? "right-1 bg-slate-200"
                    : "left-1 bg-white border border-amber-200",
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* ── Theme colour swatch popover ── */}
      <Popover>
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full relative"
                  aria-label="Choose colour theme"
                >
                  <span
                    className="absolute inset-1 rounded-full border-2 border-border transition-colors duration-300"
                    style={{
                      backgroundColor: activeVariant?.color ?? "#6366f1",
                    }}
                  />
                  <Palette className="relative w-3.5 h-3.5 text-background mix-blend-difference" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Colour theme</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <PopoverContent align="end" className="w-52 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Colour theme
          </p>
          <div className="grid grid-cols-5 gap-2">
            {themeVariants.map((v) => (
              <TooltipProvider key={v.value} disableHoverableContent>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <button
                      aria-label={v.name}
                      onClick={() => setCurrentThemeVariant(v.value)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        currentThemeVariant === v.value
                          ? "border-foreground scale-110 shadow-md"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: v.color }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {v.name}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
