import { verifyPull } from "@/lib/pull/fairness";
import { getPullVerification } from "../queries.pull";

type PullVerificationProps = {
  pullId: string;
};

export async function PullVerification({ pullId }: PullVerificationProps) {
  const verification = await getPullVerification({ pullId });
  if (!verification) {
    return null;
  }

  const verified = verifyPull(
    {
      serverSeed: verification.serverSeed,
      serverSeedHash: verification.serverSeedHash,
      clientSeed: verification.clientSeed,
      tierWeights: verification.tierWeights,
    },
    verification.items,
  );

  return (
    <details className="rounded-2xl border border-border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-medium text-foreground">Verify this pull</summary>
      <div className="mt-4 flex flex-col gap-4 text-muted-foreground">
        <p>
          {verified
            ? "Verified: recomputing the roll stream from the values below reproduces every drawn item."
            : "Verification failed: the values below do not reproduce this pull's drawn items."}
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 break-all font-mono text-xs">
          <dt className="text-foreground">Server seed hash</dt>
          <dd>{verification.serverSeedHash}</dd>
          <dt className="text-foreground">Server seed</dt>
          <dd>{verification.serverSeed}</dd>
          <dt className="text-foreground">Client seed</dt>
          <dd>{verification.clientSeed}</dd>
          <dt className="text-foreground">Tier weights (bps)</dt>
          <dd>{verification.tierWeights.join(", ")}</dd>
        </dl>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="text-foreground">
              <th className="pr-3 font-medium">#</th>
              <th className="pr-3 font-medium">Roll</th>
              <th className="font-medium">Tier</th>
            </tr>
          </thead>
          <tbody>
            {verification.items.map((item) => (
              <tr key={item.drawIndex}>
                <td className="pr-3">{item.drawIndex}</td>
                <td className="pr-3">{item.rollValue}</td>
                <td>{item.tier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
