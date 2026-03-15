"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { UserAvatar } from "@/components/shared/avatar-display";
import RichTextEditor from "@/components/shared/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppClientTranslations } from "@/hooks/use-translations";
import {
  createNewComment,
  getCommentsForEntity,
} from "@/lib/actions/comments.action";
import { formatDateTimeDistanceToNow } from "@/lib/datetime";
import { obfuscate } from "@/lib/endecode";
import { useError } from "@/providers/error-provider";
import { CommentDTO, EntityType } from "@/types/commons";

type CommentsViewProps = {
  entityType: EntityType;
  entityId: number;
};

const CommentsView: React.FC<CommentsViewProps> = ({
  entityType,
  entityId,
}) => {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState<string>("");
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { setError } = useError();
  const t = useAppClientTranslations();

  useEffect(() => {
    if (entityId) {
      setLoading(true);
      getCommentsForEntity(entityType, entityId, setError)
        .then((data) => setComments(data))
        .finally(() => setLoading(false));
    }
  }, [entityType, entityId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const newCommentObj: CommentDTO = {
      content: newComment,
      createdById: Number(session?.user?.id!),
      entityType,
      entityId,
    };
    setSubmitting(true);
    try {
      const savedComment = await createNewComment(newCommentObj, setError);
      savedComment.createdByName =
        `${session?.user?.firstName ?? ""} ${session?.user?.lastName ?? ""}`.trim();
      setComments((prev) => [savedComment, ...prev]);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Compose ── */}
      <div className="flex gap-3 items-start">
        <div className="shrink-0 pt-1">
          <UserAvatar imageUrl={session?.user?.imageUrl} size="w-8 h-8" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <RichTextEditor
            value={newComment}
            onChange={(value) => setNewComment(value)}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={submitting || !newComment.trim()}
            >
              {submitting
                ? t.common.buttons("submitting")
                : t.common.buttons("add_comment")}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Comment list ── */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="h-16 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
          <span className="text-2xl">💬</span>
          <p>{t.common.misc("no_comments")}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 items-start group">
              {/* Avatar */}
              <div className="shrink-0">
                <UserAvatar
                  imageUrl={comment.createdByImageUrl}
                  size="w-8 h-8"
                />
              </div>

              {/* Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Link
                    href={`/portal/users/${obfuscate(comment.createdById)}`}
                    className="text-sm font-semibold hover:text-primary hover:underline underline-offset-4 transition-colors"
                  >
                    {comment.createdByName}
                  </Link>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                        {formatDateTimeDistanceToNow(
                          new Date(comment.createdAt!),
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {new Date(comment.createdAt!).toLocaleString()}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div
                  className="rounded-lg border bg-muted/30 px-4 py-3 text-sm prose prose-sm dark:prose-invert max-w-none group-hover:bg-muted/50 transition-colors"
                  dangerouslySetInnerHTML={{ __html: comment.content! }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsView;
