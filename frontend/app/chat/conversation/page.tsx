"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { getConversationWithUser, sendMessage as apiSendMessage, getImageUrl } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { ChatMessage } from "@/components/chat-message";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/useAuthStore";
import type { Message } from "@/types";

function ConversationContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const { currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", userId],
    queryFn: () => getConversationWithUser(userId),
    enabled: !!currentUser && !!userId,
  });

  const conversation = data?.conversation;
  const other =
    conversation && currentUser
      ? conversation.user1Id === currentUser.id
        ? conversation.user2
        : conversation.user1
      : null;

  useEffect(() => {
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [data]);

  useEffect(() => {
    if (!conversation) return;

    const socket = connectSocket();
    socket.emit("join_conversation", conversation.id);

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("new_message", handleNewMessage);
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.emit("leave_conversation", conversation.id);
    };
  }, [conversation, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending || !userId) return;
    setSending(true);
    setSendError(null);
    try {
      const msg = await apiSendMessage(userId, input.trim());
      setMessages((prev) => [...prev, msg]);
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch {
      setSendError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link href="/chat" className="text-silver-muted hover:text-silver">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other && (
          <>
            <Avatar className="h-9 w-9">
              {other.avatar && <AvatarImage src={getImageUrl(other.avatar)} />}
              <AvatarFallback className="bg-navy-light text-accent-blue">
                {other.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link href={`/user?id=${other.id}`} className="font-medium text-silver hover:text-accent-blue">
              @{other.username}
            </Link>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-center text-silver-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-silver-muted">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUser?.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
        {sendError && (
          <p className="text-xs text-red-400">{sendError}</p>
        )}
        <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          className="flex-1 rounded-xl bg-navy-light px-4 py-2 text-sm text-silver outline-none placeholder:text-silver-muted focus:ring-1 focus:ring-accent-blue"
        />
        <Button
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          size="icon"
          className="rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </main>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8 text-silver-muted">Loading…</div>}>
      <ConversationContent />
    </Suspense>
  );
}
