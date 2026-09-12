import { BitString } from "./BitString";

type ExampleInputsProps = {
  mask: number;
  /** Omit on slides that only have a mask so far. */
  magic?: number;
};

const WIDTH = 8;

/** The givens shared by the 8-bit example slides: the mask, and the magic once there is one. */
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
    {magic !== undefined && (
      <div>
        <span style={{ opacity: 0.7 }}>magic = </span>
        <BitString value={magic} width={WIDTH} />
      </div>
    )}
  </div>
);
