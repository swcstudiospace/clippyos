import { Badge } from "@/components/ui/badge";
import { VERDICT_LABELS, type PerformanceVerdict } from "@/lib/performance";

export function ScoreBadge({
  score,
  verdict,
}: {
  score: number | null;
  verdict?: PerformanceVerdict | null;
}) {
  if (score == null && (!verdict || verdict === "UNKNOWN")) {
    return <Badge tone="neutral">No score yet</Badge>;
  }
  const tone =
    verdict === "WINNER" ? "green" : verdict === "WEAK" ? "red" : verdict === "NEUTRAL" ? "blue" : "neutral";
  return (
    <Badge tone={tone}>
      {score != null ? `Score ${score}` : ""}
      {verdict && verdict !== "UNKNOWN" ? `${score != null ? " · " : ""}${VERDICT_LABELS[verdict]}` : ""}
    </Badge>
  );
}
