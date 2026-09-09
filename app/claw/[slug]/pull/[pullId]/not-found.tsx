import type { Route } from "next";
import { LinkButton } from "@/components/ui/Button";
import { DEFAULT_MACHINE_SLUG } from "@/lib/machines";

export default function PullResultNotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col items-center justify-center gap-4 bg-background px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Pull not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This pull doesn&apos;t exist, or it isn&apos;t yours to see.
      </p>
      <LinkButton href={`/claw/${DEFAULT_MACHINE_SLUG}` as Route} variant="primary" size="md">
        Back to gold claw
      </LinkButton>
    </div>
  );
}
