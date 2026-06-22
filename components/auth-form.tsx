"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, signUp, type AuthState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="dark" size="lg" className="w-full" disabled={pending}>
      {pending ? "Please wait…" : label}
    </Button>
  );
}

export function AuthForm({
  mode,
  next = "/",
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(
    action,
    undefined
  );

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-card">
        <div className="border-b border-neutral-100 px-6 py-4 text-center">
          <h1 className="text-lg font-bold text-ink">
            {mode === "login" ? "Log in" : "Sign up"}
          </h1>
        </div>
        <form action={formAction} className="space-y-4 px-6 py-6">
          <div>
            <h2 className="text-xl font-semibold text-ink">
              Welcome to Wanderstay
            </h2>
            <p className="mt-1 text-sm text-muted">
              {mode === "login"
                ? "Log in to book your next stay."
                : "Create an account to start booking."}
            </p>
          </div>

          <input type="hidden" name="next" value={next} />

          {mode === "signup" && (
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="Jane Traveler"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <SubmitButton label={mode === "login" ? "Log in" : "Sign up"} />

          <p className="text-center text-sm text-muted">
            {mode === "login" ? (
              <>
                New to Wanderstay?{" "}
                <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-brand hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand hover:underline">
                  Log in
                </Link>
              </>
            )}
          </p>
        </form>
      </div>

      {mode === "login" && (
        <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-center text-xs text-muted">
          <span className="font-semibold text-ink">Demo accounts</span> · guest:{" "}
          <code>alex@guest.com</code> · host: <code>demo@host.com</code> ·
          password: <code>password123</code>
        </div>
      )}
    </div>
  );
}
