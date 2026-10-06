"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Heart, MessageCircle } from "lucide-react";
import {
  getNotifications,
  getImageUrl,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string) => void;
}) {
  const icon =
    notif.type === "reaction" ? (
      <Heart className="h-4 w-4 text-red-400" />
    ) : (
      <MessageCircle className="h-4 w-4 text-accent-blue" />
    );

  const label =
    notif.type === "reaction"
      ? "liked your photo"
      : "commented on your photo";

  return (
    <Link
      href={`/post?id=${notif.imageId}`}
      onClick={() => !notif.read && onRead(notif.id)}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-navy-light ${
        notif.read
          ? "border-border bg-navy"
          : "border-accent-blue/30 bg-navy-light/60"
      }`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        {notif.fromUser.avatar && (
          <AvatarImage src={getImageUrl(notif.fromUser.avatar)} />
        )}
        <AvatarFallback className="bg-navy-dark text-xs text-accent-blue">
          {notif.fromUser.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 items-center gap-2 min-w-0">
        {icon}
        <p className="text-sm text-silver min-w-0">
          <span className="font-semibold">{notif.fromUser.username}</span>{" "}
          {label}
        </p>
      </div>

      <span className="font-mono text-xs text-silver-muted shrink-0">
        {formatDate(notif.createdAt)}
      </span>

      {notif.image?.urlSmall && (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border">
          <NextImage
            src={getImageUrl(notif.image.urlSmall)}
            alt="Image"
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      )}

      {!notif.read && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-accent-blue" />
      )}
    </Link>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-accent-blue" />
          <h1 className="text-xl font-bold text-silver">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-silver-muted"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-navy p-6 text-center text-silver-muted">
          Loading...
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-navy p-10 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-silver-muted" />
          <p className="text-silver-muted">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              onRead={(id) => markReadMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
