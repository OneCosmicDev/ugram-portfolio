"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { UserPlus, UserCheck, Hash } from "lucide-react";
import { getRecommendedAccounts, getTrendingHashtags, toggleFollow } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { RecommendedImages } from "@/components/recommended-images";
import type { RecommendedAccount } from "@/types";
import { useState } from "react";

function FollowButton({ account }: { account: RecommendedAccount }) {
  const queryClient = useQueryClient();
  // Use the isFollowing field returned directly by the recommendations API — no extra query needed
  const [isFollowing, setIsFollowing] = useState(account.isFollowing);

  const mutation = useMutation({
    mutationFn: () => toggleFollow(account.id),
    onSuccess: (data) => {
      setIsFollowing(data.isFollowing);
      queryClient.invalidateQueries({ queryKey: ["recommendedAccounts"] });
    },
  });

  return (
    <Button
      size="sm"
      variant={isFollowing ? "ghost" : "default"}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="h-7 px-2 text-xs"
    >
      {isFollowing ? (
        <>
          <UserCheck className="mr-1 h-3 w-3" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-1 h-3 w-3" />
          Follow
        </>
      )}
    </Button>
  );
}

export function FeedSidebar() {
  const { currentUser } = useAuthStore();

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["recommendedAccounts"],
    queryFn: getRecommendedAccounts,
    enabled: !!currentUser,
    staleTime: 120_000,
    gcTime: 300_000,
  });

  const { data: trending = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["trendingHashtags"],
    queryFn: getTrendingHashtags,
    staleTime: 300_000,
    gcTime: 600_000,
  });

  return (
    <aside className="hidden lg:flex flex-col gap-6 w-80 pt-4">
      {/* Popular accounts */}
      <div className="rounded-xl border border-border bg-navy-dark/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-silver">Popular Accounts</h2>
        {accountsLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-navy-light flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 rounded bg-navy-light" />
                  <div className="h-2 w-16 rounded bg-navy-light" />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-xs text-silver-muted">No suggestions</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center gap-3">
                <Link href={`/user?id=${account.id}`} className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {account.avatar && (
                      <AvatarImage src={getImageUrl(account.avatar)} />
                    )}
                    <AvatarFallback className="bg-navy-light text-xs text-accent-blue">
                      {account.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-silver">
                      @{account.username}
                    </p>
                    <p className="text-xs text-silver-muted">
                      {account.followerCount} followers
                    </p>
                  </div>
                </Link>
                <div className="ml-auto flex-shrink-0">
                  <FollowButton account={account} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Trending hashtags */}
      <div className="rounded-xl border border-border bg-navy-dark/60 p-4">
        <h2 className="mb-3 text-sm font-semibold text-silver">Trending</h2>
        {trendingLoading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-6 w-full rounded bg-navy-light" />
            ))}
          </div>
        ) : trending.length === 0 ? (
          <p className="text-xs text-silver-muted">No hashtags</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {trending.map((tag) => (
              <li key={tag.id}>
                <Link
                  href={`/searchBar?type=hashtag&q=${encodeURIComponent(tag.name)}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1 text-sm transition-colors hover:bg-navy-light"
                >
                  <span className="flex items-center gap-1 text-accent-blue">
                    <Hash className="h-3 w-3" />
                    {tag.name}
                  </span>
                  <span className="text-xs text-silver-muted">{tag.count} posts</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Interest-based recommendations */}
      <RecommendedImages />
    </aside>
  );
}
