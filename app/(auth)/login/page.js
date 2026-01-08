"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const supabase = createSupabaseBrowserClient();
    startTransition(async () => {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-600">Welcome back</p>
        <h1 className="text-2xl font-semibold text-slate-900">Sign in to People Uniter</h1>
        <p className="text-sm text-slate-600">
          Use your Supabase auth email/password. New here? Create an account below.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm font-medium text-slate-800">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-800">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
