"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getGoogleLoginUrl, createUser } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers and underscores.");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await createUser(formData);
      router.push("/login?registered=true");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create account. Please try again.");
      }
      console.error(err);
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
          <h1 className="text-3xl font-semibold text-silver">Create account</h1>
          <p className="text-sm text-silver-muted">
            Join Ugram today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-silver" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-accent-blue"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-silver" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-silver" htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-md border border-border bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-accent-blue"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-silver" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border border-border bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-accent-blue"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-silver" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-md border border-border bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-accent-blue"
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <div className="pt-4 space-y-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Sign up"}
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
              <Link href="/login/">Back to login</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
