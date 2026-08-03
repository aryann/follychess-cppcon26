import React, { type ReactNode, useState, createContext, useContext } from "react";

export type BoardGroupContextType = {
  selected: number | null;
  setSelected: (val: number | null) => void;
  selectedRank: number | null;
  setSelectedRank: (val: number | null) => void;
  selectedFile: number | null;
  setSelectedFile: (val: number | null) => void;
};

export const BoardGroupContext = createContext<BoardGroupContextType | null>(null);

export const BoardGroup = ({ children, style, className }: { children: ReactNode, style?: React.CSSProperties, className?: string }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);

  return (
    <BoardGroupContext.Provider
      value={{
        selected,
        setSelected,
        selectedRank,
        setSelectedRank,
        selectedFile,
        setSelectedFile,
      }}
    >
      <div style={style} className={className}>
        {children}
      </div>
    </BoardGroupContext.Provider>
  );
};

const CodeBlock = (props: { children: ReactNode }) => (
  <code>
    <pre style={{ marginLeft: 0, marginRight: 0 }}>{props.children}</pre>
  </code>
);

type BoardProps = {
  children: string;
  showBits?: boolean;
  showLabels?: boolean;
  title?: string;
  footer?: string;
  highlight?: string;
};

const parseHighlight = (input?: string): Set<number> => {
  if (!input) {
    return new Set();
  }

  const squares = input.split(",").map((s) => s.trim());
  const indices = new Set<number>();
  for (const square of squares) {
    const file = square.charCodeAt(0) - "a".charCodeAt(0);
    const rank = parseInt(square[1]);
    const row = 8 - rank;
    indices.add(row * 8 + file);
  }
  return indices;
};

const emptySquare = "·";

const parse = (input: string): string[] => {
  const result: string[] = [];
  for (const char of input) {
    if (char === ".") {
      result.push(emptySquare);
    } else if (/[A-Za-z]/.test(char)) {
      result.push(char);
    }

    if (result.length === 64) {
      break;
    }
  }

  return result;
};

export const Board = (props: BoardProps) => {
  const board = parse(props.children);
  const highlighted = parseHighlight(props.highlight);

  const context = useContext(BoardGroupContext);

  const [localSelected, setLocalSelected] = useState<number | null>(null);
  const [localSelectedRank, setLocalSelectedRank] = useState<number | null>(null);
  const [localSelectedFile, setLocalSelectedFile] = useState<number | null>(null);

  const selected = context ? context.selected : localSelected;
  const setSelected = context ? context.setSelected : setLocalSelected;
  const selectedRank = context ? context.selectedRank : localSelectedRank;
  const setSelectedRank = context ? context.setSelectedRank : setLocalSelectedRank;
  const selectedFile = context ? context.selectedFile : localSelectedFile;
  const setSelectedFile = context ? context.setSelectedFile : setLocalSelectedFile;

  const renderCell = (
    index: number,
    content: string | number,
    width?: number,
  ) => {
    const isHighlighted = highlighted.has(index);
    const isActive =
      index === selected ||
      Math.floor(index / 8) === selectedRank ||
      index % 8 === selectedFile;

    let bg = "transparent";
    if (isHighlighted) {
      bg = "var(--r-link-color)";
    }
    if (isActive) {
      bg = "white";
    }

    const fg = isActive || isHighlighted ? "black" : "inherit";

    return (
      <span
        style={{
          cursor: "pointer",
          display: "inline-block",
          backgroundColor: bg,
          color: fg,
          width: width ? `${width}px` : undefined,
          height: width ? `${width}px` : undefined,
          lineHeight: width ? `${width}px` : undefined,
          textAlign: "center",
        }}
        onMouseOver={() => setSelected(index)}
        onMouseLeave={() => setSelected(null)}
      >
        {content}
      </span>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {props.title && <CodeBlock>{props.title}</CodeBlock>}

        <CodeBlock>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "min-content repeat(8, 32px)",
            }}
          >
            {Array.from({ length: 8 }, (_, rank) => {
              const isActive = selectedRank == rank;

              return (
                <React.Fragment key={rank}>
                  <span
                    onMouseOver={() => setSelectedRank(rank)}
                    onMouseLeave={() => setSelectedRank(null)}
                    style={{
                      cursor: "pointer",
                      paddingRight: "8px",
                      textAlign: "right",
                      height: "32px",
                      lineHeight: "32px",
                      backgroundColor: isActive ? "white" : "transparent",
                      color: isActive ? "black" : "inherit",
                    }}
                  >
                    <span style={{ opacity: 0.5 }}>{8 - rank}</span>
                  </span>
                  {Array.from({ length: 8 }, (_, file) => {
                    const index = rank * 8 + file;
                    return (
                      <React.Fragment key={index}>
                        {renderCell(index, board[index], 32)}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}

            <span />
            {Array.from({ length: 8 }, (_, file) => {
              const isActive = selectedFile == file;

              return (
                <span
                  key={file}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    height: "32px",
                    lineHeight: "32px",
                    backgroundColor: isActive ? "white" : "transparent",
                    color: isActive ? "black" : "inherit",
                  }}
                  onMouseOver={() => setSelectedFile(file)}
                  onMouseLeave={() => setSelectedFile(null)}
                >
                  <span style={{ opacity: 0.5 }}>
                    {String.fromCharCode("a".charCodeAt(0) + file)}
                  </span>
                </span>
              );
            })}
          </div>
        </CodeBlock>
      </div>

      {props.showBits && (
        <CodeBlock>
          {board.toReversed().map((char, reversedIndex) => {
            const originalIndex = 64 - reversedIndex - 1;

            return (
              <React.Fragment key={`bit-${originalIndex}`}>
                {renderCell(
                  originalIndex,
                  char === emptySquare ? 0 : props.showLabels ? char : 1,
                )}
                {originalIndex % 8 === 0 && originalIndex !== 0 && " "}
              </React.Fragment>
            );
          })}
        </CodeBlock>
      )}

      {props.footer && <CodeBlock>{props.footer}</CodeBlock>}
    </div>
  );
};

type IntegerProps = {
  children: string;
};

export const Integer = (props: IntegerProps) => {
  const parse = (input: string): string[] => {
    const result: string[] = [];
    for (const char of input) {
      if (char !== " ") {
        result.push(char);
      }
    }

    return result;
  };

  const bits = parse(props.children);

  const context = useContext(BoardGroupContext);

  const [localSelected, setLocalSelected] = useState<number | null>(null);

  const selected = context ? context.selected : localSelected;
  const setSelected = context ? context.setSelected : setLocalSelected;

  const renderCell = (index: number, content: string) => {
    const isHighlighted = content != "0" && content != "_" && content != ".";
    const isActive = index === selected;

    let bg = "transparent";
    if (isHighlighted) {
      bg = "var(--r-link-color)";
    }
    if (isActive) {
      bg = "white";
    }

    const fg = isActive || isHighlighted ? "black" : "inherit";

    return (
      <span
        style={{
          cursor: "pointer",
          display: "inline-block",
          backgroundColor: bg,
          color: fg,
          textAlign: "center",
        }}
        onMouseOver={() => setSelected(index)}
        onMouseLeave={() => setSelected(null)}
      >
        {content}
      </span>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <CodeBlock>
        {bits.map((char, index) => {
          return (
            <React.Fragment key={`bit-${index}`}>
              {renderCell(index, char)}
              {index % 8 === 7 && index !== 63 && " "}
            </React.Fragment>
          );
        })}
      </CodeBlock>
    </div>
  );
};
