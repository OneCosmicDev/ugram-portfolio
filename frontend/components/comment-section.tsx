"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { createComment, deleteComment, getComments, getImageUrl } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface CommentSectionProps {
  imageId: string;
  imageOwnerId: string;
}

export function CommentSection({ imageId, imageOwnerId }: CommentSectionProps) {
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", imageId],
    queryFn: () => getComments(imageId),
  });

  const addMutation = useMutation({
    mutationFn: (text: string) => createComment(imageId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", imageId] });
      setContent("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", imageId] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || addMutation.isPending) return;
    addMutation.mutate(content);
  }

  return (
    <div className="rounded-2xl border border-border bg-navy p-6 space-y-5">
      <h2 className="text-base font-semibold text-silver">
        Comments {comments.length > 0 && <span className="text-silver-muted">({comments.length})</span>}
      </h2>

      {/* Comment form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            {currentUser.avatar && <AvatarImage src={getImageUrl(currentUser.avatar)} />}
            <AvatarFallback className="bg-navy-light text-xs text-accent-blue">
              {currentUser.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-lg border border-border bg-navy-dark px-4 py-2 text-sm text-silver placeholder:text-silver-muted outline-none transition focus:border-accent-blue"
            />
            <Button
              type="submit"
              disabled={!content.trim() || addMutation.isPending}
              size="sm"
            >
              {addMutation.isPending ? "..." : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-silver-muted">Log in to comment.</p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <p className="text-sm text-silver-muted">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-silver-muted">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const canDelete =
              currentUser &&
              (currentUser.id === comment.userId || currentUser.id === imageOwnerId);
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  {comment.user.avatar && (
                    <AvatarImage src={getImageUrl(comment.user.avatar)} />
                  )}
                  <AvatarFallback className="bg-navy-light text-xs text-accent-blue">
                    {comment.user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-silver">
                        {comment.user.username}
                      </span>
                      <span className="font-mono text-xs text-silver-muted">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => deleteMutation.mutate(comment.id)}
                        disabled={deleteMutation.isPending}
                        className="text-silver-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-silver leading-relaxed">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
