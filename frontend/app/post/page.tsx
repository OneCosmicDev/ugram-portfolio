"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Pencil, Trash2 } from "lucide-react";
import {
  deleteImage,
  fetchImageById,
  getReactions,
  toggleReaction,
  updateImage,
  getImageUrl,
} from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogClose,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HashtagLink, MentionLink } from "@/components/clickable-tags";
import { CommentSection } from "@/components/comment-section";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ImageDetailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-10">Loading...</div>}>
      <ImageDetailPageContent />
    </Suspense>
  );
}

function ImageDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageId = searchParams.get("id") as string;
  const queryClient = useQueryClient();

  const { currentUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [draftDescription, setDraftDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: image, isLoading } = useQuery({
    queryKey: ["image", imageId],
    queryFn: () => fetchImageById(imageId),
  });

  const { data: reactionData } = useQuery({
    queryKey: ["reactions", imageId],
    queryFn: () => getReactions(imageId),
    staleTime: 30_000,
    enabled: !!imageId,
  });

  const reactionMutation = useMutation({
    mutationFn: () => toggleReaction(imageId),
    onSuccess: (data) => {
      queryClient.setQueryData(["reactions", imageId], data);
    },
  });

  const canEdit = useMemo(() => {
    if (!image || !currentUser) return false;
    return image.userId === currentUser.id || image.user.id === currentUser.id;
  }, [image, currentUser]);

  const updateMutation = useMutation({
    mutationFn: (payload: { description?: string }) =>
      updateImage(imageId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["image", imageId] });
      setIsEditing(false);
      setError(null);
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Can't modify the description."
      );
    },
  });

  async function handleDelete() {
    try {
      setIsDeleting(true);
      await deleteImage(imageId);
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      router.push("/feed/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Can't delete the image."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl border border-border bg-navy p-6 text-silver-muted">
          Loading...
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl border border-border bg-navy p-6 text-silver-muted">
          Image not found.
        </div>
      </div>
    );
  }

  const liked = reactionData?.liked ?? false;
  const reactionCount = reactionData?.count ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/feed/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-navy">
          <div className="relative aspect-square w-full bg-navy-dark">
            <NextImage
              src={getImageUrl(image.urlLarge)}
              alt={image.description || "Image"}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-navy p-6">
          <div className="space-y-1">
            <p className="text-sm text-silver-muted">Published by</p>
            <p className="text-lg font-semibold text-silver">
              {image.user.username}
            </p>
            <p className="text-sm text-silver-muted">
              {formatDate(image.createdAt)}
            </p>
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => currentUser && reactionMutation.mutate()}
              disabled={!currentUser || reactionMutation.isPending}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                liked
                  ? "bg-red-500/20 text-red-400"
                  : "bg-navy-light text-silver-muted hover:text-red-400"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              <span>{reactionCount} {reactionCount === 1 ? "like" : "likes"}</span>
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-silver-muted">Description</p>
            {isEditing ? (
              <textarea
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                className="h-32 w-full rounded-lg border border-border bg-navy-dark px-4 py-3 text-sm text-silver outline-none transition focus:border-accent-blue"
              />
            ) : (
              <p className="text-sm text-silver">
                {image.description || "No description."}
              </p>
            )}
          </div>

          {image.hashtags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-silver-muted">Hashtags</p>
              <div className="flex flex-wrap gap-2">
                {image.hashtags.map((tag) => (
                  <HashtagLink key={tag.hashtagId} name={tag.hashtag.name} />
                ))}
              </div>
            </div>
          )}

          {image.mentions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-silver-muted">Mentions</p>
              <div className="flex flex-wrap gap-2">
                {image.mentions.map((mention) => (
                  <MentionLink
                    key={mention.id}
                    userId={mention.user.id}
                    username={mention.user.username}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {canEdit && (
            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <Button
                    onClick={() =>
                      updateMutation.mutate({ description: draftDescription })
                    }
                    disabled={updateMutation.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDraftDescription(image.description ?? "");
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDraftDescription(image.description ?? "");
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete image</DialogTitle>
                    <DialogDescription>
                      This cannot be undone. Do you still want to continue ?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                    <DialogClose asChild>
                      <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      {/* Comments section below the grid */}
      <div id="comments" className="mt-8">
        <CommentSection imageId={imageId} imageOwnerId={image.userId} />
      </div>
    </div>
  );
}
