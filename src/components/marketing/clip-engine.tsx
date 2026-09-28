import { Check } from "lucide-react";
import {
  AGENT_LINES,
  ENGINE_PARTS,
  ENGINE_STAGES,
  LAST_STAGE,
  NETWORKS,
  PIPELINE_STEPS,
  STORAGE_LAYERS,
  hookNetwork,
  stageState,
} from "@/lib/clip-engine";

const LEDS = 5;
const start = stageState(0).cam;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function PanelHead({ title, live }: { title: string; live: boolean }) {
  return (
    <div className="ce-panel__head">
      <span>{title}</span>
      <em className={live ? "is-live" : undefined}>{live ? "Live" : "Rolling out"}</em>
    </div>
  );
}

export function ClipEngine() {
  return (
    <div className="ce-stage" aria-hidden="true">
      <div className="ce-stage__grid" />
      <div className="ce-stage__glow" />
      <div className="ce-engine" data-engine-host />

      <div className="ce-stage__frame">
        <span className="ce-corner ce-corner--tl" />
        <span className="ce-corner ce-corner--tr" />
        <span className="ce-corner ce-corner--bl" />
        <span className="ce-corner ce-corner--br" />
      </div>

      <div className="ce-stage__top">
        <div className="ce-readout">
          <span className="ce-readout__key">ClippyOS engine · demo run</span>
          <span className="ce-readout__value" data-engine-mode>
            {ENGINE_STAGES[0].mode}
          </span>
          <span className="ce-readout__meta">
            <span data-engine-status>Booting</span> · stage{" "}
            <span data-engine-stage>00/{pad(LAST_STAGE)}</span> ·{" "}
            <span data-engine-tc>00:00:00:00</span>
          </span>
          <span className="ce-readout__meta" data-engine-cam>
            orbit {String(Math.round(start.rot)).padStart(3, "0")}° · pitch {start.pitch}° · dist{" "}
            {start.dist.toFixed(1)}
          </span>
        </div>
        <div className="ce-readout__side">
          <span className="ce-flag" data-engine-live data-live="true">
            Live
          </span>
          <div className="ce-leds">
            {Array.from({ length: LEDS }, (_, index) => (
              <i key={index} data-led />
            ))}
          </div>
        </div>
      </div>

      <ul className="ce-parts">
        {ENGINE_PARTS.map((part) => (
          <li key={part.label}>
            {part.count} {part.label}
          </li>
        ))}
      </ul>

      <div className="ce-stage__spec">
        <span>4 networks</span>
        <span>3 liaison channels</span>
        <span>approvals before publish</span>
        <span>0 clips on the machine disk</span>
      </div>

      <div className="ce-panel" data-panel="pipeline">
        <PanelHead title="Clip pipeline" live={false} />
        <div className="ce-panel__steps">
          {PIPELINE_STEPS.map((step, index) => (
            <div className="ce-scrub" key={step} data-panel-row>
              <span className="ce-scrub__num">{pad(index + 1)}</span>
              <span>{step}</span>
              <span className="ce-scrub__bar">
                <span className="ce-scrub__fill" data-step-fill />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="ce-panel" data-panel="approve">
        <PanelHead title="Approvals" live />
        {Array.from({ length: 4 }, (_, clip) => (
          <div className="ce-row" key={clip} data-panel-row>
            <span>
              Clip {pad(clip + 1)} · {hookNetwork(clip)}
            </span>
            <b>
              <Check aria-hidden="true" /> signed
            </b>
          </div>
        ))}
      </div>

      <div className="ce-panel" data-panel="publish">
        <PanelHead title="Social Machine" live />
        {NETWORKS.map((network) => (
          <div className="ce-row" key={network} data-panel-row>
            <span>{network}</span>
            <b>draft first</b>
          </div>
        ))}
      </div>

      <div className="ce-panel" data-panel="library">
        <PanelHead title="Library" live />
        {STORAGE_LAYERS.map((layer) => (
          <div className="ce-row" key={layer.label} data-panel-row>
            <span>{layer.label}</span>
            <b>{layer.detail}</b>
          </div>
        ))}
      </div>

      <div className="ce-panel" data-panel="agent">
        <PanelHead title="Hermes loop" live />
        {AGENT_LINES.map((line) => (
          <div className="ce-row" key={line} data-panel-row>
            <span>{line}</span>
            <b>in the OS</b>
          </div>
        ))}
      </div>
    </div>
  );
}
