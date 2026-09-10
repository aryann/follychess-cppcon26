import { Fragment } from "@revealjs/react";
import type { ReactNode } from "react";

type LongMultiplicationProps = {
  /** 8-bit occupancy, including bits outside the mask. */
  occupied: number;
  /** 8-bit mask of relevant bits. */
  mask: number;
  /** 8-bit magic number. */
  magic: number;
  /** Number of index bits kept from the top of the 8-bit product. */
  bits: number;
};

/** Operand width; the product wraps at this width like the 64-bit version. */
const WIDTH = 8;
/** Columns drawn per row, wide enough to show bits that fall off the top. */
const COLUMNS = 16;

const setBitPositions = (value: number): number[] => {
  const positions: number[] = [];
  for (let i = 0; i < WIDTH; ++i) {
    if (value & (1 << i)) {
      positions.push(i);
    }
  }
  return positions;
};

type BitsProps = {
  value: number;
  /** Bits below this position are dimmed: the final shift discards them. */
  keepFrom?: number;
  /** Positions set in this mask are underlined as the relevant bits. */
  relevant?: number;
  /** Background for set bits. Defaults to the highlight color. */
  fill?: string;
};

/**
 * Draws a binary number right-aligned in a fixed number of columns. Bits at or
 * above WIDTH are drawn struck through and dimmed: they fall off the top.
 */
const Bits = ({
  value,
  keepFrom = 0,
  relevant = 0,
  fill = "var(--r-link-color)",
}: BitsProps) => {
  const digits = value.toString(2).padStart(WIDTH, "0").padStart(COLUMNS, " ");

  return (
    <code>
      {digits.split("").map((ch, i) => {
        const position = COLUMNS - 1 - i;
        const blank = ch === " ";
        const overflow = !blank && position >= WIDTH;
        const discarded = !blank && position < keepFrom;
        const isOne = ch === "1";
        const lit = isOne && !overflow && !discarded;
        const isRelevant = !blank && (relevant & (1 << position)) !== 0;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: "1ch",
              textAlign: "center",
              backgroundColor: lit ? fill : "transparent",
              color: lit ? "black" : "inherit",
              opacity: overflow || discarded ? 0.35 : 1,
              textDecoration: overflow ? "line-through" : "none",
              boxShadow: isRelevant
                ? "inset 0 -3px 0 var(--board-piece-color)"
                : "none",
            }}
          >
            {blank ? " " : ch}
          </span>
        );
      })}
    </code>
  );
};

/**
 * A table row revealed by clicking. Explicit fragment indices keep the rows
 * in order regardless of where they sit in the table.
 */
const Row = ({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) => (
  <Fragment as="tr" index={index} className={className}>
    {children}
  </Fragment>
);

/** The three cells of a row: operator, bits, and label. */
const Cells = ({
  op,
  bits,
  label,
}: {
  op?: string;
  bits: ReactNode;
  label: ReactNode;
}) => (
  <>
    <td className="op">{op}</td>
    <td>{bits}</td>
    <td className="label">{label}</td>
  </>
);

export const LongMultiplication = ({
  occupied,
  mask,
  magic,
  bits,
}: LongMultiplicationProps) => {
  const masked = occupied & mask;
  const shifts = setBitPositions(magic);
  const copies = shifts.map((shift) => {
    const full = masked << shift;
    const kept = full & ((1 << WIDTH) - 1);
    return { shift, full, kept };
  });

  const sum = copies.reduce((acc, copy) => acc + copy.kept, 0);
  const product = sum & ((1 << WIDTH) - 1);
  const carryOut = sum !== product;
  const index = product >> (WIDTH - bits);

  const magicTerms = shifts
    .slice()
    .reverse()
    .map((shift, i) => (
      <span key={shift}>
        {i > 0 && " + "}2<sup>{shift}</sup>
      </span>
    ));

  return (
    <table className="multiplication">
      <tbody>
        <tr>
          <Cells
            bits={<Bits value={occupied} relevant={mask} />}
            label="occupied"
          />
        </tr>
        <tr>
          <Cells
            op="&"
            bits={<Bits value={mask} fill="var(--board-piece-color)" />}
            label="mask (relevant squares)"
          />
        </tr>

        <Row index={0} className="rule">
          <Cells bits={<Bits value={masked} />} label="occupied & mask" />
        </Row>
        <Row index={1}>
          <Cells
            op="×"
            bits={<Bits value={magic} />}
            label={<>magic = {magicTerms}</>}
          />
        </Row>

        {copies.map((copy, i) => (
          <Row key={copy.shift} index={i + 2} className={i === 0 ? "rule" : ""}>
            <Cells
              bits={<Bits value={copy.full} />}
              label={<>&lt;&lt; {copy.shift}</>}
            />
          </Row>
        ))}

        <Row index={copies.length + 2} className="rule">
          <Cells
            bits={<Bits value={sum} />}
            label={<>sum{carryOut && " (carry out is dropped)"}</>}
          />
        </Row>

        <Row index={copies.length + 3}>
          <Cells
            bits={<Bits value={product} keepFrom={WIDTH - bits} />}
            label={
              <>
                index = top {bits} bits ={" "}
                <code>{index.toString(2).padStart(bits, "0")}</code> = {index}
              </>
            }
          />
        </Row>
      </tbody>
    </table>
  );
};
