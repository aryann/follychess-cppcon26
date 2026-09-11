import { BitString } from "./BitString";
import { Bits, Cells, COLUMNS } from "./BitTable";
import { SetMapping } from "./SetMapping";

type MagicMappingProps = {
  /** 8-bit mask of relevant bits. */
  mask: number;
  /** 8-bit magic number. */
  magic: number;
  /** Expand the product into one shifted copy of the occupancy per set bit. */
  showTerms?: boolean;
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
  showTerms = false,
}: {
  occupancy: number;
  magic: number;
  bits: number;
  showTerms?: boolean;
}) => {
  const product = (occupancy * magic) & ((1 << WIDTH) - 1);
  const shift = WIDTH - bits;
  const index = product >> shift;
  // With terms shown, rows are wide enough to draw bits that fall off the top.
  const columns = showTerms ? COLUMNS : WIDTH;
  const shifts = setBitPositions(magic);
  const fullSum = shifts.reduce((acc, k) => acc + (occupancy << k), 0);
  const copiesPerColumn = Array.from(
    { length: columns },
    (_, c) => shifts.filter((k) => ((occupancy << k) >> c) & 1).length,
  );

  return (
    <table className="multiplication">
      <tbody>
        <tr>
          <Cells
            bits={<Bits value={occupancy} columns={columns} />}
            label="occupied & mask"
          />
        </tr>
        <tr>
          <Cells
            op="×"
            bits={<Bits value={magic} columns={columns} />}
            label="magic"
          />
        </tr>
        {showTerms &&
          shifts.map((k, i) => (
            <tr key={k} className={i === 0 ? "rule" : undefined}>
              <Cells
                op={i === 0 ? "=" : "+"}
                bits={<Bits value={occupancy << k} columns={columns} />}
                label={`occupied & mask << ${k}`}
              />
            </tr>
          ))}
        <tr className="rule">
          <Cells
            bits={
              <Bits value={showTerms ? fullSum : product} columns={columns} />
            }
            label="product"
          />
        </tr>
        {showTerms && (
          <tr>
            <Cells
              bits={
                <code>
                  {copiesPerColumn
                    .map((count, c) => ({ count, c }))
                    .reverse()
                    .map(({ count, c }) => {
                      const kept = c >= shift && c < WIDTH;
                      const overflow = c >= WIDTH;
                      return (
                        <span
                          key={c}
                          style={{
                            display: "inline-block",
                            width: "1ch",
                            textAlign: "center",
                            color: kept ? "var(--r-link-color)" : "inherit",
                            fontWeight: kept ? "bold" : "normal",
                            opacity: kept ? 1 : 0.35,
                            textDecoration: overflow ? "line-through" : "none",
                          }}
                        >
                          {count}
                        </span>
                      );
                    })}
                </code>
              }
              label="copies per column"
            />
          </tr>
        )}
        <tr>
          <Cells
            op={`>> (${WIDTH} − ${bits})`}
            bits={<Bits value={product} keepFrom={shift} columns={columns} />}
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
export const MagicMapping = ({
  mask,
  magic,
  showTerms = false,
}: MagicMappingProps) => {
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
    .map(([index]) => index)
    .sort((a, b) => a - b);

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
            <StepPanel
              occupancy={occupancy}
              magic={magic}
              bits={bits}
              showTerms={showTerms}
            />
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
                Collision on {collisions.length === 1 ? "index" : "indices"}{" "}
                {collisions.join(", ")}.
              </p>
              <p style={{ margin: "0 0 0.4em" }}>
                {collisions.length === 1
                  ? "Two occupancies would share the same slot."
                  : "Several occupancies would share the same slots."}
              </p>
              <p style={{ margin: "0 0 0.4em" }}>
                Discard this magic and generate a new one.
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
