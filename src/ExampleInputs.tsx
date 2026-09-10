import { BitString } from "./BitString";

type ExampleInputsProps = {
  mask: number;
  magic: number;
};

const WIDTH = 8;

const powersOfTwo = (value: number) => {
  const terms = [];
  for (let i = WIDTH - 1; i >= 0; --i) {
    if (value & (1 << i)) {
      terms.push(i);
    }
  }
  return terms.map((exponent, i) => (
    <span key={exponent}>
      {i > 0 && " + "}2<sup>{exponent}</sup>
    </span>
  ));
};

/** The two givens shared by every 8-bit example slide. */
export const ExampleInputs = ({ mask, magic }: ExampleInputsProps) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: "2.5em",
      fontSize: "0.8em",
      margin: "0.2em 0 0.6em",
    }}
  >
    <div>
      <span style={{ opacity: 0.7 }}>mask = </span>
      <BitString value={mask} width={WIDTH} fill="var(--board-piece-color)" />
    </div>
    <div>
      <span style={{ opacity: 0.7 }}>magic = </span>
      <BitString value={magic} width={WIDTH} />
      <span style={{ opacity: 0.7 }}> = {powersOfTwo(magic)}</span>
    </div>
  </div>
);
