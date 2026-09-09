import { headers } from "next/headers";
import { readPrefs } from "@/lib/prefs.server";
import { isMobileUserAgent } from "@/lib/device";
import { getMachineMedia } from "../queries";
import { selectRevealSource } from "../source";
import { RevealOrchestrator } from "./RevealOrchestrator.client";
import { VideoPreloader } from "./VideoPreloader.client";

type RevealStageProps = {
  params: LayoutProps<"/claw/[slug]">["params"];
};

export async function RevealStage({ params }: RevealStageProps) {
  const [{ slug }, prefs] = await Promise.all([params, readPrefs()]);

  if (prefs.skipReveal) {
    return null;
  }

  const [media, headerList] = await Promise.all([getMachineMedia(slug), headers()]);
  const isMobile = isMobileUserAgent(headerList.get("user-agent"));
  const source = selectRevealSource(media, { isMobile });

  return (
    <>
      <RevealOrchestrator slug={slug} source={source} unmute={!prefs.muted} />
      <VideoPreloader poster={source.poster} />
    </>
  );
}
