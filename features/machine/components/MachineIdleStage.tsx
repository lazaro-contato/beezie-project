import { readPrefs } from "@/lib/prefs.server";
import { ToggleForm } from "./ToggleForm";
import { MachineStage } from "./MachineStage";
import { IDLE_VIDEO_POSTER, IDLE_VIDEO_SRC } from "../idle-media";

type MachineIdleStageProps = {
  slug: string;
};

export async function MachineIdleStage({ slug }: MachineIdleStageProps) {
  const prefs = await readPrefs();

  return (
    <MachineStage
      src={IDLE_VIDEO_SRC}
      poster={IDLE_VIDEO_POSTER}
      autoplay={!prefs.reducedMotion}
    >
      <ToggleForm
        slug={slug}
        prefKey="reducedMotion"
        current={prefs.reducedMotion}
        nextLabel={
          prefs.reducedMotion
            ? "Animation off — turn animation on"
            : "Animation on — turn animation off"
        }
        shortLabel={prefs.reducedMotion ? "Animation off" : "Animation on"}
      />
    </MachineStage>
  );
}
