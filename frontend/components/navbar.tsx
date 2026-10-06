"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Home, LogOut, Users, UserCircle, Upload, Search, MessageCircle, Image } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getImageUrl, getNotifications, getUnreadMessageCount } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/feed/", label: "Home", icon: Home },
  { href: "/images/upload", label: "Upload", icon: Upload },
  { href: "/users", label: "Users", icon: Users },
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/searchBar", label: "Search", icon: Search },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
    enabled: !!currentUser,
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ["unreadMessages"],
    queryFn: getUnreadMessageCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: !!currentUser,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const unreadMsgCount = unreadMessages?.count ?? 0;

  if (
    !currentUser ||
    pathname === "/login" ||
    pathname === "/login/" ||
    pathname === "/register" ||
    pathname === "/register/"
  ) {
    return null;
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push("/login/");
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-navy-dark/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/feed/"
          className="text-xl font-bold tracking-tight text-silver transition-colors hover:text-accent-blue"
        >
          Ugram
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-silver-muted transition-colors hover:bg-navy-light hover:text-silver"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Chat link */}
          <Link
            href="/chat"
            className="relative flex items-center rounded-lg p-2 text-silver-muted transition-colors hover:bg-navy-light hover:text-silver"
          >
            <MessageCircle className="h-5 w-5" />
            {unreadMsgCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-blue text-[10px] font-bold text-white">
                {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
              </span>
            )}
          </Link>

          {/* Notifications Bell */}
          <Link
            href="/notifications/"
            className="relative flex items-center rounded-lg p-2 text-silver-muted transition-colors hover:bg-navy-light hover:text-silver"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Avatar className="h-8 w-8">
              {currentUser.avatar && (
                <AvatarImage src={getImageUrl(currentUser.avatar)} />
              )}
              <AvatarFallback className="bg-navy-light text-xs text-accent-blue">
                {currentUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-right">
              <p className="text-sm font-medium text-silver">
                @{currentUser.username}
              </p>
              <p className="text-xs text-silver-muted">
                {currentUser.firstName || currentUser.email}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => void handleLogout()}
            className="text-silver-muted hover:bg-navy-light hover:text-silver"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
