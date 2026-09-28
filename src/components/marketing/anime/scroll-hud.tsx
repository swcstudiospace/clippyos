const TICKS = 37;

export function ScrollHud() {
  return (
    <div className="lp-hud" data-hud aria-hidden="true">
      <span className="lp-hud__index" data-hud-index>
        01/01
      </span>
      <span className="lp-hud__label" data-hud-label>
        &nbsp;
      </span>
      <span className="lp-hud__ruler" data-hud-ruler>
        {Array.from({ length: TICKS }, (_, index) => (
          <i
            key={index}
            className={index % 6 === 0 ? "lp-hud__tick lp-hud__tick--major" : "lp-hud__tick"}
          />
        ))}
        <b className="lp-hud__head" data-hud-head />
      </span>
      <span className="lp-hud__pct" data-hud-pct>
        000
      </span>
    </div>
  );
}
