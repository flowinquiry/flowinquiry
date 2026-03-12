import { Handle, Position } from "@xyflow/react";
import Link from "next/link";
import React from "react";

import { UserAvatar } from "@/components/shared/avatar-display";

const PersonNode = ({ data }: { data: any }) => {
  const { label, avatarUrl, userPageLink, onClick } = data;

  return (
    <div
      className="group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer"
      style={{ width: "160px", minHeight: "72px" }}
      onClick={onClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary/60 !border-primary/30 !w-2 !h-2"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary/60 !border-primary/30 !w-2 !h-2"
      />

      <UserAvatar
        imageUrl={avatarUrl}
        size="w-9 h-9"
        className="ring-2 ring-background shadow-sm"
      />

      <Link
        href={userPageLink}
        onClick={(e) => e.stopPropagation()}
        className="text-center text-xs font-medium leading-tight text-foreground hover:text-primary hover:underline line-clamp-2 px-1 transition-colors"
      >
        {label}
      </Link>
    </div>
  );
};

export default PersonNode;
