"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-brand" />
      <h1 className="text-3xl font-bold text-ink">Something went wrong</h1>
      <p className="mt-2 text-muted">
        An unexpected error occurred. Please try again.
      </p>
      <Button variant="dark" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
