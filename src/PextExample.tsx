import { useId, useLayoutEffect, useRef, useState } from "react";

/**
 * A 64-bit PEXT example drawn like the figure in Intel's manual: the source
 * on top, the mask below it, and the destination at the bottom, with
 * connectors showing each selected bit dropping into the packed result.
 */
type PextExampleProps = {
  /** 64-bit mask, most significant bit first, spaces allowed between groups. */
  mask: string;
  /** 64-bit occupancy, most significant bit first, spaces allowed between groups. */
  occupied: string;
  /** Show only the mask row, keeping the layout of the full diagram. */
  maskOnly?: boolean;
};

const WIDTH = 64;

const strip = (bits: string): string => bits.replace(/\s+/g, "");

/** Positions (0 = LSB) of the set bits, lowest first: the packing order. */
const setPositions = (bits: string): number[] => {
  const positions: number[] = [];
  for (let i = WIDTH - 1; i >= 0; --i) {
    if (bits[i] === "1") {
      positions.push(WIDTH - 1 - i);
    }
  }
  return positions;
};

/** Software PEXT over bit strings (MSB first): pack the masked bits into the low end. */
const pext = (occupied: string, mask: string): string => {
  const packed: string[] = [];
  for (let i = WIDTH - 1; i >= 0; --i) {
    if (mask[i] === "1") {
      packed.unshift(occupied[i]);
    }
  }
  return packed.join("").padStart(WIDTH, "0");
};

type BitRowProps = {
  /** Name used to find this row's cells when drawing connectors. */
  row: string;
  bits: string;
  /** Maps a cell to the board position it represents, or null if none. */
  positionOf: (cell: number) => number | null;
  hovered: number | null;
  setHovered: (position: number | null) => void;
  /** Background for set bits. Defaults to the highlight color. */
  fill?: string;
  /** Positions set in this mask are underlined as the relevant bits. */
  relevant?: string;
  /** Only the lowest `keepLow` bits are drawn at full strength. */
  keepLow?: number;
};

const BitRow = ({
  row,
  bits,
  positionOf,
  hovered,
  setHovered,
  fill = "var(--r-link-color)",
  relevant,
  keepLow = WIDTH,
}: BitRowProps) => (
  <code>
    {bits.split("").map((bit, i) => {
      const position = WIDTH - 1 - i;
      const discarded = position >= keepLow;
      const lit = bit === "1" && !discarded;
      const isRelevant = relevant?.[i] === "1";
      const boardPosition = positionOf(position);
      const hot = boardPosition !== null && boardPosition === hovered;

      return (
        <span key={i}>
          <span
            data-row={row}
            data-bit={position}
            onMouseEnter={() => setHovered(boardPosition)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "inline-block",
              width: "1ch",
              textAlign: "center",
              cursor: boardPosition !== null ? "pointer" : "default",
              backgroundColor: hot ? "white" : lit ? fill : "transparent",
              color: hot || lit ? "black" : "inherit",
              opacity: discarded && !hot ? 0.35 : 1,
              // Mark relevant positions along the top edge, where the tick
              // from the mask row arrives.
              boxShadow: isRelevant
                ? "inset 0 3px 0 var(--board-piece-color)"
                : "none",
            }}
          >
            {bit}
          </span>
          {position % 8 === 0 && position !== 0 && " "}
        </span>
      );
    })}
  </code>
);

type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** "select" ticks join mask to occupied; "one"/"zero" arrows carry a value. */
  kind: "select" | "one" | "zero";
  /** Board position of the selected bit this connector belongs to. */
  position: number;
};

