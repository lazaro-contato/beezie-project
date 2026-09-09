import { RevealLoadingPanel } from "@/features/reveal/components/skeletons";

export default function PullResultLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col bg-background">
      <RevealLoadingPanel />
    </div>
  );
}
