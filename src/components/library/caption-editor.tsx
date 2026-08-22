import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatTimecode, parseTimecode, type CaptionCue, type CaptionTrack } from "@/lib/library";

export function CaptionEditor({
  track,
  pending,
  onSave,
  onDownload,
}: {
  track: CaptionTrack;
  pending?: boolean;
  onSave: (cues: CaptionCue[]) => void;
  onDownload: (format: "SRT" | "VTT") => void;
}) {
  const [cues, setCues] = useState<CaptionCue[]>(track.cues);

  useEffect(() => {
    setCues(track.cues);
  }, [track.id, track.updatedAt]);

  function update(index: number, patch: Partial<CaptionCue>) {
    setCues((current) => current.map((cue, i) => (i === index ? { ...cue, ...patch } : cue)));
  }

  function commitTime(index: number, field: "startMs" | "endMs", raw: string) {
    const ms = parseTimecode(raw);
    if (ms == null) return;
    update(index, { [field]: ms });
  }

  function split(index: number) {
    setCues((current) => {
      const cue = current[index];
      if (!cue) return current;
      const mid = Math.round((cue.startMs + cue.endMs) / 2);
      const words = cue.text.split(" ");
      const half = Math.max(1, Math.floor(words.length / 2));
      const left = { ...cue, endMs: mid, text: words.slice(0, half).join(" ") };
      const right = { startMs: mid, endMs: cue.endMs, text: words.slice(half).join(" ") || cue.text };
      return [...current.slice(0, index), left, right, ...current.slice(index + 1)];
    });
  }

  function merge(index: number) {
    setCues((current) => {
      if (index >= current.length - 1) return current;
      const a = current[index];
      const b = current[index + 1];
      const merged = { startMs: a.startMs, endMs: b.endMs, text: `${a.text} ${b.text}`.trim() };
      return [...current.slice(0, index), merged, ...current.slice(index + 2)];
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={() => onSave(cues)}>
          Save cues
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => onDownload("SRT")}>
          Download SRT
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => onDownload("VTT")}>
          Download VTT
        </Button>
      </div>
      <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {cues.map((cue, index) => (
          <CueRow
            key={`${track.id}-${index}-${cue.startMs}`}
            cue={cue}
            index={index}
            onText={(text) => update(index, { text })}
            onTime={commitTime}
            onSplit={() => split(index)}
            onMerge={() => merge(index)}
          />
        ))}
      </ul>
    </div>
  );
}

function CueRow({
  cue,
  index,
  onText,
  onTime,
  onSplit,
  onMerge,
}: {
  cue: CaptionCue;
  index: number;
  onText: (text: string) => void;
  onTime: (index: number, field: "startMs" | "endMs", raw: string) => void;
  onSplit: () => void;
  onMerge: () => void;
}) {
  const [start, setStart] = useState(formatTimecode(cue.startMs));
  const [end, setEnd] = useState(formatTimecode(cue.endMs));

  useEffect(() => {
    setStart(formatTimecode(cue.startMs));
    setEnd(formatTimecode(cue.endMs));
  }, [cue.startMs, cue.endMs]);

  return (
    <li className="rounded-control bg-secondary-surface p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Start"
          className="w-24"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          onBlur={() => onTime(index, "startMs", start)}
        />
        <span className="text-caption text-muted">→</span>
        <Input
          aria-label="End"
          className="w-24"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          onBlur={() => onTime(index, "endMs", end)}
        />
        <Button type="button" size="sm" variant="ghost" onClick={onSplit}>
          Split
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onMerge}>
          Merge
        </Button>
      </div>
      <Textarea
        className="mt-2"
        value={cue.text}
        onChange={(event) => onText(event.target.value)}
        rows={2}
      />
    </li>
  );
}
