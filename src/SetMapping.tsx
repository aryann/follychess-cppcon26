import type { ReactNode } from "react";

type SetMappingProps = {
  leftLabel: ReactNode;
  rightLabel: ReactNode;
  /** Elements of the left set, one per row. */
  left: ReactNode[];
  /** Elements of the right set, one per row. */
  right: ReactNode[];
  /** Arrows to draw, as [left row, right row] pairs. */
  pairs: [number, number][];
  /** Width of the arrow canvas in em. Defaults to 7. */
  arrowWidth?: number;
  /**
   * Reveal the arrows one click at a time, in order. The newest arrow is drawn
   * in the highlight color, earlier ones in the piece color, and an arrow that
   * lands on an already-used element in the collision color.
   */
  stepped?: boolean;
};

/** Row height in em; shared by both columns and the arrow canvas. */
const ROW = 1.9;
/** Header height in em: room for a two-line label, with every header sitting on the same baseline. */
const HEADER = 3;

const arrowColor = "var(--board-piece-color)";

/** Curly brace drawn as a path so it stretches to any height with a thin, even stroke. */
const Brace = ({ rows, side }: { rows: number; side: "left" | "right" }) => {
  // Path for an opening brace in a 20 x 100 box; mirrored for the closing one.
  const d =
    side === "left"
      ? "M 18 0 Q 10 0 10 8 L 10 42 Q 10 50 2 50 Q 10 50 10 58 L 10 92 Q 10 100 18 100"
      : "M 2 0 Q 10 0 10 8 L 10 42 Q 10 50 18 50 Q 10 50 10 58 L 10 92 Q 10 100 2 100";

  return (
    <svg
      aria-hidden
      width="0.7em"
      height={`${rows * ROW}em`}
      viewBox="0 0 20 100"
      preserveAspectRatio="none"
      style={{ overflow: "visible", opacity: 0.6 }}
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const Column = ({
  label,
  rows,
  align,
  collisionStep,
  mappedStep,
  pending,
  sourceStep,
}: {
  label: ReactNode;
  rows: ReactNode[];
  align: "left" | "center";
  /** For a row hit by a colliding arrow, the fragment index of that arrow. */
  collisionStep?: (row: number) => number | undefined;
  /** For a row hit by any arrow, the fragment index of the first one. */
  mappedStep?: (row: number) => number | undefined;
  /** Draw rows in the pending color until an arrow reaches them. */
  pending?: boolean;
  /** For a row an arrow leaves from, the fragment index of that arrow. */
  sourceStep?: (row: number) => number | undefined;
}) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <div
      style={{
        height: `${HEADER}em`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        textAlign: "center",
        lineHeight: 1.15,
        paddingBottom: "0.6em",
        boxSizing: "border-box",
      }}
    >
      <span>{label}</span>
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        gap: "0.2em",
      }}
    >
      <Brace rows={rows.length} side="left" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            style={{
              height: `${ROW}em`,
              display: "flex",
              alignItems: "center",
              justifyContent: align === "center" ? "center" : "flex-start",
              whiteSpace: "nowrap",
              color: pending ? "rgba(255, 255, 255, 0.45)" : undefined,
            }}
          >
            {(() => {
              // Wrap the row so it changes color at the step that maps it,
              // and again at the step that collides on it.
              let content = row;
              const collision = collisionStep?.(i);
              if (collision !== undefined) {
                content = (
                  <span
                    className="fragment collision-target"
                    data-fragment-index={collision}
                  >
                    {content}
                  </span>
                );
              }
              const mapped = mappedStep?.(i);
              if (mapped !== undefined) {
                content = (
                  <span
                    className="fragment mapped-target"
                    data-fragment-index={mapped}
                  >
                    {content}
                  </span>
                );
              }
              // Box the row while its arrow is the current step.
              const source = sourceStep?.(i);
              if (source !== undefined) {
                content = (
                  <span
                    className="fragment current-source"
                    data-fragment-index={source}
                  >
                    {content}
                  </span>
                );
              }
              return content;
            })()}
          </div>
        ))}
      </div>
      <Brace rows={rows.length} side="right" />
    </div>
  </div>
);

/** Two sets drawn as braced columns, with arrows pairing their elements. */
export const SetMapping = ({
  leftLabel,
  rightLabel,
  left,
  right,
  pairs,
  arrowWidth = 7,
  stepped = false,
}: SetMappingProps) => {
  const rows = Math.max(left.length, right.length);
  // SVG units: tenths of an em, so the drawing scales uniformly with text.
  const w = arrowWidth * 10;
  const h = rows * ROW * 10;
  const y = (row: number) => (row * ROW + ROW / 2) * 10;

  // Targets hit more than once: the later arrows are collisions, and the
  // target turns the collision color at the step of its first collision.
  const seen = new Set<number>();
  const firstHitStep = new Map<number, number>();
  const firstCollisionStep = new Map<number, number>();
  const collides = pairs.map(([, to], i) => {
    const dup = seen.has(to);
    seen.add(to);
    if (!dup) {
      firstHitStep.set(to, i);
    } else if (!firstCollisionStep.has(to)) {
      firstCollisionStep.set(to, i);
    }
    return dup;
  });

  return (
    <div
      className="set-mapping"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "0.6em",
      }}
    >
      <Column
        label={leftLabel}
        rows={left}
        align="center"
        sourceStep={
          stepped
            ? (row) => {
                const i = pairs.findIndex(([from]) => from === row);
                return i === -1 ? undefined : i;
              }
            : undefined
        }
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: `${HEADER}em`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "0.6em",
            boxSizing: "border-box",
            color: arrowColor,
          }}
        >
          1:1
        </div>
        <svg
          width={`${arrowWidth}em`}
          height={`${rows * ROW}em`}
          viewBox={`0 0 ${w} ${h}`}
          style={{ overflow: "visible" }}
        >
          {pairs.map(([from, to], i) => {
            // Leave and arrive horizontally: straight when the rows match,
            // an S-curve when they don't, so crossings stay readable.
            const x1 = 3;
            const x2 = w - 3;
            const xm = (x1 + x2) / 2;
            const yt = y(to);
            const d = `M ${x1} ${y(from)} C ${xm} ${y(from)}, ${xm} ${yt}, ${x2} ${yt}`;
            const head = `M ${x2} ${yt} L ${x2 - 6} ${yt - 3.5} L ${x2 - 6} ${yt + 3.5} z`;
            const className = [
              "arrow",
              stepped && "fragment",
              collides[i] && "collision",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g
                key={`${from}-${to}-${i}`}
                className={className}
                data-fragment-index={stepped ? i : undefined}
              >
                <path
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.2}
                />
                <path d={head} fill="currentColor" />
              </g>
            );
          })}
        </svg>
      </div>

      <Column
        label={rightLabel}
        rows={right}
        align="center"
        collisionStep={
          stepped ? (row) => firstCollisionStep.get(row) : undefined
        }
        mappedStep={stepped ? (row) => firstHitStep.get(row) : undefined}
        pending={stepped}
      />
    </div>
  );
};
