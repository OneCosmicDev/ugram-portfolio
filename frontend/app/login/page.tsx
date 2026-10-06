"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getGoogleLoginUrl, loginLocal, setAuthToken } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageContent hasOAuthError={false} />}>
      <LoginPageWithSearchParams />
    </Suspense>
  );
}

function LoginPageWithSearchParams() {
  const searchParams = useSearchParams();
  const hasOAuthError = searchParams.get("error") === "oauth_failed";
  const isRegistered = searchParams.get("registered") === "true";

  return <LoginPageContent hasOAuthError={hasOAuthError} isRegistered={isRegistered} />;
}
import { useAuthStore } from "@/store/useAuthStore";

function LoginPageContent({ hasOAuthError, isRegistered }: { hasOAuthError: boolean; isRegistered?: boolean }) {
  const router = useRouter();
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = await loginLocal(email, password);
      setAuthToken(token);
      await fetchCurrentUser();
      router.push("/feed");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-navy p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <div className="space-y-3 text-center mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-accent-blue">
            Ugram
          </p>
          <h1 className="text-3xl font-semibold text-silver">Connection</h1>
          <p className="text-sm text-silver-muted">
            Access your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-silver" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-accent-blue"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-silver" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-accent-blue"
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="pt-4 space-y-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-navy px-2 text-silver-muted">Or continue with</span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full bg-transparent">
              <a href={getGoogleLoginUrl()}>Google</a>
            </Button>

            <Button asChild variant="secondary" className="w-full">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </form>

        {hasOAuthError && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Google connection failed. Please verify OAuth configuration.
          </div>
        )}

        {isRegistered && (
          <div className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            Account created successfully! You can now login.
          </div>
        )}
      </div>
    </div>
  );
}
