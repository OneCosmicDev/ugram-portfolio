"use client";

import NextImage from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl, getReactions, toggleReaction } from "@/lib/api";
import { HashtagLink } from "@/components/clickable-tags";
import { useAuthStore } from "@/store/useAuthStore";
import type { Image } from "@/types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ImageCardProps {
  image: Image;
  index?: number;
}

export function ImageCard({ image, index = 0 }: ImageCardProps) {
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [imgSrc, setImgSrc] = useState(getImageUrl(image.urlMedium));

  const { data: reactionData } = useQuery({
    queryKey: ["reactions", image.id],
    queryFn: () => getReactions(image.id),
    staleTime: 30_000,
    enabled: true,
  });

  const reactionMutation = useMutation({
    mutationFn: () => toggleReaction(image.id),
    onSuccess: (data) => {
      queryClient.setQueryData(["reactions", image.id], data);
    },
  });

  function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    reactionMutation.mutate();
  }

  const count = reactionData?.count ?? 0;
  const liked = reactionData?.liked ?? false;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
    >
      <Link href={`/post?id=${image.id}`} className="group block">
        <div className="overflow-hidden rounded-xl border border-border bg-navy transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-[0_0_30px_rgba(77,163,255,0.08)]">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4">
            <Avatar className="h-9 w-9">
              {image.user.avatar && <AvatarImage src={getImageUrl(image.user.avatar)} />}
              <AvatarFallback className="bg-navy-light text-sm text-accent-blue">
                {image.user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-silver">
                {image.user.username}
              </span>
              <span className="font-mono text-xs text-silver-muted">
                {formatDate(image.createdAt)}
              </span>
            </div>
          </div>

          {/* Image */}
          <div className="relative aspect-square w-full overflow-hidden bg-navy-dark">
            <NextImage
              src={imgSrc}
              alt={image.description || "Post image"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 720px) 100vw, 720px"
              onError={() => setImgSrc("/placeholder.svg")}
            />
          </div>

          {/* Footer */}
          <div className="space-y-3 px-5 py-4">
            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                className={`flex items-center gap-1.5 transition-colors ${
                  liked ? "text-red-400" : "text-silver-muted hover:text-red-400"
                }`}
                onClick={handleLike}
                disabled={!currentUser || reactionMutation.isPending}
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
                {count > 0 && <span className="text-xs">{count}</span>}
              </button>
              <Link
                href={`/post?id=${image.id}#comments`}
                className="flex items-center gap-1.5 text-silver-muted transition-colors hover:text-accent-blue"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
            </div>

            {/* Description */}
            {image.description && (
              <p className="text-sm leading-relaxed text-silver">
                <span className="font-semibold">{image.user.username}</span>{" "}
                {image.description.replace(/#\w+/g, "").trim()}
              </p>
            )}

            {/* Hashtags */}
            {image.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {image.hashtags.map((tag) => (
                  <HashtagLink
                    key={tag.hashtagId}
                    name={tag.hashtag.name}
                    variant="inline"
                    insideLink
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
