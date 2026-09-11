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
};

/** Row height in em; shared by both columns and the arrow canvas. */
const ROW = 1.9;
/** Header height in em, so the three column headers line up. */
const HEADER = 1.8;
/** Arrow canvas width in em. */
const ARROW_WIDTH = 7;

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
}: {
  label: ReactNode;
  rows: ReactNode[];
  align: "left" | "center";
}) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <div
      style={{
        height: `${HEADER}em`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span>{label}</span>
    </div>
    <div style={{ display: "flex", alignItems: "stretch", gap: "0.2em" }}>
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
            }}
          >
            {row}
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
}: SetMappingProps) => {
  const rows = Math.max(left.length, right.length);
  // SVG units: tenths of an em, so the drawing scales uniformly with text.
  const w = ARROW_WIDTH * 10;
  const h = rows * ROW * 10;
  const y = (row: number) => (row * ROW + ROW / 2) * 10;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "0.6em",
      }}
    >
      <Column label={leftLabel} rows={left} align="center" />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: `${HEADER}em`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: arrowColor,
          }}
        >
          1:1
        </div>
        <svg
          width={`${ARROW_WIDTH}em`}
          height={`${rows * ROW}em`}
          viewBox={`0 0 ${w} ${h}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            <marker
              id="set-mapping-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
            </marker>
          </defs>
          {pairs.map(([from, to]) => (
            <line
              key={`${from}-${to}`}
              x1={3}
              y1={y(from)}
              x2={w - 3}
              y2={y(to)}
              stroke={arrowColor}
              strokeWidth={1.2}
              markerEnd="url(#set-mapping-arrow)"
            />
          ))}
        </svg>
      </div>

      <Column label={rightLabel} rows={right} align="center" />
    </div>
  );
};
