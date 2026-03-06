import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { useAppClientTranslations } from "@/hooks/use-translations";

export function Footer() {
  const t = useAppClientTranslations();

  return (
    <div className="z-20 w-full bg-background/95 backdrop-blur-sm border-t border-border/60">
      <div className="mx-4 md:mx-8 flex h-14 items-center justify-between">
        <p className="text-xs md:text-sm leading-loose text-muted-foreground text-left">
          © {new Date().getFullYear()}{" "}
          <Link
            href="https://flowinquiry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            FlowInquiry
          </Link>
          . {t.header.nav("copyright")}.
        </p>
        <ModeToggle />
      </div>
    </div>
  );
}
