import { useRef, useState } from "react";
import { MAGIC_DENSITY, SET_BITS, squareName } from "./magicDensityData";

const DATA = MAGIC_DENSITY;

/**
 * A ridgeline surface: one curve per square, stacked in depth from a8 at the
 * front to h1 at the back. Nearer ridges are drawn last and filled with the
 * background, so they occlude the ones behind them. Hovering a ridge
 * highlights it, brings it in front of its neighbors, and marks its mean
 * set-bit count. The hover target is the whole drawing: a point under a ridge
 * picks the frontmost ridge covering it, and anywhere else picks the ridge
 * whose baseline band the point falls in, so there are no dead spots.
 */
export const MagicDensitySurface = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [hoverBits, setHoverBits] = useState<number | null>(null);
  // A click pins whatever is under the pointer until a click on empty space.
  const [pinned, setPinned] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 1100;
  const height = 560;
  const left = 90;
  const bottom = 500;
  const stepX = 11.5;
  const depthX = 3.6;
  const depthY = 4.4;
  const ridgeHeight = 150;
  const maxY = Math.max(...DATA.flat());

  const x = (sq: number, bits: number) =>
    left + sq * depthX + (bits - 1) * stepX;
  const y = (sq: number, found: number) =>
    bottom - sq * depthY - (found / maxY) * ridgeHeight;

  const ridges = DATA.map((counts, sq) => {
    const points = counts.map((found, i) => `${x(sq, i + 1)},${y(sq, found)}`);
    const base = `${x(sq, SET_BITS)},${y(sq, 0)} ${x(sq, 1)},${y(sq, 0)}`;
    const total = counts.reduce((a, b) => a + b, 0);
    const mean =
      total === 0
        ? 0
        : counts.reduce((acc, found, i) => acc + found * (i + 1), 0) / total;
    // Height of the ridge at the mean, interpolated between neighbors.
    const lo = Math.max(0, Math.min(SET_BITS - 1, Math.floor(mean) - 1));
    const hi = Math.min(SET_BITS - 1, lo + 1);
    const t = mean - 1 - lo;
    const atMean = counts[lo] * (1 - t) + counts[hi] * t;
    return {
      sq,
      polygon: `${points.join(" ")} ${base}`,
      line: points.join(" "),
      total,
      mean,
      atMean,
    };
  });

  /** Height of ridge `sq` at viewBox x, or 0 outside its span. */
  const ridgeTop = (sq: number, vx: number) => {
    const b = (vx - x(sq, 1)) / stepX;
    if (b < 0 || b > SET_BITS - 1) return y(sq, 0);
    const lo = Math.floor(b);
    const hi = Math.min(SET_BITS - 1, lo + 1);
    const t = b - lo;
    return y(sq, DATA[sq][lo] * (1 - t) + DATA[sq][hi] * t);
  };

  /** What the pointer is over: a ridge, an axis count, or nothing. */
  const targetAt = (
    e: React.MouseEvent<SVGSVGElement>,
  ): { sq: number | null; bits: number | null } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * width;
    const vy = ((e.clientY - rect.top) / rect.height) * height;
    const inSpan = (sq: number) =>
      vx >= x(sq, 1) - stepX / 2 && vx <= x(sq, SET_BITS) + stepX / 2;

    // Below the front baseline is the set-bits axis: pick a count instead.
    if (vy > bottom) {
      if (vy > bottom + 30 || !inSpan(0)) return null;
      const bits = Math.round((vx - x(0, 1)) / stepX) + 1;
      return { sq: null, bits: Math.max(1, Math.min(SET_BITS, bits)) };
    }
    // Frontmost ridge whose filled area contains the point wins.
    for (let sq = 0; sq < ridges.length; sq++) {
      if (vy <= y(sq, 0) && vy >= ridgeTop(sq, vx)) return { sq, bits: null };
    }
    // Otherwise the ridge whose baseline band the point is in, if any.
    const band = Math.round((bottom - vy) / depthY);
    if (band < 0 || band >= ridges.length || !inSpan(band)) return null;
    return { sq: band, bits: null };
  };

  const apply = (target: ReturnType<typeof targetAt>) => {
    setHovered(target?.sq ?? null);
    setHoverBits(target?.bits ?? null);
  };

  const onHover = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!pinned) apply(targetAt(e));
  };

  /** Three label/value rows for the key, in every state, so it never shifts. */
  const keyRows = (): [string, string][] => {
    if (hovered !== null) {
      const { sq, total, mean } = ridges[hovered];
      return [
        ["Square", squareName(sq)],
        ["Magics found", total.toLocaleString()],
        ["Mean bit count", mean.toFixed(1)],
      ];
    }
    if (hoverBits !== null) {
      const grand = ridges.reduce((acc, r) => acc + r.total, 0);
      const below = DATA.reduce(
        (acc, counts) =>
          acc + counts.slice(0, hoverBits).reduce((a, b) => a + b, 0),
        0,
      );
      const pct = grand === 0 ? 0 : (below / grand) * 100;
      return [
        ["Square", "all"],
        ["Magics found", `${pct.toFixed(1)}%`],
        ["Bit count", `≤ ${hoverBits}`],
      ];
    }
    return [
      ["Square", "–"],
      ["Magics found", "–"],
      ["Mean bit count", "–"],
    ];
  };

  // Clicking a ridge or the axis selects it and pins it; clicking empty
  // space clears the pin.
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = targetAt(e);
    apply(target);
    setPinned(target !== null);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "100%",
        height: "auto",
        overflow: "visible",
        cursor: "pointer",
      }}
      role="img"
      aria-label="Magics found by set-bit count for every rook square"
      onMouseEnter={onHover}
      onMouseMove={onHover}
      onMouseLeave={() => {
        if (pinned) return;
        setHovered(null);
        setHoverBits(null);
      }}
      onClick={onClick}
    >
      {/* Back to front so nearer ridges occlude farther ones. */}
      {[...ridges].reverse().map((ridge) => (
        <Ridge key={ridge.sq} {...ridge} hot={false} />
      ))}
      {/* The hovered ridge again, on top of everything in front of it. */}
      {hovered !== null && <Ridge {...ridges[hovered]} hot />}

      {/* Depth axis: label the a-file square that starts each rank. */}
      {[0, 8, 16, 24, 32, 40, 48, 56].map((sq) => (
        <text
          key={sq}
          x={x(sq, 1) - 10}
          y={y(sq, 0) + 5}
          textAnchor="end"
          fontSize={14}
          fill="currentColor"
          opacity={0.8}
        >
          {squareName(sq)}
        </text>
      ))}
      <text
        x={x(63, 1) - 10}
        y={y(63, 0) + 5}
        textAnchor="end"
        fontSize={14}
        fill="currentColor"
        opacity={0.8}
      >
        {squareName(63)}
      </text>

      {/* Set-bits axis along the front ridge. */}
      {[1, 8, 16, 24, 32, 40, 48, 56, 64].map((bits) => (
        <text
          key={bits}
          x={x(0, bits)}
          y={bottom + 22}
          textAnchor="middle"
          fontSize={14}
          fill="currentColor"
          opacity={0.8}
        >
          {bits}
        </text>
      ))}
      <text
        x={x(0, 32)}
        y={bottom + 56}
        textAnchor="middle"
        fontSize={20}
        fill="currentColor"
      >
        Set bits in the magic
      </text>

      {/* Depth-axis title, running parallel to the rank labels. */}
      {(() => {
        const dx = x(63, 1) - x(0, 1);
        const dy = y(63, 0) - y(0, 0);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const len = Math.hypot(dx, dy);
        // Midpoint of the axis, pushed outward along its normal past the labels.
        const offset = 62;
        const mx = (x(0, 1) + x(63, 1)) / 2 + (dy / len) * offset;
        const my = (y(0, 0) + y(63, 0)) / 2 - (dx / len) * offset;
        return (
          <text
            transform={`translate(${mx}, ${my}) rotate(${angle})`}
            textAnchor="middle"
            fontSize={20}
            fill="currentColor"
          >
            Square
          </text>
        );
      })()}

      {/* Hovering the set-bits axis: a floor line across every square. */}
      {hoverBits !== null &&
        (() => {
          return (
            <g style={{ pointerEvents: "none" }}>
              <line
                x1={x(0, hoverBits + 0.5)}
                y1={y(0, 0)}
                x2={x(63, hoverBits + 0.5)}
                y2={y(63, 0)}
                stroke="white"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            </g>
          );
        })()}

      {/* The hovered ridge's mean and total, drawn on top of everything. */}
      {hovered !== null &&
        (() => {
          const { sq, mean, atMean } = ridges[hovered];
          const mx = x(sq, mean);
          const my = y(sq, atMean);
          return (
            <g style={{ pointerEvents: "none" }}>
              <line
                x1={mx}
                y1={y(sq, 0)}
                x2={mx}
                y2={my}
                stroke="white"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <circle cx={mx} cy={my} r={4} fill="white" />
            </g>
          );
        })()}

      <Key x={width - 20 - 280} y={16} pinned={pinned} rows={keyRows()} />
    </svg>
  );
};

