import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { ClippyMark } from "@/components/brand/clippy-mark";
import {
  AGENT_LINES,
  BLADE_X,
  CLIP_COUNT,
  ENGINE_STAGES,
  LAST_STAGE,
  NETWORKS,
  PIPELINE_STEPS,
  SCAN_RANGE,
  STORAGE_LAYERS,
  engineFrames,
  hookNetwork,
  rigPose,
} from "@/lib/clip-engine";

const frames = engineFrames();
const rig = rigPose(0);
const CLIP_HUES = [160, 32, 198, 268];
const SUBJECT_X = ["36%", "50%", "64%"];
const CUBE_FACES = ["front", "back", "right", "left", "top", "bottom"] as const;
const LEDS = 5;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function vars(values: Record<string, number | string>): CSSProperties {
  return values as CSSProperties;
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
      <div className="ce-engine">
        <div
          className="ce-rig"
          data-engine-rig
          style={vars({ "--cam-rx": rig.rx, "--cam-ry": rig.ry, "--zoom": rig.zoom })}
        >
          <div
            className="ce-core"
            data-engine-core
            style={vars({ "--core": rig.core, "--boot": 1, "--cube": 0 })}
          >
            <span className="ce-core__halo" />
            <div className="ce-core__cube">
              {CUBE_FACES.map((face) => (
                <span key={face} className={`ce-core__face ce-core__face--${face}`}>
                  {face === "top" || face === "bottom" ? null : <ClippyMark size={44} />}
                </span>
              ))}
            </div>
          </div>
          <div className="ce-spin" data-engine-spin style={vars({ "--spin": 0 })}>
            <span
              className="ce-scan"
              data-scan
              style={vars({ "--scan": SCAN_RANGE[0], "--scan-o": 0 })}
            />
            <div className="ce-blades" data-blades style={vars({ "--blade-o": 0 })}>
              {BLADE_X.map((x) => (
                <span key={x} className="ce-blade" style={vars({ "--bx": x })} />
              ))}
            </div>
            {frames.map((frame) => {
              const pose = frame.poses[0];
              return (
                <span
                  key={frame.index}
                  className={frame.hook ? "ce-frame is-hook" : "ce-frame"}
                  data-frame
                  data-index={frame.index}
                  data-clip={frame.clip}
                  data-slot={frame.slot}
                  style={vars({
                    "--x": pose.x,
                    "--y": pose.y,
                    "--z": pose.z,
                    "--ry": pose.ry,
                    "--rx": pose.rx,
                    "--w": pose.w,
                    "--h": pose.h,
                    "--sp": pose.sp,
                    "--hot": pose.hot,
                    "--cap": pose.cap,
                    "--pub": pose.pub,
                    "--ok": 0,
                    "--hue": CLIP_HUES[frame.clip],
                    "--sx": SUBJECT_X[frame.slot],
                  })}
                >
                  <span className="ce-frame__media" />
                  <span className="ce-frame__sprockets" />
                  <span className="ce-frame__hot" />
                  {frame.hook ? (
                    <>
                      <span className="ce-frame__cap">
                        <i />
                        <i />
                      </span>
                      <span className="ce-frame__ok">
                        <Check />
                      </span>
                      <span className="ce-frame__net">{hookNetwork(frame.clip)}</span>
                    </>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="ce-stage__frame">
        <span className="ce-corner ce-corner--tl" />
        <span className="ce-corner ce-corner--tr" />
        <span className="ce-corner ce-corner--bl" />
        <span className="ce-corner ce-corner--br" />
      </div>

      <div className="ce-stage__top">
        <div className="ce-readout">
          <span className="ce-readout__key">ClippyOS clip engine · demo run</span>
          <span className="ce-readout__value" data-engine-mode>
            {ENGINE_STAGES[0].mode}
          </span>
          <span className="ce-readout__meta">
            <span data-engine-status>Booting</span> · stage{" "}
            <span data-engine-stage>00/{pad(LAST_STAGE)}</span> ·{" "}
            <span data-engine-tc>00:00:00:00</span>
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
        {Array.from({ length: CLIP_COUNT }, (_, clip) => (
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
