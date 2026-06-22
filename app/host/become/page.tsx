import { redirect } from "next/navigation";
import { Home, DollarSign, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { becomeHost } from "@/lib/actions/host";
import { getSessionProfile } from "@/lib/auth";

export default async function BecomeHostPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login?next=/host/become");
  if (session.profile.is_host) redirect("/host");

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Wanderstay your home
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
        Earn money sharing your space with travelers from around the world. It
        only takes a few minutes to list.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Feature
          icon={Home}
          title="List for free"
          body="Create your listing in minutes — photos, pricing, and amenities."
        />
        <Feature
          icon={DollarSign}
          title="You set the price"
          body="Choose your nightly rate and cleaning fee. Update them anytime."
        />
        <Feature
          icon={ShieldCheck}
          title="You're in control"
          body="Manage availability and review every booking from your dashboard."
        />
      </div>

      <form action={becomeHost} className="mt-12">
        <Button type="submit" variant="dark" size="lg">
          Get started
        </Button>
      </form>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-6 text-left">
      <Icon className="h-8 w-8 text-brand" />
      <h3 className="mt-3 font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
