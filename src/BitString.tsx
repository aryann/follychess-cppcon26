type BitStringProps = {
  value: number;
  width: number;
  /** Background for set bits. Defaults to the highlight color. */
  fill?: string;
  /** Positions set in this mask are drawn at full strength; others dimmed. */
  relevant?: number;
  /**
   * "set" fills the cells holding a 1. "relevant" fills every relevant cell
   * regardless of its value, marking the positions rather than the bits.
   */
  highlight?: "set" | "relevant";
};

/** Draws a fixed-width binary number as a row of bit cells. */
export const BitString = ({
  value,
  width,
  fill = "var(--r-link-color)",
  relevant,
  highlight = "set",
}: BitStringProps) => (
  <code>
    {value
      .toString(2)
      .padStart(width, "0")
      .split("")
      .map((bit, i) => {
        const position = width - 1 - i;
        const isRelevant =
          relevant === undefined || (relevant & (1 << position)) !== 0;
        const lit =
          highlight === "relevant"
            ? relevant !== undefined && isRelevant
            : bit === "1" && isRelevant;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: "1ch",
              textAlign: "center",
              backgroundColor: lit ? fill : "transparent",
              color: lit ? "black" : "inherit",
              opacity: isRelevant ? 1 : 0.5,
            }}
          >
            {bit}
          </span>
        );
      })}
  </code>
);
