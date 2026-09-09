import { formatCents, type MoneyPrecision } from "@/lib/money";
import { cn } from "@/lib/cn";

type MoneyProps = {
  cents: number;
  precision?: MoneyPrecision;
  className?: string;
};

export function Money({ cents, precision = "auto", className }: MoneyProps) {
  return (
    <data value={cents} className={cn("tabular-nums", className)}>
      {formatCents(cents, { precision })}
    </data>
  );
}
