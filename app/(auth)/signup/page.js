"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const supabase = createSupabaseBrowserClient();

    startTransition(async () => {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.replace("/onboarding");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-600">Join the community</p>
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="text-sm text-slate-600">Sign up with email/password to continue.</p>
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
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
