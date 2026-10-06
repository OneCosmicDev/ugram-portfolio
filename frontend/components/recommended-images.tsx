"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { getRecommendedImages, getImageUrl } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export function RecommendedImages() {
  const { currentUser } = useAuthStore();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["recommendedImages"],
    queryFn: getRecommendedImages,
    enabled: !!currentUser,
    staleTime: 120_000,
  });

  if (isLoading || images.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-navy-dark/60 p-4">
      <h2 className="mb-3 text-sm font-semibold text-silver">For You</h2>
      <div className="grid grid-cols-3 gap-1">
        {images.slice(0, 9).map((img) => (
          <Link
            key={img.id}
            href={`/post?id=${img.id}`}
            className="relative aspect-square overflow-hidden rounded-md"
          >
            <Image
              src={getImageUrl(img.urlSmall)}
              alt={img.description ?? ""}
              fill
              sizes="80px"
              className="object-cover transition-transform hover:scale-105"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
