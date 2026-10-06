"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { UserPlus, UserCheck, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUserById, getImageUrl, toggleFollow, getFollowStatus } from "@/lib/api";
import { ImageCard } from "@/components/image-card";
import { ProfileField } from "@/components/profile-field";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import type { User } from "@/types";

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <UserProfilePageContent />
    </Suspense>
  );
}

function UserProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: followStatus } = useQuery({
    queryKey: ["followStatus", id],
    queryFn: () => getFollowStatus(id!),
    enabled: !!id && !!currentUser && id !== currentUser.id,
  });

  const followMutation = useMutation({
    mutationFn: () => toggleFollow(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(["followStatus", id], data);
    },
  });

  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      try {
        const data = await fetchUserById(id as string);
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-black text-black dark:text-white">
        Profile is loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center text-red-500">
        User not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 p-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row items-center gap-10">
        <div className="relative h-40 w-40 flex-shrink-0">
          <Image
            src={getImageUrl(user.avatar) || "/avatar-placeholder.svg"}
            alt="Profile picture"
            fill
            className="rounded-full border border-zinc-200 dark:border-zinc-800 object-cover"
          />
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-light">@{user.username}</h1>
            {currentUser && currentUser.id !== user.id && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={followStatus?.isFollowing ? "ghost" : "default"}
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                >
                  {followStatus?.isFollowing ? (
                    <><UserCheck className="mr-1 h-4 w-4" />Following</>
                  ) : (
                    <><UserPlus className="mr-1 h-4 w-4" />Follow</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/chat/conversation?userId=${user.id}`)}
                >
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Message
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-6 flex-wrap">
            {(user.firstName || user.lastName) && (
              <p className="font-medium">
                {[user.firstName, user.lastName].filter(Boolean).join(' ')}
              </p>
            )}
            <p className="text-zinc-500 text-sm">
              Joined on {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>

          <p className="text-sm text-zinc-500">
            🖼 {user.images?.length ?? 0} images published.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1">
            <h2 className="text-sm font-bold uppercase text-zinc-400 mb-6 tracking-widest">
              Public information
            </h2>

            <ProfileField label="First name" value={user.firstName} />
            <ProfileField label="Last name" value={user.lastName} />
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
        <h2 className="text-sm font-bold uppercase text-zinc-400 mb-8 tracking-widest">
          Published images
        </h2>

        {user.images && user.images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {user.images.map((image, index) => (
              <ImageCard key={image.id} image={image} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">
            This user hasn&apos;t posted any images yet.
          </p>
        )}
      </div>
    </div>
  );
}
