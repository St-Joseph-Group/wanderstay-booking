import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionProfile } from "@/lib/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getSessionProfile();
  if (session) redirect(next ?? "/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AuthForm mode="signup" next={next ?? "/"} />
    </div>
  );
}
