import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <Compass className="mb-4 h-12 w-12 text-brand" />
      <h1 className="text-3xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-muted">
        We couldn&apos;t find the page you were looking for. It may have moved or
        no longer exists.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="dark">Back to home</Button>
      </Link>
    </div>
  );
}
