"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getConversations, getImageUrl } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import type { Conversation } from "@/types";

function ConversationItem({ conv, currentUserId }: { conv: Conversation; currentUserId: string }) {
  const other = conv.user1Id === currentUserId ? conv.user2 : conv.user1;
  const lastMessage = conv.messages[0];

  return (
    <Link
      href={`/chat/conversation?userId=${other.id}`}
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-navy-light"
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        {other.avatar && <AvatarImage src={getImageUrl(other.avatar)} />}
        <AvatarFallback className="bg-navy-light text-accent-blue">
          {other.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-silver">@{other.username}</p>
        {lastMessage && (
          <p className="truncate text-sm text-silver-muted">{lastMessage.content}</p>
        )}
      </div>
      {lastMessage && (
        <span className="text-xs text-silver-muted flex-shrink-0">
          {new Date(lastMessage.createdAt).toLocaleDateString("en-CA")}
        </span>
      )}
    </Link>
  );
}

export default function ChatPage() {
  const { currentUser } = useAuthStore();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    enabled: !!currentUser,
    refetchInterval: 15_000,
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-accent-blue" />
        <h1 className="text-xl font-bold text-silver">Messages</h1>
      </div>

      <div className="rounded-xl border border-border bg-navy-dark/60">
        {isLoading ? (
          <p className="p-6 text-center text-silver-muted">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="p-6 text-center text-silver-muted">
            No conversations yet. Visit a user&apos;s profile to start a chat.
          </p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li key={conv.id} className="border-b border-border last:border-0">
                {currentUser && (
                  <ConversationItem conv={conv} currentUserId={currentUser.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
