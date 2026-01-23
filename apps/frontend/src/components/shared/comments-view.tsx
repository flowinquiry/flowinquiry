"use client";

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
        .then((data) => {
          setComments(data);
        })
        .finally(() => setLoading(false));
    }
  }, [entityType, entityId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const newCommentObj: CommentDTO = {
      content: newComment,
      createdById: Number(session?.user?.id!),
      entityType: entityType,
      entityId: entityId,
    };

    setSubmitting(true);

    try {
      const savedComment = await createNewComment(newCommentObj, setError);
      savedComment.createdByName =
        `${session?.user?.firstName ?? ""} ${session?.user?.lastName ?? ""}`.trim();
      setComments((prevComments) => [savedComment, ...prevComments]);
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="pt-4">
        <h3 className="text-lg font-semibold mb-2">
          {t.common.misc("add_comment")}
        </h3>

        <RichTextEditor
          value={newComment}
          onChange={(value) => setNewComment(value)}
        />
        <Button
          className="mt-2"
          onClick={handleAddComment}
          disabled={submitting || !newComment.trim()}
        >
          {submitting
            ? t.common.buttons("submitting")
            : t.common.buttons("add_comment")}
        </Button>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-semibold mb-2">
          {t.common.misc("comments")}
        </h3>
        {loading ? (
          <div>{t.common.misc("loading_data")}</div>
        ) : comments.length > 0 ? (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="flex items-start gap-4">
                <div className="pt-3">
                  <UserAvatar imageUrl={comment.createdByImageUrl} />
                </div>

                <div
                  className="relative bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-xs flex-1
                                before:absolute before:-left-3 before:top-6 before:w-0 before:h-0
                                before:border-t-[6px] before:border-b-[6px] before:border-r-12
                                before:border-t-transparent before:border-b-transparent
                                before:border-r-gray-100 dark:before:border-r-gray-800"
                >
                  <div className="flex items-baseline gap-2 mb-2 pb-2">
                    <Button
                      variant="link"
                      className="px-0 h-6 text-sm font-medium"
                    >
                      <a
                        href={`/portal/users/${obfuscate(comment.createdById)}`}
                      >
                        {comment.createdByName}
                      </a>
                    </Button>

                    <div className=" text-xs">
                      <Tooltip>
                        <TooltipTrigger>
                          <span>
                            {formatDateTimeDistanceToNow(
                              new Date(comment.createdAt!),
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>
                            {new Date(comment.createdAt!).toLocaleString()}
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: comment.content!,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div>{t.common.misc("no_comments")}.</div>
        )}
      </div>
    </div>
  );
};

export default CommentsView;
