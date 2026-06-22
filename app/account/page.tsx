import { redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { AccountForm } from "@/components/account-form";
import { getSessionProfile } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/account");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold text-ink">Account</h1>
      <div className="mb-8 flex items-center gap-4">
        <Avatar
          name={session.profile.full_name}
          src={session.profile.avatar_url}
          size={64}
        />
        <div>
          <p className="text-lg font-semibold text-ink">
            {session.profile.full_name}
          </p>
          <p className="text-sm text-muted">
            {session.profile.is_host ? "Host" : "Guest"} · {session.email}
          </p>
        </div>
      </div>
      <AccountForm
        fullName={session.profile.full_name ?? ""}
        bio={session.profile.bio ?? ""}
        email={session.email}
      />
    </div>
  );
}
