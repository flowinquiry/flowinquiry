"use client";

import {
  Download,
  FilePlus2,
  Paperclip,
  Trash,
  UploadCloud,
} from "lucide-react";
import React, { useRef, useState } from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagePermission } from "@/hooks/use-page-permission";
import { useAppClientTranslations } from "@/hooks/use-translations";
import { getSecureBlobResource } from "@/lib/actions/commons.action";
import {
  deleteEntityAttachment,
  getEntityAttachments,
  uploadAttachmentsForEntity,
} from "@/lib/actions/entity-attachments.action";
import { cn } from "@/lib/utils";
import { useError } from "@/providers/error-provider";
import { useUserTeamRole } from "@/providers/user-team-role-provider";
import { EntityAttachmentDTO, EntityType } from "@/types/commons";
import { PermissionUtils } from "@/types/resources";

interface AttachmentViewProps {
  entityType: EntityType;
  entityId: number;
}

// Format file size into readable string
const formatFileSize = (size: number | null) => {
  if (!size) return "Unknown size";
  const KB = 1024,
    MB = KB * 1024;
  return size < MB
    ? `${(size / KB).toFixed(2)} KB`
    : `${(size / MB).toFixed(2)} MB`;
};

// Format uploaded date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AttachmentView = ({ entityType, entityId }: AttachmentViewProps) => {
  const { setError } = useError();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const permissionLevel = usePagePermission();
  const teamRole = useUserTeamRole().role;
  const t = useAppClientTranslations();

  // ✅ Define permissions
  const canView =
    PermissionUtils.canRead(permissionLevel) ||
    teamRole === "manager" ||
    teamRole === "member" ||
    teamRole === "guest";

  const canWrite =
    PermissionUtils.canWrite(permissionLevel) ||
    teamRole === "manager" ||
    teamRole === "member";

  // Fetch attachments using SWR
  const {
    data: attachments,
    mutate,
    isValidating,
  } = useSWR<EntityAttachmentDTO[]>(
    ["getEntityAttachments", entityType, entityId],
    () => getEntityAttachments(entityType, entityId, setError),
  );

  // Open file picker dialog
  const openFilePicker = () => fileInputRef.current?.click();

  // Upload selected files
  const uploadFiles = async (files: File[]) => {
    if (!canWrite || files.length === 0) return;
    await uploadAttachmentsForEntity(entityType, entityId, files, setError);
    mutate(); // Refresh the attachment list
  };

  // Handle file selection via input dialog
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files) return;
    await uploadFiles(Array.from(event.target.files));

    // Reset input value so the same file can be re-uploaded
    event.target.value = "";
  };

  // Handle file upload via drag & drop
  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    await uploadFiles(Array.from(event.dataTransfer.files));
  };

  // Handle file download
  const handleDownload = async (
    fileUrl: string,
    fileName: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // ✅ Prevent upload dialog from opening
    if (!canView) return;

    const blob = await getSecureBlobResource(fileUrl, setError);
    if (blob) {
      const objectURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL to free up memory
      URL.revokeObjectURL(objectURL);
    }
  };

  // Handle file deletion
  const handleDelete = async (
    attachmentId: number,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // ✅ Prevent upload dialog from opening
    if (!canWrite) return;

    setDeleting(attachmentId);
    try {
      await deleteEntityAttachment(attachmentId, setError);
      mutate(); // Refresh the attachment list
    } finally {
      setDeleting(null);
    }
  };

  const hasAttachments = (attachments?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Drop zone / upload button ── */}
      {canWrite && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={openFilePicker}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors",
            dragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:bg-muted/40",
          )}
        >
          <UploadCloud className={cn("h-8 w-8", dragOver && "text-primary")} />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {t.common.misc("attachment_place_holder")}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {t.common.misc("attachment_drop_hint")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 pointer-events-none"
            tabIndex={-1}
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            {t.common.misc("attachment_browse")}
          </Button>
        </div>
      )}

      {/* ── File list ── */}
      {isValidating ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : hasAttachments ? (
        <div className="flex flex-col">
          {attachments!
            .sort(
              (a, b) =>
                new Date(b.uploadedAt).getTime() -
                new Date(a.uploadedAt).getTime(),
            )
            .map((attachment, index) => (
              <div
                key={attachment.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                  index % 2 === 0 ? "bg-muted/30" : "",
                  "hover:bg-muted/50",
                )}
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex-1 truncate text-sm font-medium">
                      {attachment.fileName}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="space-y-1 text-xs">
                    <p>
                      <strong>{t.common.misc("attachment_file_name")}:</strong>{" "}
                      {attachment.fileName}
                    </p>
                    <p>
                      <strong>{t.common.misc("attachment_type")}:</strong>{" "}
                      {attachment.fileType ?? "Unknown"}
                    </p>
                    <p>
                      <strong>{t.common.misc("attachment_size")}:</strong>{" "}
                      {formatFileSize(attachment.fileSize)}
                    </p>
                    <p>
                      <strong>{t.common.misc("attachment_uploaded")}:</strong>{" "}
                      {formatDate(attachment.uploadedAt)}
                    </p>
                  </TooltipContent>
                </Tooltip>

                <span className="shrink-0 text-xs text-muted-foreground/70">
                  {formatFileSize(attachment.fileSize)}
                </span>

                <div className="flex shrink-0 items-center">
                  {canView && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) =>
                            handleDownload(
                              attachment.fileUrl,
                              attachment.fileName,
                              e,
                            )
                          }
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t.common.misc("download")}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {canWrite && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(attachment.id, e)}
                          disabled={deleting === attachment.id}
                        >
                          {deleting === attachment.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <Trash className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t.common.misc("delete")}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
        </div>
      ) : !canWrite ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t.common.misc("attachment_no_files")}
        </p>
      ) : null}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default AttachmentView;
