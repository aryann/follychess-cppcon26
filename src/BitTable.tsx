import { Fragment } from "@revealjs/react";
import type { ReactNode } from "react";

/** Operand width for the 8-bit worked examples. */
export const WIDTH = 8;
/** Columns drawn per row, wide enough to show bits that fall off the top. */
export const COLUMNS = 16;

type BitsProps = {
  value: number;
  /** Bits below this position are dimmed: they are discarded. */
  keepFrom?: number;
  /** Bits at or above this position are dimmed: they are discarded. */
  keepBelow?: number;
  /** Positions set in this mask are underlined as the relevant bits. */
  relevant?: number;
  /** Background for set bits. Defaults to the highlight color. */
  fill?: string;
  /** Columns to draw; defaults to COLUMNS, wide enough to show overflow. */
  columns?: number;
};

/**
 * Draws a binary number right-aligned in a fixed number of columns. Bits at or
 * above WIDTH are drawn struck through and dimmed: they fall off the top.
 */
export const Bits = ({
  value,
  keepFrom = 0,
  keepBelow = Infinity,
  relevant = 0,
  fill = "var(--r-link-color)",
  columns = COLUMNS,
}: BitsProps) => {
  const digits = value.toString(2).padStart(WIDTH, "0").padStart(columns, " ");

  return (
    <code>
      {digits.split("").map((ch, i) => {
        const position = columns - 1 - i;
        const blank = ch === " ";
        const overflow = !blank && position >= WIDTH;
        const discarded =
          !blank && (position < keepFrom || position >= keepBelow);
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
              textDecoration: overflow || discarded ? "line-through" : "none",
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
export const Row = ({
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
export const Cells = ({
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
