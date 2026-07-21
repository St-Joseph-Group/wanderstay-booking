import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-hairline bg-surface px-3.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-brand/30",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-brand/30",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("overline-sm mb-2 block text-ink", className)}
      {...props}
    />
  );
}
