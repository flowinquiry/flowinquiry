"use client";

import NextLink from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  className?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <NextLink
        className={cn("hover:underline text-primary", className)}
        ref={ref}
        {...props}
      >
        {children}
      </NextLink>
    );
  },
);
Link.displayName = "Link";

export { Link };
