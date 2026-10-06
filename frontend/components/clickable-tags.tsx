"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

interface HashtagLinkProps {
  name: string;
  variant?: "badge" | "inline";
  insideLink?: boolean;
}

export function HashtagLink({
  name,
  variant = "badge",
  insideLink = false,
}: HashtagLinkProps) {
  const router = useRouter();
  const href = `/searchBar?type=hashtag&q=${encodeURIComponent(name)}`;
  const className =
    variant === "badge"
      ? "rounded-full bg-navy-light px-3 py-1 text-xs font-semibold text-accent-blue hover:bg-navy hover:underline transition"
      : "text-sm font-medium text-accent-blue hover:underline";

  if (insideLink) {
    return (
      <button
        type="button"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(href);
        }}
        className={className}
      >
        #{name}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      #{name}
    </Link>
  );
}

interface MentionLinkProps {
  userId: string;
  username: string;
  insideLink?: boolean;
}

export function MentionLink({
  userId,
  username,
  insideLink = false,
}: MentionLinkProps) {
  const router = useRouter();
  const href = `/user?id=${encodeURIComponent(userId)}`;
  const className =
    "rounded-full border border-border px-3 py-1 text-xs font-semibold text-silver hover:border-accent-blue hover:text-accent-blue transition";

  if (insideLink) {
    return (
      <button
        type="button"
        onClick={(e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(href);
        }}
        className={className}
      >
        @{username}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      @{username}
    </Link>
  );
}
