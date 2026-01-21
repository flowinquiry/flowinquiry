import { Handle, Position } from "@xyflow/react";
import Link from "next/link";
import React from "react";

import { UserAvatar } from "@/components/shared/avatar-display";

interface PersonNodeData {
  label: string;
  avatarUrl: string;
  userPageLink: string;
  onClick?: () => void;
}

const PersonNode = ({ data }: { data: PersonNodeData }) => {
  const { label, avatarUrl, userPageLink, onClick } = data;

  // Detect dark mode
  const isDarkMode =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <div
      className={`p-2 rounded-lg shadow-md flex flex-col items-center ${
        isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
      }`}
      style={{
        width: "150px",
        height: "80px",
      }}
      onClick={onClick} // Call the onClick handler when clicked
    >
      {/* Input and Output Handles for Edges */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ backgroundColor: isDarkMode ? "#d1d5db" : "#6b7280" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ backgroundColor: isDarkMode ? "#d1d5db" : "#6b7280" }}
      />

      {/* Avatar */}
      <UserAvatar imageUrl={avatarUrl} size="w-8 h-8" />

      {/* User Name */}
      <Link href={userPageLink}>
        <span className={`text-center text-xs scale-50`}>{label}</span>
      </Link>
    </div>
  );
};

export default PersonNode;
