import { Bits, Cells, Row, WIDTH } from "./BitTable";

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

const setBitPositions = (value: number): number[] => {
  const positions: number[] = [];
  for (let i = 0; i < WIDTH; ++i) {
    if (value & (1 << i)) {
      positions.push(i);
    }
  }
  return positions;
};

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
                <code>0b{index.toString(2).padStart(bits, "0")}</code> = {index}
              </>
            }
          />
        </Row>
      </tbody>
    </table>
  );
};
