import { Fragment } from "@revealjs/react";
import { BitString } from "./BitString";

type SlotStripProps = {
  /** 8-bit mask of relevant bits; other bits are drawn dimmed. */
  mask: number;
  /** 8-bit masked occupancies, in the order they should drop into slots. */
  occupancies: number[];
  /** 8-bit magic number. */
  magic: number;
  /** Number of index bits; the strip has 2^bits slots. */
  bits: number;
};

const WIDTH = 8;

export const SlotStrip = ({
  mask,
  occupancies,
  magic,
  bits,
}: SlotStripProps) => {
  const slotCount = 1 << bits;
  const slots: { occupancy: number; order: number }[][] = Array.from(
    { length: slotCount },
    () => [],
  );

  occupancies.forEach((occupancy, order) => {
    const product = (occupancy * magic) & ((1 << WIDTH) - 1);
    slots[product >> (WIDTH - bits)].push({ occupancy, order });
  });

  return (
    <div style={{ fontSize: "0.55em", marginTop: "0.8em" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0.3em",
        }}
      >
        {slots.map((entries, slot) => (
          <div
            key={slot}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.3em",
              minWidth: "6.6em",
              minHeight: "5.5em",
              padding: "0.3em",
              border: "1px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            <code style={{ opacity: 0.5 }}>{slot}</code>

            {entries.map(({ occupancy, order }, i) => {
              const fill =
                i === 0 ? "var(--board-piece-color)" : "var(--collision-color)";

              return (
                <Fragment key={occupancy} index={order}>
                  <span style={{ fontSize: "1.2em" }}>
                    <BitString
                      value={occupancy}
                      width={WIDTH}
                      fill={fill}
                      relevant={mask}
                      highlight="relevant"
                    />
                  </span>
                </Fragment>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
