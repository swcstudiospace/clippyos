import { Badge } from "@/components/ui/badge";
import { SOURCE_LABELS, SOURCE_TONES, STAGE_LABELS, STAGE_TONES } from "@/lib/labels";
import type { ProgressSource, ProgressStage } from "@/lib/entities";

export function StagePill({
  stage,
}: {
  stage: ProgressStage | null;
}) {
  if (!stage) {
    return (
      <Badge tone="neutral" className="font-medium">
        Not started
      </Badge>
    );
  }
  return (
    <Badge tone={STAGE_TONES[stage]} className="font-medium">
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: ProgressSource | null | undefined }) {
  if (!source) return null;
  return <Badge tone={SOURCE_TONES[source]}>{SOURCE_LABELS[source]}</Badge>;
}