export const PextExample = ({
  mask,
  occupied,
  maskOnly = false,
}: PextExampleProps) => {
  const m = strip(mask);
  const o = strip(occupied);
  const result = pext(o, m);
  const positions = setPositions(m);
  const packed = result.slice(WIDTH - positions.length);
  const index = parseInt(packed, 2);

  const ref = useRef<HTMLDivElement>(null);
  const markerId = useId();
  const [lines, setLines] = useState<Line[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);

  // Mask and occupied cells stand for their own board position. Result cells
  // stand for the selected position packed into them; the rest stand for none.
  const identity = (cell: number) => cell;
  const positionOfResult = (cell: number) =>
    cell < positions.length ? positions[cell] : null;
  const hoveredIsRelevant = hovered !== null && positions.includes(hovered);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const measure = () => {
      // Reveal scales the slide with a transform; measure in the container's
      // own (unscaled) coordinates so the overlay lines up with the cells.
      const root = el.getBoundingClientRect();
      const scale = root.width / el.offsetWidth || 1;
      const cell = (row: string, bit: number) => {
        const c = el.querySelector(`[data-row="${row}"][data-bit="${bit}"]`);
        if (!c) {
          return null;
        }
        const r = c.getBoundingClientRect();
        return {
          x: (r.left + r.width / 2 - root.left) / scale,
          top: (r.top - root.top) / scale,
          bottom: (r.bottom - root.top) / scale,
        };
      };

      const next: Line[] = [];
      if (maskOnly) {
        setLines(next);
        return;
      }
      positions.forEach((position, k) => {
        const src = cell("occupied", position);
        const msk = cell("mask", position);
        const dst = cell("result", k);
        if (msk && src) {
          next.push({
            x1: msk.x,
            y1: msk.bottom,
            x2: src.x,
            y2: src.top,
            kind: "select",
            position,
          });
        }
        if (src && dst) {
          next.push({
            x1: src.x,
            y1: src.bottom,
            x2: dst.x,
            y2: dst.top,
            kind: o[WIDTH - 1 - position] === "1" ? "one" : "zero",
            position,
          });
        }
      });
      setLines(next);
    };

    measure();
    // Fonts and Reveal's layout can settle after mount.
    const timer = window.setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [m, o, maskOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const stroke = "var(--board-piece-color)";
  const colors: Record<Line["kind"], string> = {
    select: stroke,
    one: "var(--r-link-color)",
    zero: "rgba(255, 255, 255, 0.35)",
  };
  const hidden = maskOnly ? { visibility: "hidden" as const } : undefined;

  return (
    <>
      <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
        <table className="multiplication wide pext-diagram">
          <tbody>
            <tr>
              <td className="op">mask</td>
              <td>
                <BitRow
                  row="mask"
                  bits={m}
                  fill={stroke}
                  positionOf={identity}
                  hovered={hovered}
                  setHovered={setHovered}
                />
              </td>
            </tr>
            <tr style={hidden}>
              <td className="op">occupied</td>
              <td>
                <BitRow
                  row="occupied"
                  bits={o}
                  relevant={m}
                  positionOf={identity}
                  hovered={hovered}
                  setHovered={setHovered}
                />
              </td>
            </tr>
            <tr style={hidden}>
              <td className="op">pext</td>
              <td>
                <BitRow
                  row="result"
                  bits={result}
                  keepLow={positions.length}
                  positionOf={positionOfResult}
                  hovered={hovered}
                  setHovered={setHovered}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <svg
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            {(["one", "zero", "hot"] as const).map((kind) => (
              <marker
                key={kind}
                id={`${markerId}-${kind}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill={kind === "hot" ? "white" : colors[kind]}
                />
              </marker>
            ))}
          </defs>
          {lines.map((line, i) => {
            // Leave and arrive vertically so the fan of connectors stays
            // readable at both ends and only crosses in the middle.
            const ym = (line.y1 + line.y2) / 2;
            const d = `M ${line.x1} ${line.y1} C ${line.x1} ${ym}, ${line.x2} ${ym}, ${line.x2} ${line.y2}`;
            const hot = hovered !== null && line.position === hovered;
            const dimmed = hoveredIsRelevant && !hot;
            const marker =
              line.kind === "select"
                ? undefined
                : `url(#${markerId}-${hot ? "hot" : line.kind})`;
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke={hot ? "white" : colors[line.kind]}
                  strokeWidth={hot ? 2.4 : 1.2}
                  opacity={dimmed ? 0.2 : 1}
                  markerEnd={marker}
                />
                {/* Wide invisible copy so the thin line is easy to hover. */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12}
                  style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onMouseEnter={() => setHovered(line.position)}
                  onMouseLeave={() => setHovered(null)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <p style={{ margin: "0.4em 0 0", ...hidden }}>
        index = <code>0b{packed}</code> = {index}
      </p>
    </>
  );
};
