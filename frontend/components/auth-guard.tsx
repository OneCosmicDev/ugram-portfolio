"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const publicRoutes = new Set(["/login", "/login/", "/register", "/register/"]);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading, hasFetched, fetchCurrentUser } = useAuthStore();
  const isPublicRoute = publicRoutes.has(pathname);

  useEffect(() => {
    if (!hasFetched && !isLoading) {
      void fetchCurrentUser().catch(() => undefined);
    }
  }, [fetchCurrentUser, hasFetched, isLoading]);

  useEffect(() => {
    if (!hasFetched || isLoading) {
      return;
    }

    if (!currentUser && !isPublicRoute) {
      router.replace("/login/");
      return;
    }

    if (currentUser && isPublicRoute) {
      router.replace("/feed/");
    }
  }, [currentUser, hasFetched, isLoading, pathname, router]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!hasFetched || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}
