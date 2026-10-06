"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/api";
import type { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const date = new Date(message.createdAt);
  const timeStr = date.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {!isOwn && (
        <Avatar className="h-7 w-7 flex-shrink-0">
          {message.sender.avatar && (
            <AvatarImage src={getImageUrl(message.sender.avatar)} />
          )}
          <AvatarFallback className="bg-navy-light text-xs text-accent-blue">
            {message.sender.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${
            isOwn
              ? "bg-accent-blue text-white rounded-br-sm"
              : "bg-navy-light text-silver rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-silver-muted">{timeStr}</span>
      </div>
    </div>
  );
}
