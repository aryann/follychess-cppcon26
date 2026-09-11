import { BitString } from "./BitString";
import { Bits, Cells } from "./BitTable";
import { SetMapping } from "./SetMapping";

type MagicMappingProps = {
  /** 8-bit mask of relevant bits. */
  mask: number;
  /** 8-bit magic number. */
  magic: number;
};

const WIDTH = 8;

const setBitPositions = (value: number): number[] => {
  const positions: number[] = [];
  for (let i = 0; i < WIDTH; ++i) {
    if (value & (1 << i)) {
      positions.push(i);
    }
  }
  return positions;
};

/** Every subset of the mask's bits, in ascending numeric order. */
const powerSet = (mask: number): number[] => {
  const positions = setBitPositions(mask);
  const subsets: number[] = [];
  for (let choice = 0; choice < 1 << positions.length; ++choice) {
    let value = 0;
    positions.forEach((position, i) => {
      if (choice & (1 << i)) {
        value |= 1 << position;
      }
    });
    subsets.push(value);
  }
  return subsets.sort((a, b) => a - b);
};

/** The multiply and shift for one occupancy, in the multiplication-table style. */
const StepPanel = ({
  occupancy,
  magic,
  bits,
}: {
  occupancy: number;
  magic: number;
  bits: number;
}) => {
  const product = (occupancy * magic) & ((1 << WIDTH) - 1);
  const shift = WIDTH - bits;
  const index = product >> shift;

  return (
    <table className="multiplication">
      <tbody>
        <tr>
          <Cells
            bits={<Bits value={occupancy} columns={WIDTH} />}
            label="occupied & mask"
          />
        </tr>
        <tr>
          <Cells
            op="×"
            bits={<Bits value={magic} columns={WIDTH} />}
            label="magic"
          />
        </tr>
        <tr className="rule">
          <Cells
            bits={<Bits value={product} columns={WIDTH} />}
            label="product"
          />
        </tr>
        <tr>
          <Cells
            op={`>> (${WIDTH} − ${bits})`}
            bits={<Bits value={product} keepFrom={shift} columns={WIDTH} />}
            label={<>index = {index}</>}
          />
        </tr>
      </tbody>
    </table>
  );
};

/**
 * The magic multiply-shift as a set mapping: every masked occupancy on the
 * left, every index on the right, one arrow per occupancy revealed per click,
 * with that occupancy's arithmetic shown beside the diagram. A final click
 * settles the last arrow.
 */
export const MagicMapping = ({ mask, magic }: MagicMappingProps) => {
  const bits = setBitPositions(mask).length;
  const occupancies = powerSet(mask);
  const indices = Array.from({ length: 1 << bits }, (_, i) => i);
  const pairs: [number, number][] = occupancies.map((occupancy, row) => [
    row,
    ((occupancy * magic) & ((1 << WIDTH) - 1)) >> (WIDTH - bits),
  ]);

  // Indices hit by more than one occupancy decide the verdict.
  const hits = new Map<number, number>();
  pairs.forEach(([, to]) => hits.set(to, (hits.get(to) ?? 0) + 1));
  const collisions = [...hits.entries()]
    .filter(([, count]) => count > 1)
    .map(([index]) => index);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "2.5em",
      }}
    >
      <SetMapping
        stepped
        leftLabel={
          <>
            masked
            <br />
            occupancies
          </>
        }
        rightLabel="indices"
        left={occupancies.map((occupancy) => (
          <BitString key={occupancy} value={occupancy} width={WIDTH} />
        ))}
        right={indices.map((index) => (
          <code key={index}>{index}</code>
        ))}
        pairs={pairs}
      />

      {/* One panel per step, shown only while that step's arrow is current.
          The final step settles the last arrow and shows the verdict. */}
      <div className="r-stack" style={{ fontSize: "1.35em" }}>
        {occupancies.map((occupancy, k) => (
          <div
            key={occupancy}
            className="fragment current-visible"
            data-fragment-index={k}
          >
            <StepPanel occupancy={occupancy} magic={magic} bits={bits} />
          </div>
        ))}

        <div
          className="fragment"
          data-fragment-index={occupancies.length}
          style={{ textAlign: "center", maxWidth: "16em" }}
        >
          {collisions.length > 0 ? (
            <>
              <p
                style={{ color: "var(--collision-color)", margin: "0 0 0.4em" }}
              >
                Collision on index {collisions.join(", ")}.
              </p>
              <p style={{ margin: "0 0 0.4em" }}>
                Two occupancies would share a table slot.
              </p>
              <p style={{ margin: "0 0 0.4em" }}>
                Discard this magic and draw another.
              </p>
            </>
          ) : (
            <>
              <p
                style={{
                  color: "var(--board-piece-color)",
                  margin: "0 0 0.4em",
                }}
              >
                Success!
              </p>
              <p style={{ margin: "0 0 0.4em" }}>
                Every occupancy has its own slot.
              </p>
              <p style={{ margin: "0 0 0.4em" }}>Keep this magic.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
