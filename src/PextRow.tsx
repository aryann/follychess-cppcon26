import { Fragment } from "@revealjs/react";

type PextRowProps = {
  description: string;
  input: string;
  mask: string;
  result: string;
};

const highlightColor = "var(--r-link-color)";

export const PextRow = ({ description, input, mask, result }: PextRowProps) => {
  const maskBitsArray = mask.split("");
  const numSelected = maskBitsArray.filter((b) => b === "1").length;

  const inputBits = input.split("").map((bit, i) => (
    <span
      key={i}
      style={{
        color: maskBitsArray[i] === "1" ? highlightColor : "inherit",
        fontWeight: maskBitsArray[i] === "1" ? "bold" : "normal",
      }}
    >
      {bit}
    </span>
  ));

  const maskBitsEl = maskBitsArray.map((bit, i) => (
    <span
      key={i}
      style={{
        color: bit === "1" ? highlightColor : "inherit",
        fontWeight: bit === "1" ? "bold" : "normal",
      }}
    >
      {bit}
    </span>
  ));

  const resultBits = result.split("").map((bit, i) => {
    const isExtracted = i >= 8 - numSelected;
    return (
      <span
        key={i}
        style={{
          color: isExtracted ? highlightColor : "inherit",
          fontWeight: isExtracted ? "bold" : "normal",
          opacity: isExtracted ? 1 : 0.5,
        }}
      >
        {bit}
      </span>
    );
  });

  return (
    <Fragment as="tr">
      <td>
        <em>{description}</em>
      </td>
      <td>
        <code>{inputBits}</code>
      </td>
      <td>
        <code>{maskBitsEl}</code>
      </td>
      <td>
        <code>{resultBits}</code>
      </td>
    </Fragment>
  );
};
