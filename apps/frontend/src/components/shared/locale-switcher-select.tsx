"use client";

import { CheckIcon, GlobeIcon } from "lucide-react";
import { useTransition } from "react";

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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Locale } from "@/i18n/config";
import { setLocale } from "@/lib/actions/users.action";
import { setUserLocale } from "@/lib/locale";
import { useError } from "@/providers/error-provider";

const LOCALE_FLAGS: Record<string, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  es: "🇪🇸",
  ja: "🇯🇵",
  zh: "🇨🇳",
  vi: "🇻🇳",
};

type Props = {
  defaultValue: string;
  items: Array<{ value: string; label: string }>;
  label: string;
};

export default function LocaleSwitcherSelect({
  defaultValue,
  items,
  label,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const { setError } = useError();

  function onChange(value: string) {
    const locale = value as Locale;
    startTransition(async () => {
      await setLocale(locale as string, setError);
      await setUserLocale(locale);
    });
  }

  const currentFlag = LOCALE_FLAGS[defaultValue];

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={isPending}
              aria-label={label}
              className="relative h-10 w-10 rounded-full"
            >
              {currentFlag ? (
                <span className="text-base leading-none">{currentFlag}</span>
              ) : (
                <GlobeIcon className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-36 p-1">
        {items.map((item) => {
          const isActive = item.value === defaultValue;
          const flag = LOCALE_FLAGS[item.value];
          return (
            <DropdownMenuItem
              key={item.value}
              onClick={() => onChange(item.value)}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 cursor-pointer transition-colors ${
                isActive
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-base leading-none w-5 text-center">
                {flag ?? <GlobeIcon className="h-4 w-4" />}
              </span>
              <span className="text-sm flex-1">{item.label}</span>
              {isActive && (
                <CheckIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
