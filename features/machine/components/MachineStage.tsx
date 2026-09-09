import type { ReactNode } from "react";

type MachineStageProps = {
  src: string;
  poster: string;
  autoplay: boolean;
  /** The animation `<form action={setPref}>` toggle: server output this
   * component positions on the cabinet. */
  children: ReactNode;
};

export function MachineStage({ src, poster, autoplay, children }: MachineStageProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <video
        key={autoplay ? "running" : "still"}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        muted
        playsInline
        loop
        preload="auto"
        aria-hidden="true"
        className="h-full w-full object-contain"
      />
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-3 p-4">
        {children}
      </div>
    </div>
  );
}
