"use client";

import { Feed } from "@/components/feed";
import { FeedSidebar } from "@/components/feed-sidebar";

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 flex gap-8 items-start">
      <div className="flex-1 min-w-0">
        <Feed />
      </div>
      <FeedSidebar />
    </div>
  );
}
