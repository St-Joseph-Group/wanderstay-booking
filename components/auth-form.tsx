"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MailCheck } from "lucide-react";
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

function VerifyPanel({ next }: { next: string }) {
  return (
    <div className="px-8 py-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <MailCheck className="h-7 w-7 text-accent-dark" strokeWidth={1.75} />
      </div>
      <h2 className="font-display text-2xl text-ink">Check your email</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        We&apos;ve sent a confirmation link to your inbox. Click it to verify your
        account, then log in to continue.
      </p>
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="mt-6 inline-block text-sm font-semibold text-accent-dark hover:text-ink"
      >
        Back to log in
      </Link>
    </div>
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
      <div className="rounded-2xl border border-hairline bg-surface shadow-card">
        <div className="border-b border-hairline px-8 py-5 text-center">
          <span className="overline text-accent-dark">
            {mode === "login" ? "Welcome back" : "Join Wanderstay"}
          </span>
        </div>
        {state?.needsVerification ? (
          <VerifyPanel next={next} />
        ) : (
        <form action={formAction} className="space-y-5 px-8 py-8">
          <div>
            <h2 className="font-display text-2xl text-ink">
              Welcome to Wanderstay
            </h2>
            <p className="mt-2 text-sm text-muted">
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
            <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <SubmitButton label={mode === "login" ? "Log in" : "Sign up"} />

          <p className="text-center text-sm text-muted">
            {mode === "login" ? (
              <>
                New to Wanderstay?{" "}
                <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-accent-dark hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-accent-dark hover:underline">
                  Log in
                </Link>
              </>
            )}
          </p>
        </form>
        )}
      </div>

      {mode === "login" && (
        <div className="mt-4 rounded-sm border border-hairline bg-surface px-4 py-3 text-center text-xs text-muted">
          <span className="font-semibold text-ink">Demo accounts</span> · guest:{" "}
          <code>alex@guest.com</code> · host: <code>demo@host.com</code> ·
          password: <code>password123</code>
        </div>
      )}
    </div>
  );
}