const Ridge = ({
  polygon,
  line,
  hot,
}: {
  polygon: string;
  line: string;
  hot: boolean;
}) => (
  <g>
    <polygon points={polygon} fill="#111" />
    <polyline
      points={line}
      fill="none"
      stroke={hot ? "white" : "var(--r-link-color)"}
      strokeWidth={hot ? 2.6 : 1.4}
      strokeLinejoin="round"
    />
  </g>
);

/**
 * A fixed-size panel of label/value rows. Labels hug the left edge and values
 * the right, so changing text never moves anything. A white border marks a
 * pinned selection.
 */
const Key = ({
  x,
  y,
  rows,
  pinned,
}: {
  x: number;
  y: number;
  rows: [string, string][];
  pinned: boolean;
}) => {
  const w = 280;
  const rowH = 30;
  const pad = 12;
  const h = pad * 2 + rowH * rows.length;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="#111"
        stroke={pinned ? "white" : "var(--r-link-color)"}
        strokeOpacity={pinned ? 0.9 : 0.5}
        strokeWidth={1.5}
      />
      {rows.map(([label, value], i) => {
        const cy = y + pad + rowH * i + rowH / 2 + 6;
        return (
          <g key={label}>
            <text
              x={x + 14}
              y={cy}
              fontSize={17}
              fill="currentColor"
              opacity={0.75}
            >
              {label}
            </text>
            <text
              x={x + w - 14}
              y={cy}
              textAnchor="end"
              fontSize={19}
              fill="white"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {value}
            </text>
          </g>
        );
      })}
    </g>
  );
};
