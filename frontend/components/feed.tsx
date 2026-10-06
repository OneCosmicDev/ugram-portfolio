"use client";

import { fetchImages } from "@/lib/api";
import type { Image } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { ImageCard } from "@/components/image-card";
import { ImageCardSkeleton } from "@/components/image-card-skeleton";

export function Feed({
    functionToGetImages,
    param,
    queryType
}:{
    functionToGetImages?:(userParam: string)=> Promise<Image[]>,
    param?: string,
    queryType?: string
}
){
const {
    data: images,
    isLoading,
    error,
    } = useQuery({
    queryKey: param ? ["images", queryType || "default", param] : ["images"],
    queryFn: (functionToGetImages && param) ? () => functionToGetImages(param) : fetchImages,
    });

    return (
    <div className="mx-auto max-w-[720px] px-4 py-8">
        {/* Feed */}
        <div className="flex flex-col gap-6">
        {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
            <ImageCardSkeleton key={i} />
            ))}

        {error && (
            <div className="rounded-xl border border-border bg-navy px-6 py-12 text-center">
            <p className="text-silver-muted">
                Unable to load the feed.
            </p>
            <p className="mt-1 text-sm text-silver-muted/60">
                Please make sure the server is running.
            </p>
            </div>
        )}

        {images && images.length === 0 && (
            <div className="rounded-xl border border-border bg-navy px-6 py-12 text-center">
            <p className="text-silver-muted">No images yet.</p>
            </div>
        )}

        {images?.map((image, index) => (
            <ImageCard key={image.id} image={image} index={index} />
        ))}
        </div>
    </div>
    );
}