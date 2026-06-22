"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, type ProfileState } from "@/lib/actions/profile";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="dark" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function AccountForm({
  fullName,
  bio,
  email,
}: {
  fullName: string;
  bio: string;
  email: string | null;
}) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfile,
    undefined
  );

  React.useEffect(() => {
    if (state?.success) toast("Profile updated.", "success");
  }, [state]);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email ?? ""} disabled className="bg-neutral-50" />
      </div>
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} required />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={bio}
          placeholder="Tell others a little about yourself…"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <SaveButton />
    </form>
  );
}
