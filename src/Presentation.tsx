import { Code, Deck, Fragment, Slide, Stack } from "@revealjs/react";
import RevealHighlight from "reveal.js/plugin/highlight";
import "reveal.js/plugin/highlight/monokai.css";
import "reveal.js/reveal.css";
import "reveal.js/theme/night.css";
import title from "./assets/title.png";
import { Board, BoardGroup, Integer } from "./Board";
import { PextRow } from "./PextRow";
import "./Presentation.css";

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-evenly" }}>
    {children}
  </div>
);

const Mul = () => <span style={{ color: "var(--r-link-color)" }}>*</span>;

export const Presentation = () => {
  return (
    <Deck
      plugins={[RevealHighlight]}
      config={{
        navigationMode: "linear",
        width: 1400,
        height: 800,
        hash: true,
        slideNumber: true,
      }}
    >
      <Slide backgroundImage={title} backgroundSize="contain"></Slide>

      <Slide>
        <h2>From 20 Nanoseconds to One</h2>
        <p>
          Optimizing Bishop, Rook, and Queen
          <br />
          Move Generation in a <a href="https://follychess.com">Chess Engine</a>
        </p>
        <p>♗♖♕ &middot; ♝♜♛</p>

        <p>
          <a href="https://cppnow26.follychess.com">cppnow26.follychess.com</a>
        </p>
        <p>
          <a href="https://aryan.app">Aryan Naraghi</a>
        </p>
      </Slide>

      <Slide>
        <h2>Overview</h2>
        <ul>
          <Fragment>
            <li>
              This talk is about <a href="https://follychess.com">FollyChess</a>
              , my C++ chess engine.
            </li>
          </Fragment>
          <Fragment>
            <li>
              Chess programming is a large domain. We can't cover all of it.
            </li>
          </Fragment>
          <Fragment>
            <li>
              Instead, we'll review a tiny sliver: efficient bishop, rook, and
              queen move generation.
            </li>
          </Fragment>
          <Fragment>
            <li>
              But first, we'll cover my motivation and chess engine basics.
            </li>
          </Fragment>
        </ul>
      </Slide>

      <Slide>
        <h2>Part 1</h2>
        <h3>Motivation</h3>
      </Slide>

      <Slide>
        <h2>Why a Chess Engine?</h2>

        <Fragment>
          <p>There is no shortage of chess engines, so why write one?</p>
        </Fragment>

        <Fragment>
          <p>It's a great learning opportunity!</p>
        </Fragment>
      </Slide>

      <Slide>
        <h3>Learning Opportunities</h3>
        <dl>
          <Fragment>
            <dt>Performance</dt>
            <dd>
              Benchmarking, avoiding branches, templates, <code>consteval</code>
              /<code>constexpr</code>, and zero-cost abstractions.
            </dd>
          </Fragment>
          <Fragment>
            <dt>Search</dt>
            <dd>
              Alpha-beta pruning, iterative deepening, and transposition tables.
            </dd>
          </Fragment>
          <Fragment>
            <dt>Evaluation</dt>
            <dd>
              Translating qualitative chess concepts into numerical values.
            </dd>
          </Fragment>
          <Fragment>
            <dt>Verification</dt>
            <dd>Validating improvements through simulations.</dd>
          </Fragment>
        </dl>
      </Slide>

      <Slide>
        <h2>Part 2</h2>
        <h3>Data Structures</h3>
      </Slide>

      <Slide>
        <h3>Board</h3>

        <p>An 8 x 8 grid of squares</p>

        <Board>{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . . . . . .
4: . . . . . . . .
3: . . . . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
      </Slide>

      <Slide>
        <h3>Rank & File</h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
            gap: "1em",
          }}
        >
          <dl>
            <dt>Rank</dt>
            <dd>Rows, labeled 1-8</dd>

            <dt>File</dt>
            <dd>Columns, labeled A-H</dd>
          </dl>

          <Board>{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . . . . . .
4: . . . . . . . .
3: . . . . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
        </div>
      </Slide>

      <Slide>
        <h3>Square</h3>

        <p>An index (0-63) representing a rank and file intersection</p>

        <Code language="cpp" lineNumbers>{`enum Square : std::uint8_t {
 A8, B8, C8, D8, E8, F8, G8, H8,
 A7, B7, C7, D7, E7, F7, G7, H7,
 A6, B6, C6, D6, E6, F6, G6, H6,
 A5, B5, C5, D5, E5, F5, G5, H5,
 A4, B4, C4, D4, E4, F4, G4, H4,
 A3, B3, C3, D3, E3, F3, G3, H3,
 A2, B2, C2, D2, E2, F2, G2, H2,
 A1, B1, C1, D1, E1, F1, G1, H1,
};`}</Code>
      </Slide>

      <Stack>
        <Slide>
          <h3>Bitboard</h3>

          <p>An unsigned 64 bit integer representing piece presence</p>

          <Board highlight="d7,b5,e5,g5,d2" showBits>{`8: . . . . . . . .
7: . . . X . . . .
6: . . . . . . . .
5: . X . . X . X .
4: . . . . . . . .
3: . . . . . . . .
2: . . . X . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
        </Slide>

        <Slide>
          <h3>
            {" "}
            <a
              href="https://github.com/aryann/follychess/blob/main/engine/bitboard.h"
              target="_blank"
            >
              Bitboard
            </a>
          </h3>
          <Code language="cpp" lineNumbers="|19|3-4|6-8|10|12|14-16|">
            {`class [[nodiscard]] Bitboard {
 public:
  constexpr explicit Bitboard(std::uint64_t data) : data_(data) {}
  constexpr explicit Bitboard(Square square) : data_(1ULL << square) {}

  [[nodiscard]] constexpr bool Get(Square square) const {
    return (data_ & (1ULL << square)) != 0;
  }

  constexpr void Set(Square square) { data_ |= 1ULL << square; }

  constexpr void Clear(Square square) { data_ &= ~(1ULL << square); }

  constexpr Bitboard operator>>(int bits) const {
    return Bitboard(data_ >> bits);
  }

 private:
  std::uint64_t data_;
};
`}
          </Code>
        </Slide>

        <Slide>
          <h3>Bitboard</h3>
          <Code
            language="cpp"
            lineNumbers="1|3-12|14-15|17-18|20-21|"
          >{`Bitboard board(D5);

EXPECT_THAT(board,
            EqualsBitboard("8: . . . . . . . ."
                           "7: . . . . . . . ."
                           "6: . . . . . . . ."
                           "5: . . . X . . . ."
                           "4: . . . . . . . ."
                           "3: . . . . . . . ."
                           "2: . . . . . . . ."
                           "1: . . . . . . . ."
                           "   a b c d e f g h"));

EXPECT_THAT(board.Get(D5), IsTrue());
EXPECT_THAT(board.Get(B1), IsFalse());

board.Set(B1);
EXPECT_THAT(board.Get(B1), IsTrue());

board.Clear(B1);
EXPECT_THAT(board.Get(B1), IsFalse());
`}</Code>
        </Slide>
      </Stack>

      <Slide>
        <h3>Piece</h3>

        <Code language="cpp" lineNumbers>
          {`enum Piece : std::uint8_t {
  kPawn,
  kKnight,
  kBishop,
  kRook,
  kQueen,
  kKing,
  kEmptyPiece,
};

constexpr std::size_t kNumPieces = 6;`}
        </Code>
      </Slide>

      <Slide>
        <h3>Side</h3>

        <Code language="cpp" lineNumbers>
          {`enum Side : std::uint8_t {
  kWhite,
  kBlack,
  kEmptySide,
};

constexpr std::size_t kNumSides = 2;`}
        </Code>
      </Slide>

      <Stack>
        <Slide>
          <h3>Piece Arrangement</h3>

          <p>Convention for displaying pieces using text</p>

          <table>
            <thead>
              <tr>
                <th>Piece</th>
                <th>White</th>
                <th>Black</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Pawn</td>
                <td>
                  <code>P</code>
                </td>
                <td>
                  <code>p</code>
                </td>
              </tr>
              <tr>
                <td>Knight</td>
                <td>
                  <code>N</code>
                </td>
                <td>
                  <code>n</code>
                </td>
              </tr>
              <tr>
                <td>Bishop</td>
                <td>
                  <code>B</code>
                </td>
                <td>
                  <code>b</code>
                </td>
              </tr>
              <tr>
                <td>Rook</td>
                <td>
                  <code>R</code>
                </td>
                <td>
                  <code>r</code>
                </td>
              </tr>
              <tr>
                <td>Queen</td>
                <td>
                  <code>Q</code>
                </td>
                <td>
                  <code>q</code>
                </td>
              </tr>
              <tr>
                <td>King</td>
                <td>
                  <code>K</code>
                </td>
                <td>
                  <code>k</code>
                </td>
              </tr>
            </tbody>
          </table>
        </Slide>
        <Slide>
          <h3>Piece Arrangment Examples</h3>

          <Row>
            <Board title="Starting">{`8: r n b q k b n r
7: p p p p p p p p
6: . . . . . . . .
5: . . . . . . . .
4: . . . . . . . .
3: . . . . . . . .
2: P P P P P P P P
1: R N B Q K B N R
   a b c d e f g h
`}</Board>

            <Board title="Midgame example">{`8: . . k r . b n r
7: p . p . p p p p
6: p . P . . q . .
5: . . . P . . . .
4: . . . P . . . .
3: P Q N . . . . .
2: . P . . . P P P
1: R . B . K . . R
   a b c d e f g h
`}</Board>

            <Board title="Endgame example">{`8: . . . . . . . .
7: . . p . . . . .
6: . . . p . . . .
5: K P . . . . . r
4: . R . . . p P k
3: . . . . . . . .
2: . . . . P . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
          </Row>
        </Slide>
      </Stack>

      <Stack>
        <Slide>
          <h3>Position</h3>
          <p>The state of the game at a specific moment:</p>
          <ul>
            <Fragment>
              <li>Arrangement of pieces on the board</li>
            </Fragment>
            <Fragment>
              <li>Castling rights</li>
            </Fragment>
            <Fragment>
              <li>Move counters</li>
            </Fragment>
            <Fragment>
              <li>En-Passant target square</li>
            </Fragment>
            <Fragment>
              <li>Side to move</li>
            </Fragment>
          </ul>
        </Slide>

        <Slide>
          <h3>Position</h3>
          <p>Getting pieces</p>

          <Code language="cpp" lineNumbers="|1-12|14-25|27-38">{`EXPECT_THAT(
  starting_position.GetPieces(kPawn),
  EqualsBitboard(
    "8: . . . . . . . ."
    "7: X X X X X X X X"
    "6: . . . . . . . ."
    "5: . . . . . . . ."
    "4: . . . . . . . ."
    "3: . . . . . . . ."
    "2: X X X X X X X X"
    "1: . . . . . . . ."
    "   a b c d e f g h"));
    
EXPECT_THAT(
  starting_position.GetPieces(kWhite),
  EqualsBitboard(
    "8: . . . . . . . ."
    "7: . . . . . . . ."
    "6: . . . . . . . ."
    "5: . . . . . . . ."
    "4: . . . . . . . ."
    "3: . . . . . . . ."
    "2: X X X X X X X X"
    "1: X X X X X X X X"
    "   a b c d e f g h"));
    
EXPECT_THAT(
  starting_position.GetPieces(kWhite, kPawn), 
  EqualsBitboard(
    "8: . . . . . . . ."
    "7: . . . . . . . ."
    "6: . . . . . . . ."
    "5: . . . . . . . ."
    "4: . . . . . . . ."
    "3: . . . . . . . ."
    "2: X X X X X X X X"
    "1: . . . . . . . ."
    "   a b c d e f g h"));
    `}</Code>
        </Slide>

        <Slide>
          <h3>Position</h3>
          <Row>
            <Code language="cpp" lineNumbers="|5-6|">
              {`class Position {
 // ...

 private:
  std::array<Bitboard, kNumPieces> pieces_;
  std::array<Bitboard, kNumSides> sides_;

  Side side_to_move_;
  CastlingRights castling_rights_;

  std::optional<Square> en_passant_target_;

  std::uint8_t half_moves_;
  int full_moves_;
};
          `}
            </Code>

            <Code language="cpp" lineNumbers>
              {`enum Piece : std::uint8_t {
  kPawn,
  kKnight,
  kBishop,
  kRook,
  kQueen,
  kKing,
  kEmptyPiece,
};

constexpr std::size_t kNumPieces = 6;

enum Side : std::uint8_t {
  kWhite,
  kBlack,
  kEmptySide,
};

constexpr std::size_t kNumSides = 2;`}
            </Code>
          </Row>
        </Slide>

        <Slide>
          <h3>Position</h3>

          <Code language="cpp" lineNumbers="1-3|5-8|9-11|13-16|">
            {`Bitboard Position::GetPieces(Side side) const {
  return sides_[side];
}

Bitboard Position::GetPieces(Piece type) const {
  return pieces_[type];
}

Bitboard Position::GetPieces() const {
  return sides_[kWhite] | sides_[kBlack];
}

Bitboard Position::GetPieces(Side side, Piece type) const {
  return sides_[side] & pieces_[type];
}`}
          </Code>
        </Slide>
      </Stack>

      <Slide>
        <h2>Part 3</h2>
        <h3>Intro to Move Generation</h3>
      </Slide>

      <Stack>
        <Slide>
          <h3>Shifting Bitboards</h3>

          <p>North example</p>

          <div className="r-stack">
            <Fragment className="fade-out" index={0}>
              <Board
                title="input"
                highlight="d7,b5,e5,h5,d2"
                showBits
              >{`8: . . . . . . . .
7: . . . X . . . .
6: . . . . . . . .
5: . X . . X . . X
4: . . . . . . . .
3: . . . . . . . .
2: . . . X . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Fragment>

            <Fragment className="current-visible" index={0}>
              <Board
                title="input.Shift<kNorth>()"
                highlight="d8,b6,e6,h6,d3"
                showBits
              >{`8: . . . X . . . .
7: . . . . . . . .
6: . X . . X . . X
5: . . . . . . . .
4: . . . . . . . .
3: . . . X . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Fragment>
          </div>
        </Slide>

        <Slide>
          <h3>Shifting Bitboards</h3>

          <p>Northeast example</p>

          <div className="r-stack">
            <Fragment className="fade-out" index={0}>
              <Board
                title="input"
                highlight="d7,b5,e5,d2"
                showBits
              >{`8: . . . . . . . .
7: . . . X . . . .
6: . . . . . . . .
5: . X . . X . . X
4: . . . . . . . .
3: . . . . . . . .
2: . . . X . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Fragment>

            <Fragment className="current-visible" index={0}>
              <Board
                title="input.Shift<kNorthEast>()"
                highlight="e8,c6,f6,e3"
                showBits
              >{`8: . . . . X . . .
7: . . . . . . . .
6: . . X . . X . .
5: . . . . . . . .
4: . . . . . . . .
3: . . . . X . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Fragment>
          </div>
        </Slide>

        <Slide>
          <h3>Shifting Bitboards</h3>
          <Code language="cpp" lineNumbers="|4|6|8|10|12|14|16|18|">
            {`template <Direction Direction>
constexpr Bitboard Bitboard::Shift() const {

  if constexpr (Direction == kNorth)     { return *this >> 8; }

  if constexpr (Direction == kNorthEast) { return *this >> 7 & ~file::kA; }

  if constexpr (Direction == kEast)      { return *this << 1 & ~file::kA; }

  if constexpr (Direction == kSouthEast) { return *this << 9 & ~file::kA; }

  if constexpr (Direction == kSouth)     { return *this << 8; }

  if constexpr (Direction == kSouthWest) { return *this << 7 & ~file::kH; }

  if constexpr (Direction == kWest)      { return *this >> 1 & ~file::kH; }

  if constexpr (Direction == kNorthWest) { return *this >> 9 & ~file::kH; }

  return kEmptyBoard;
}
`}
          </Code>
        </Slide>
      </Stack>

      <Stack>
        <Slide>
          <h3>Knight Moves</h3>
          <p>Starting position, B1 knight</p>
          <Board highlight="b1,a3,c3">{`8: r n b q k b n r
7: p p p p p p p p
6: . . . . . . . .
5: . . . . . . . .
4: . . . . . . . .
3: . . . . . . . .
2: P P P P P P P P
1: R N B Q K B N R
   a b c d e f g h
`}</Board>
        </Slide>

        <Slide>
          <h3>Knight Moves</h3>
          <p>Starting position, B1 knight</p>
          <Code language="c++" lineNumbers>
            {`Bitboard pseudo_attacks = GetKnightAttacks(B1);
Bitboard valid_destinations = ~position.GetPieces(kWhite);
Bitboard moves = pseudo_attacks & valid_destinations;`}
          </Code>

          <BoardGroup>
            <Row>
              <Board title="position" highlight="b1,a3,c3">{`8: r n b q k b n r
7: p p p p p p p p
6: . . . . . . . .
5: . . . . . . . .
4: . . . . . . . .
3: . . . . . . . .
2: P P P P P P P P
1: R N B Q K B N R
   a b c d e f g h
`}</Board>

              <Board
                title="pseudo_attacks"
                highlight="a3,c3,d2"
              >{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . . . . . .
4: . . . . . . . .
3: X . X . . . . .
2: . . . X . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

              <Board
                title="valid_destinations"
                highlight="a8,b8,c8,d8,e8,f8,g8,h8,a7,b7,c7,d7,e7,f7,g7,h7,a6,b6,c6,d6,e6,f6,g6,h6,a5,b5,c5,d5,e5,f5,g5,h5,a4,b4,c4,d4,e4,f4,g4,h4,a3,b3,c3,d3,e3,f3,g3,h3"
              >{`8: X X X X X X X X
7: X X X X X X X X
6: X X X X X X X X
5: X X X X X X X X
4: X X X X X X X X
3: X X X X X X X X
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

              <Board title="moves" highlight="a3,c3">{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . . . . . .
4: . . . . . . . .
3: X . X . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Row>
          </BoardGroup>
        </Slide>

        <Slide>
          <h3>Knight Moves</h3>
          <p>Midgame position, F6 knight</p>
          <Board highlight="f6,d5,e4,g4,h5,g8">{`8: r . . . k . . r
7: P p p p . p p p
6: . b . . . n b N
5: n P . . . . . .
4: B B P . P . . .
3: q . . . . N . .
2: P p . P . . P P
1: R . . Q . R K .
   a b c d e f g h
`}</Board>
        </Slide>

        <Slide>
          <h3>Knight Moves</h3>
          <p>Midgame position, F6 knight</p>
          <Code language="c++" lineNumbers>
            {`Bitboard pseudo_attacks = GetKnightAttacks(F6);
Bitboard valid_destinations = ~position.GetPieces(kBlack);
Bitboard moves = pseudo_attacks & valid_destinations;`}
          </Code>

          <BoardGroup>
            <Row>
              <Board
                title="position"
                highlight="f6,d5,e4,g4,h5,g8"
              >{`8: r . . . k . . r
7: P p p p . p p p
6: . b . . . n b N
5: n P . . . . . .
4: B B P . P . . .
3: q . . . . N . .
2: P p . P . . P P
1: R . . Q . R K .
   a b c d e f g h
`}</Board>

              <Board
                title="pseudo_attacks"
                highlight="d5,d7,e8,e4,g4,h5,h7,g8"
              >{`8: . . . . X . X .
7: . . . X . . . X
6: . . . . . . . .
5: . . . X . . . X
4: . . . . X . X .
3: . . . . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

              <Board
                title="valid_destinations"
                highlight="b8,c8,d8,f8,g8,a7,e7,a6,c6,d6,e6,h6,b5,c5,d5,e5,f5,g5,h5,a4,b4,c4,d4,e4,f4,g4,h4,b3,c3,d3,e3,f3,g3,h3,a2,c2,d2,e2,f2,g2,h2,a1,b1,c1,d1,e1,f1,g1,h1"
              >{`8: . X X X . X X .
7: X . . . X . . .
6: X . X X X . . X
5: . X X X X X X X
4: X X X X X X X X
3: . X X X X X X X
2: X . X X X X X X
1: X X X X X X X X
   a b c d e f g h
`}</Board>

              <Board
                title="moves"
                highlight="d5,e4,g4,h5,g8"
              >{`8: . . . . . . X .
7: . . . . . . . .
6: . . . . . . . .
5: . . . X . . . X
4: . . . . X . X .
3: . . . . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Row>
          </BoardGroup>
        </Slide>

        <Slide>
          <h3>Knight Moves</h3>
          <Code
            language="c++"
            lineNumbers="1-4|2|3|6-24|7|9|10|11|12|13|14|15|16|17|18|19|11-19|"
          >
            {`constexpr Bitboard GetKnightAttacks(Square square) {
  static const std::array<Bitboard, kNumSquares> kKnightAttacks = GenerateKnightAttacks();
  return kKnightAttacks[square];
}
         
consteval std::array<Bitboard, kNumSquares> GenerateKnightAttacks() {
 std::array<Bitboard, kNumSquares> attacks;

 for (int square = kFirstSquare; square < kNumSquares; ++square) {
   Bitboard start(static_cast<Square>(square));
   attacks[square] = kEmptyBoard                                  //
                     | start.Shift<kNorth>().Shift<kNorthEast>()  //
                     | start.Shift<kEast>().Shift<kNorthEast>()   //
                     | start.Shift<kEast>().Shift<kSouthEast>()   //
                     | start.Shift<kSouth>().Shift<kSouthEast>()  //
                     | start.Shift<kSouth>().Shift<kSouthWest>()  //
                     | start.Shift<kWest>().Shift<kSouthWest>()   //
                     | start.Shift<kWest>().Shift<kNorthWest>()   //
                     | start.Shift<kNorth>().Shift<kNorthWest>();
 }
 return attacks;
}
`}
          </Code>
        </Slide>
      </Stack>

      <Slide>
        <h3>Checks</h3>

        <p>Some moves place the king in check.</p>

        <Fragment>
          <p>These moves are filtered later.</p>
        </Fragment>
      </Slide>

      <Stack>
        <Slide>
          <h3>Sliding Piece Moves</h3>
          <p>
            Bishops, rooks, and queens are sliding pieces that move along rays.
          </p>

          <dl>
            <Fragment>
              <dt>Bishops</dt>
              <dd>4 rays along diagonals</dd>
            </Fragment>
            <Fragment>
              <dt>Rooks</dt>
              <dd>4 rays along ranks and files</dd>
            </Fragment>
            <Fragment>
              <dt>Queens</dt>
              <dd>8 rays along diagonals, ranks, and files</dd>
            </Fragment>
          </dl>
        </Slide>

        <Slide>
          <h3>Challenge</h3>
          <p>Sliding pieces can be blocked by other pieces.</p>

          <Fragment>
            <p>This makes their move generation more complex.</p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Algorithm</h3>
          <p>For each ray:</p>

          <ol>
            <Fragment>
              <li>
                Slide along the ray until a blocker is hit. Include the blocker.
              </li>
            </Fragment>
            <Fragment>
              <li>Filter the last square:</li>
            </Fragment>
            <ul>
              <Fragment>
                <li>If empty, include as quiet move</li>
              </Fragment>
              <Fragment>
                <li>If enemy, include as capturing move</li>
              </Fragment>
              <Fragment>
                <li>If friendly, exclude</li>
              </Fragment>
            </ul>
          </ol>
        </Slide>
      </Stack>

      <Stack>
        <Slide>
          <h3>Rook Moves</h3>
          <p>D5 rook with no blockers</p>

          <Board highlight="d5,d8,d7,d6,a5,b5,c5,e5,f5,g5,h5,d4,d3,d2,d1">{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . R . . . .
4: . . . . . . . .
3: . . . . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
        </Slide>

        <Slide>
          <h3>Rook Moves</h3>
          <p>D5 rook with no blockers</p>

          <Code language="cpp" lineNumbers>{`
Bitboard occupied = position.GetPieces();
Bitboard pseudo_moves = GenerateRookMoves(D5, occupied);
Bitboard friendly = position.GetPieces(kWhite);
Bitboard moves = pseudo_moves & ~friendly;
          `}</Code>

          <BoardGroup className="r-stack">
            <Fragment className="fade-out" index={0} style={{ width: "100%" }}>
              <Row>
                <Board
                  title="position"
                  highlight="d5,d8,d7,d6,a5,b5,c5,e5,f5,g5,h5,d4,d3,d2,d1"
                >{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . R . . . .
4: . . . . . . . .
3: . . . . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

                <Board title="occupied" highlight="d5">{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . X . . . .
4: . . . . . . . .
3: . . . . . . . .
2: . . . . . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

                <Board
                  title="pseudo_moves"
                  highlight="d8,d7,d6,a5,b5,c5,e5,f5,g5,h5,d4,d3,d2,d1"
                >{`8: . . . X . . . .
7: . . . X . . . .
6: . . . X . . . .
5: X X X . X X X X
4: . . . X . . . .
3: . . . X . . . .
2: . . . X . . . .
1: . . . X . . . .
   a b c d e f g h
`}</Board>
              </Row>
            </Fragment>

            <Fragment
              className="current-visibile"
              index={0}
              style={{ width: "100%" }}
            >
              <Row>
                <Board
                  title="pseudo_moves"
                  highlight="d8,d7,d6,a5,b5,c5,e5,f5,g5,h5,d4,d3,d2,d1"
                >{`8: . . . X . . . .
7: . . . X . . . .
6: . . . X . . . .
5: X X X . X X X X
4: . . . X . . . .
3: . . . X . . . .
2: . . . X . . . .
1: . . . X . . . .
   a b c d e f g h
`}</Board>

                <Board
                  title="~friendly"
                  highlight="a8,b8,c8,d8,e8,f8,g8,h8,a7,b7,c7,d7,e7,f7,g7,h7,a6,b6,c6,d6,e6,f6,g6,h6,a5,b5,c5,e5,f5,g5,h5,a4,b4,c4,d4,e4,f4,g4,h4,a3,b3,c3,d3,e3,f3,g3,h3,a2,b2,c2,d2,e2,f2,g2,h2,a1,b1,c1,d1,e1,f1,g1,h1"
                >{`8: X X X X X X X X
7: X X X X X X X X
6: X X X X X X X X
5: X X X . X X X X
4: X X X X X X X X
3: X X X X X X X X
2: X X X X X X X X
1: X X X X X X X X
   a b c d e f g h
`}</Board>

                <Board
                  title="moves"
                  highlight="d8,d7,d6,a5,b5,c5,e5,f5,g5,h5,d4,d3,d2,d1"
                >{`8: . . . X . . . .
7: . . . X . . . .
6: . . . X . . . .
5: X X X . X X X X
4: . . . X . . . .
3: . . . X . . . .
2: . . . X . . . .
1: . . . X . . . .
   a b c d e f g h
`}</Board>
              </Row>
            </Fragment>
          </BoardGroup>
        </Slide>

        <Slide>
          <h3>Rook Moves</h3>
          <p>B4 rook with blockers</p>

          <Board highlight="b4,a4,c4,d4,e4,f4,b3,b2,b1">{`8: . . . . . . . .
7: . . p . . . . .
6: . . . p . . . .
5: K P . . . . . r
4: . R . . . p . k
3: . . . . . . . .
2: . . . . P . P .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
        </Slide>

        <Slide>
          <h3>Rook Moves</h3>
          <p>B4 rook with blockers</p>

          <Code language="cpp" lineNumbers>{`
Bitboard occupied = position.GetPieces();
Bitboard pseudo_moves = GenerateRookMoves(B4, occupied);
Bitboard friendly = position.GetPieces(kWhite);
Bitboard moves = pseudo_moves & ~friendly;
          `}</Code>

          <BoardGroup className="r-stack">
            <Fragment className="fade-out" index={0} style={{ width: "100%" }}>
              <Row>
                <Board
                  title="position"
                  highlight="b4,a4,c4,d4,e4,f4,b3,b2,b1"
                >{`8: . . . . . . . .
7: . . p . . . . .
6: . . . p . . . .
5: K P . . . . . r
4: . R . . . p . k
3: . . . . . . . .
2: . . . . P . P .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

                <Board
                  title="occupied"
                  highlight="c7,d6,a5,b5,h5,b4,f4,h4,e2,g2"
                >{`8: . . . . . . . .
7: . . X . . . . .
6: . . . X . . . .
5: X X . . . . . X
4: . X . . . X . X
3: . . . . . . . .
2: . . . . X . X .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

                <Board
                  title="pseudo_moves"
                  highlight="b5,a4,c4,d4,e4,f4,b3,b2,b1"
                >{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . X . . . . . .
4: X . X X X X . .
3: . X . . . . . .
2: . X . . . . . .
1: . X . . . . . .
   a b c d e f g h
`}</Board>
              </Row>
            </Fragment>

            <Fragment
              className="current-visibile"
              index={0}
              style={{ width: "100%" }}
            >
              <Row>
                <Board
                  title="pseudo_moves"
                  highlight="b5,a4,c4,d4,e4,f4,b3,b2,b1"
                >{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . X . . . . . .
4: X . X X X X . .
3: . X . . . . . .
2: . X . . . . . .
1: . X . . . . . .
   a b c d e f g h
`}</Board>

                <Board
                  title="~friendly"
                  highlight="a8,b8,c8,d8,e8,f8,g8,h8,a7,b7,c7,d7,e7,f7,g7,h7,a6,b6,c6,d6,e6,f6,g6,h6,c5,d5,e5,f5,g5,h5,a4,c4,d4,e4,f4,g4,h4,a3,b3,c3,d3,e3,f3,g3,h3,a2,b2,c2,d2,f2,h2,a1,b1,c1,d1,e1,f1,g1,h1"
                >{`8: X X X X X X X X
7: X X X X X X X X
6: X X X X X X X X
5: . . X X X X X X
4: X . X X X X X X
3: X X X X X X X X
2: X X X X . X . X
1: X X X X X X X X
   a b c d e f g h
`}</Board>

                <Board
                  title="moves"
                  highlight="a4,c4,d4,e4,f4,b3,b2,b1"
                >{`8: . . . . . . . .
7: . . . . . . . .
6: . . . . . . . .
5: . . . . . . . .
4: X . X X X X . .
3: . X . . . . . .
2: . X . . . . . .
1: . X . . . . . .
   a b c d e f g h
`}</Board>
              </Row>
            </Fragment>
          </BoardGroup>
        </Slide>
      </Stack>

      <Slide>
        <h3>Bishop Moves</h3>

        <p>Same as rooks, but on diagonals.</p>
      </Slide>

      <Slide>
        <h3>Queen Moves</h3>

        <p>A queen is just a bishop and rook combined.</p>

        <Fragment>
          <Code language="cpp">{`Bitboard moves = GetBishopMoves(square) | GetRookMoves(square);
        `}</Code>
        </Fragment>
      </Slide>

      <Stack>
        <Slide>
          <h3>Implementation</h3>

          <Code
            language="cpp"
            lineNumbers="|6-9|"
          >{`Bitboard GetBishopAttacks(Square from, Bitboard occupied) {
 return GenerateSlidingAttacks<
    kNorthEast, kNorthWest, kSouthEast, kSouthWest>(from, occupied);
} 
            
Bitboard GetRookAttacks(Square from, Bitboard occupied) {
 return GenerateSlidingAttacks<
    kNorth, kEast, kSouth, kWest>(from, occupied);
}

Bitboard GetQueenAttacks(Square from, Bitboard occupied) {
 return GenerateRookAttacks(from, occupied) | GenerateBishopAttacks(from, occupied);
}
`}</Code>
        </Slide>

        <Slide>
          <h3>Implementation</h3>

          <Code
            language="cpp"
            lineNumbers="1-4|6-16|8|9|11|12|13|14-16|19|"
          >{`template <Direction... Directions>
Bitboard GenerateSlidingAttacks(Square from, Bitboard occupied) {
  return (GenerateRayAttacks<Directions>(from, occupied) | ...);
}

template <Direction Direction>
Bitboard GenerateRayAttacks(Square from, Bitboard occupied) {
  Bitboard attacks;
  Bitboard curr(from);

  while (curr) {
    curr = curr.Shift<Direction>();
    attacks |= curr;
    if (curr & occupied) { 
      break;
    }
  }

  return attacks;
}
`}</Code>
        </Slide>

        <Slide>
          <h3>Microbenchmarks</h3>
          <Code
            language="cpp"
            lineNumbers="|3-5|8-10|12-13|17-30|31-34"
          >{`template <Piece Piece>
void BM_GenerateAttacksLazily(benchmark::State& state) {
  int square = 0;
  std::vector<Bitboard> occupancies = GetRandomOccupancies();
  int occupancy_index = 0;

  for (auto _ : state) {
    Bitboard occupied = occupancies[occupancy_index % occupancies.size()];
    benchmark::DoNotOptimize(GenerateAttacks<Piece, LazySliderAttacks>(
        static_cast<Square>(square % kNumSquares), occupied));

    ++square;
    ++occupancy_index;
  }
}

std::vector<Bitboard> GetRandomOccupancies() {
  constexpr std::size_t kSampleSize = 10'000'000;

  std::mt19937 engine(std::random_device{}());
  std::uniform_int_distribution<std::uint64_t> dist(
      0, std::numeric_limits<std::uint64_t>::max());

  std::vector<Bitboard> result;
  result.reserve(kSampleSize);
  for (int i = 0; i < kSampleSize; ++i) {
    result.emplace_back(dist(engine));
  }
  return result;
}

BENCHMARK(BM_GenerateAttacksLazily<kBishop>);
BENCHMARK(BM_GenerateAttacksLazily<kRook>);
BENCHMARK(BM_GenerateAttacksLazily<kQueen>);
`}</Code>
        </Slide>

        <Slide>
          <h3>Microbenchmarks</h3>
          <p>Too slow when searching millions of positions/second</p>
          <Code
            language="plaintext"
            lineNumbers="10-12"
          >{`Run on (10 X 24 MHz CPU s)
CPU Caches:
  L1 Data 64 KiB
  L1 Instruction 128 KiB
  L2 Unified 4096 KiB (x10)
Load Average: 3.72, 4.14, 3.54
---------------------------------------------------------------------------------------------
Benchmark                                                   Time             CPU   Iterations
---------------------------------------------------------------------------------------------
BM_GenerateAttacksLazily<kBishop>                        20.6 ns         20.6 ns     34174181
BM_GenerateAttacksLazily<kRook>                          25.1 ns         25.1 ns     28057462
BM_GenerateAttacksLazily<kQueen>                         40.9 ns         40.8 ns     17477760
`}</Code>
        </Slide>
      </Stack>

      <Slide>
        <h2>Part 4</h2>
        <h3>Fast Sliding Piece Move Generation</h3>
      </Slide>

      <Stack>
        <Slide>
          <h3>Approach 1: Brute-Force Lookup</h3>
          <p>
            Map every possible occupancy <code>Bitboard</code> to an attack{" "}
            <code>Bitboard</code>.
          </p>
        </Slide>

        <Slide>
          <h3>Implementation</h3>

          <Code language="cpp" lineNumbers>
            {`
Bitboard GetRookAttacks(Square square, Bitboard occupied) {
  static const std::array<
    std::array<Bitboard, kNumOccupancies>, 
    kNumSquares> kRookAttacks = GenerateRookAttacks();
  
  return kRookAttacks[square][occupied.Data()];
}`}
          </Code>
        </Slide>

        <Slide>
          <h3>Rook Attack Table Size</h3>

          <Fragment>
            <p>
              <code>
                num_squares <Mul /> num_occupancies <Mul /> sizeof(Bitboard)
                &rarr;
              </code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>
                64 <Mul /> 2<sup>64</sup> <Mul /> 8 bytes &rarr;
              </code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>~9,444,732,965,739,290,427,392 bytes &rarr;</code>
            </p>
          </Fragment>

          <Fragment>
            <p>~9.44 Zettabytes or ~10% total world storage</p>
          </Fragment>
        </Slide>
      </Stack>

      <Stack>
        <Slide>
          <h3>Approach 2: Map Lookup</h3>

          <Fragment>
            <p>Only the occupancy of some squares matters.</p>
          </Fragment>

          <Fragment>
            <p>Can we ignore the irrelevant squares?</p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Relevant Squares</h3>

          <p>
            A rook is only affected by pieces on its own rank and file,
            excluding edges.
          </p>

          <Row>
            <Fragment>
              <Board
                title="D5 Example"
                highlight="d7,d6,d4,d3,d2,b5,c5,e5,f5,g5"
                footer="10 Relevant Squares"
              >{`8: . . . . . . . .
7: . . . X . . . .
6: . . . X . . . .
5: . X X . X X X .
4: . . . X . . . .
3: . . . X . . . .
2: . . . X . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Fragment>

            <Fragment>
              <Board
                title="E8 Example"
                highlight="b8,c8,d8,f8,g8,e7,e6,e5,e4,e3,e2"
                footer="11 Relevant Squares"
              >{`8: . X X X . X X .
7: . . . . X . . .
6: . . . . X . . .
5: . . . . X . . .
4: . . . . X . . .
3: . . . . X . . .
2: . . . . X . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>
            </Fragment>

            <Fragment>
              <Board
                title="H1 Example"
                highlight="h7,h6,h5,h4,h3,h2,b1,c1,d1,e1,f1,g1"
                footer="12 Relevant Squares"
              >{`8: . . . . . . . .
7: . . . . . . . X
6: . . . . . . . X
5: . . . . . . . X
4: . . . . . . . X
3: . . . . . . . X
2: . . . . . . . X
1: . X X X X X X .
   a b c d e f g h
`}</Board>
            </Fragment>
          </Row>
        </Slide>

        <Slide>
          <h3>Implementation</h3>

          <p>Same idea as before, but with a map instead of an array.</p>

          <Code language="cpp" lineNumbers="|3|6-7|9|">
            {`Bitboard GetRookAttacks(Square square, Bitboard occupied) {
  static const std::array<
    absl::flat_hash_map<Bitboard, Bitboard>, // Occupancy Bitboard -> Attack Bitboard
    kNumSquares> kRookAttacks = GenerateRookAttacks();

  Bitboard mask = GetRookRelevancyMask(square);
  occupied &= mask;

  return kRookAttacks[square].find(occupied)->second;
}`}
          </Code>
        </Slide>

        <Slide>
          <h3>Rook Attack Table Size</h3>

          <Fragment>
            <p>
              <code>
                num_occupancies <Mul /> map_overhead <Mul /> sizeof(Bitboard)
                &rarr;
              </code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>
                (36 * 2<sup>10</sup> + 24 * 2<sup>11</sup> + 4 * 2<sup>12</sup>){" "}
                <Mul /> ~3 <Mul /> 8 bytes &rarr;
              </code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>
                102,400 <Mul /> ~3 <Mul /> 8 bytes &rarr;
              </code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>~2,457,600 bytes &rarr;</code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>~2.5 MB</code>
            </p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Microbenchmarks</h3>

          <Code
            language="plaintext"
            lineNumbers="13-21"
          >{`Run on (10 X 24 MHz CPU s)
CPU Caches:
  L1 Data 64 KiB
  L1 Instruction 128 KiB
  L2 Unified 4096 KiB (x10)
Load Average: 3.72, 4.14, 3.54
---------------------------------------------------------------------------------------------
Benchmark                                                   Time             CPU   Iterations
---------------------------------------------------------------------------------------------
BM_GenerateAttacksLazily<kBishop>                        20.6 ns         20.6 ns     34174181
BM_GenerateAttacksLazily<kRook>                          25.1 ns         25.1 ns     28057462
BM_GenerateAttacksLazily<kQueen>                         40.9 ns         40.8 ns     17477760
BM_LookupAttacksFrom<absl::flat_hash_map, kBishop>       3.55 ns         3.53 ns    194287935
BM_LookupAttacksFrom<absl::flat_hash_map, kRook>         7.65 ns         7.64 ns     92994832
BM_LookupAttacksFrom<absl::flat_hash_map, kQueen>        11.3 ns         11.3 ns     61370132
BM_LookupAttacksFrom<std::map, kBishop>                  23.6 ns         23.6 ns     29747992
BM_LookupAttacksFrom<std::map, kRook>                    64.5 ns         64.5 ns     10737514
BM_LookupAttacksFrom<std::map, kQueen>                   99.6 ns         99.6 ns      6844761
BM_LookupAttacksFrom<std::unordered_map, kBishop>        7.80 ns         7.79 ns     89946546
BM_LookupAttacksFrom<std::unordered_map, kRook>          9.84 ns         9.84 ns     70889665
BM_LookupAttacksFrom<std::unordered_map, kQueen>         18.9 ns         18.9 ns     36815172
`}</Code>
        </Slide>
      </Stack>

      <Stack>
        <Slide>
          <h3>Approach 3: PEXT</h3>

          <p>
            Approach 2 uses maps because occupancy Bitboards don't form
            contiguous indices.
          </p>

          <Fragment>
            <p>
              What if we could map the occupancy Bitboards to contiguous
              indices?
            </p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Intuition</h3>

          <div className="r-stack">
            <Fragment className="fade-out" index={0}>
              <Board
                title="D5 Relevant Squares"
                highlight="d7,d6,d4,d3,d2,b5,c5,e5,f5,g5"
                showBits
              >{`8: . . . . . . . .
7: . . . X . . . .
6: . . . X . . . .
5: . X X . X X X .
4: . . . X . . . .
3: . . . X . . . .
2: . . . X . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

              <Integer>
                {`........ ....1... ....1... ....1... .111.11. ....1... ....1... ........`}
              </Integer>
            </Fragment>

            <Fragment className="current-visible" index={0}>
              <Board
                title="D5 Relevant Squares"
                highlight="d7,d6,d4,d3,d2,b5,c5,e5,f5,g5"
                showBits
                showLabels
              >{`8: . . . . . . . .
7: . . . A . . . .
6: . . . B . . . .
5: . C D . E F G .
4: . . . H . . . .
3: . . . I . . . .
2: . . . J . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

              <Integer>
                {`........ ....J... ....I... ....H... .GFE.DC. ....B... ....A... ........`}
              </Integer>
            </Fragment>
          </div>
        </Slide>

        <Slide>
          <h3>Intuition</h3>

          <Integer>
            {`........ ....J... ....I... ....H... .GFE.DC. ....B... ....A... ........`}
          </Integer>

          <Fragment>
            <p>&rarr;</p>

            <Integer>
              {`00000000 00000000 00000000 00000000 00000000 00000000 000000JI HGFEDCBA`}
            </Integer>
          </Fragment>

          <Fragment>
            <p>This transformation forms a 10-bit integer!</p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Parallel Bits Extract (PEXT) Instruction</h3>

          <p>Extracts bits from an integer based on a mask.</p>

          <p>
            Results are packed into the contiguous low-order bits of the result.
          </p>
        </Slide>

        <Slide>
          <h3>PEXT 8-bit Examples</h3>

          <table>
            <thead>
              <tr>
                <th rowSpan={2} style={{ verticalAlign: "bottom" }}>
                  Example
                </th>
                <th
                  colSpan={2}
                  style={{
                    textAlign: "center",
                  }}
                >
                  Inputs
                </th>
                <th
                  style={{
                    textAlign: "center",
                  }}
                  rowSpan={2}
                >
                  Result
                </th>
              </tr>
              <tr>
                <th
                  style={{
                    textAlign: "center",
                  }}
                >
                  Source
                </th>
                <th
                  style={{
                    textAlign: "center",
                  }}
                >
                  Mask
                </th>
              </tr>
            </thead>

            <tbody>
              <PextRow
                description="Select none"
                input="11111111"
                mask="00000000"
                result="00000000"
              />
              <PextRow
                description="Select all"
                input="11110111"
                mask="11111111"
                result="11110111"
              />
              <PextRow
                description="Select upper 4 bits"
                input="11001010"
                mask="11110000"
                result="00001100"
              />
              <PextRow
                description="Select lower 3 bits"
                input="11010100"
                mask="00000111"
                result="00000100"
              />
              <PextRow
                description="Select bits 1 and 8"
                input="10011001"
                mask="10000001"
                result="00000011"
              />
              <PextRow
                description="Select bits 2, 4, 6, and 8"
                input="10110100"
                mask="10101010"
                result="00001100"
              />
            </tbody>
          </table>
        </Slide>

        <Slide>
          <h3>Implementation</h3>
          <Code language="cpp" lineNumbers="|7|2-4|10-11|13|">
            {`Bitboard GetRookAttacks(Square square, Bitboard occupied) {
  // This varies between 2^10 and 2^12 depending on the square.
  // For simplicity, we use the worst-case value.
  constexpr std::size_t kNumOccupancies = 1 << 12;

  static const std::array<
    std::array<Bitboard, kNumOccupancies>,
    kNumSquares> kRookAttacks = GenerateRookAttacks();

  Bitboard mask = GetRookRelevancyMask(square);
  std::size_t occupied_index = _pext_u64(occupied, mask);

  return kRookAttacks[square][occupied_index];
}`}
          </Code>
        </Slide>

        <Slide>
          <h3>Rook Attack Table Size</h3>

          <Fragment>
            <p>
              <code>
                num_squares <Mul /> num_occupancies <Mul /> sizeof(Bitboard)
                &rarr;
              </code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>
                64 <Mul /> 2<sup>12</sup> <Mul /> 8 bytes &rarr;
              </code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>2,097,152 bytes &rarr;</code>
            </p>
          </Fragment>

          <Fragment>
            <p>
              <code>~2.1 MB</code>
            </p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Limitations</h3>
          <p>
            <code>PEXT</code> is not a portable solution:
          </p>

          <ul>
            <Fragment>
              <li>
                PEXT is part of the{" "}
                <a
                  href="https://en.wikipedia.org/wiki/X86_Bit_manipulation_instruction_set"
                  target="_blank"
                >
                  x86 BMI2 instruction set.
                </a>
              </li>
            </Fragment>
            <Fragment>
              <li>
                On some AMD architectures, PEXT is implemented in{" "}
                <a
                  href="https://orlp.net/blog/extracting-depositing-bits/"
                  target="_blank"
                >
                  microcode
                </a>
                , so it is not performant.
              </li>
            </Fragment>
            <Fragment>
              <li>
                Similar instruction exists in{" "}
                <a
                  href="https://developer.arm.com/documentation/ddi0602/2022-06/SVE-Instructions/BEXT--Gather-lower-bits-from-positions-selected-by-bitmask-"
                  target="_blank"
                >
                  Arm's Scalable Vector Extension 2 (SVE2)
                </a>
                , but remains unimplemented in Apple Silicon.
              </li>
            </Fragment>
          </ul>
        </Slide>
      </Stack>

      <Stack>
        <Slide>
          <h3>Approach 4: Magic Bitboards</h3>

          <p>
            Same idea as <code>PEXT</code>, but implemented in software.
          </p>
        </Slide>

        <Slide>
          <h3>Intuition</h3>

          <Board
            title="D5 Relevant Squares"
            highlight="d7,d6,d4,d3,d2,b5,c5,e5,f5,g5"
            showBits
            showLabels
          >{`8: . . . . . . . .
7: . . . A . . . .
6: . . . B . . . .
5: . C D . E F G .
4: . . . H . . . .
3: . . . I . . . .
2: . . . J . . . .
1: . . . . . . . .
   a b c d e f g h
`}</Board>

          <Integer>
            {`........ ....J... ....I... ....H... .GFE.DC. ....B... ....A... ........`}
          </Integer>
        </Slide>

        <Slide>
          <h3>Intuition</h3>

          <Integer>
            {`........ ....J... ....I... ....H... .GFE.DC. ....B... ....A... ........`}
          </Integer>

          <p>&rarr;</p>

          <div className="r-stack">
            <Fragment className="fade-out" index={0}>
              <Integer>
                {`JIHGFEDC BA...... ........ ........ ........ ........ ........ ........`}
              </Integer>

              <p>&rarr;</p>

              <Integer>
                {`00000000 00000000 00000000 00000000 00000000 00000000 000000JI HGFEDCBA`}
              </Integer>
            </Fragment>

            <Fragment className="current-visible" index={0}>
              <Integer>{`ABCDEFGH IJ...... ........ ........ ........ ........ ........ ........`}</Integer>

              <p>&rarr;</p>

              <Integer>{`00000000 00000000 00000000 00000000 00000000 00000000 000000AB CDEFGHIJ`}</Integer>
            </Fragment>

            <Fragment className="fade-in" index={1}>
              <Integer>{`BHDEFGCI JA...... ........ ........ ........ ........ ........ ........`}</Integer>

              <p>&rarr;</p>

              <Integer>{`00000000 00000000 00000000 00000000 00000000 00000000 000000BH DEFGCIJA`}</Integer>
            </Fragment>
          </div>
        </Slide>

        <Slide>
          <h3>Intuition</h3>

          <Integer>
            {`........ ....J... ....I... ....H... .GFE.DC. ....B... ....A... ........`}
          </Integer>

          <Fragment>
            <Code language="cpp">{`
Bitboard mask = GetRookRelevancyMask(D5);
std::size_t index = occupied & mask;`}</Code>

            <Integer>
              {`00000000 0000J000 0000I000 0000H000 0GFE0DC0 0000B000 0000A000 00000000`}
            </Integer>
          </Fragment>

          <Fragment>
            <p>&rarr;</p>

            <Code language="cpp">{`index *= magic;`}</Code>

            <Integer>
              {`JIHGFEDC BA...... ........ ........ ........ ........ ........ ........`}
            </Integer>
          </Fragment>

          <Fragment>
            <p>&rarr;</p>

            <Code language="cpp">{`index >>= (64 - mask.GetCount());`}</Code>

            <Integer>
              {`........ ........ ........ ........ ........ ........ ......JI HGFEDCBA`}
            </Integer>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Implementation</h3>

          <Code language="cpp" lineNumbers="|1-2|4-6|8-9|11-13|">{`
[[nodiscard]] std::size_t CalculateRookIndex(
  Square square, Bitboard occupied, std::uint64_t magic) {

  // Clear non-relevant squares:
  Bitboard mask = GetRookRelevancyMask(square);
  std::size_t index = occupied & mask;

  // Move the relevant square bits to the upper bits:
  index *= magic;

  // Move the relevant square bits to the lower bits,
  // so we're left with a small number:
  index >>= (64 - mask.GetCount());

  return index;
}
`}</Code>
        </Slide>

        <Slide>
          <h3>Finding Magic Numbers</h3>

          <p>For each square:</p>
          <ol>
            <Fragment>
              <li>Generate a "sparse" random number</li>
            </Fragment>
            <Fragment>
              <li>
                Call <code>CalculateRookIndex()</code> for every possible
                occupancy
              </li>
            </Fragment>
            <Fragment>
              <li>
                If two occupancies lead to the same index, go back to step 1;
                otherwise, the magic number for the square is found
              </li>
            </Fragment>
          </ol>
        </Slide>

        <Slide>
          <h3>Sparse Random Numbers</h3>

          <p>
            Random numbers with only 1/8<sup>th</sup> of their bits set
          </p>

          <Code
            language="cpp"
            lineNumbers="|6|"
          >{`std::uint64_t GetSparseRandom() {
  std::random_device rd;
  std::mt19937 gen(rd()); 
  std::uniform_int_distribution<std::uint64_t> dist(0);

  return dist(gen) & dist(gen) & dist(gen);
}`}</Code>
        </Slide>

        <Slide>
          <h3>Why Sparse Random Numbers?</h3>

          <Code language="plaintext" lineNumbers>{`
magic = (1 << a) + (1 << b) + (1 << c) + ...

occupied * magic = (occupied << a)
                 + (occupied << b)
                 + (occupied << c)
                 + ...
          `}</Code>

          <Fragment>
            <p>
              More bits in <code>magic</code> &rarr;
            </p>
          </Fragment>

          <Fragment>
            <p>More terms in the sum &rarr;</p>
          </Fragment>

          <Fragment>
            <p>More carry chain propagation &rarr;</p>
          </Fragment>

          <Fragment>
            <p>More information loss</p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Right Shifting</h3>

          <p>Why right-shift instead of masking the lower bits?</p>

          <Fragment>
            <p>
              In multiplication, information flows from lower bits to upper
              bits.
            </p>
          </Fragment>
        </Slide>

        <Slide>
          <h3>Iterations to Find Magic Numbers</h3>

          <Code
            language="plaintext"
            lineNumbers="4-18"
          >{`$ bazel build ...                                                                                                                                                                          ─╯
INFO: Analyzed 59 targets (0 packages loaded, 4436 targets configured).
INFO: From RunBinary engine/magic.generated.h:
Finding magic numbers for bishops:
  Found magic for a8 after   1,997 attempts: 9009435087472833
  Found magic for b8 after   2,349 attempts: 40533500520334400
  Found magic for c8 after   1,410 attempts: 2278189176520776
  Found magic for d8 after     935 attempts: 9266191969056784896
  Found magic for e8 after     407 attempts: 1425242014613512
  Found magic for f8 after     336 attempts: 92763614745723906
  ...
Finding magic numbers for rooks:
  Found magic for a8 after   3,866 attempts: 36029386503229472
  Found magic for b8 after  44,705 attempts: 18014742108963904
  Found magic for c8 after 111,638 attempts: 4683771103758262274
  Found magic for d8 after 121,205 attempts: 36046395650080772
  Found magic for e8 after  73,715 attempts: 648522778764382210
  Found magic for f8 after  28,826 attempts: 144116322149606912
  ...
`}</Code>
        </Slide>

        <Slide>
          <h3>
            <code>consteval</code>
          </h3>

          <p>
            Unlike knights we can't use <code>consteval</code> to generate the
            attack tables:
          </p>

          <ul>
            <Fragment>
              <li>
                <code>consteval</code> forbids random number generators.
              </li>
            </Fragment>

            <Fragment>
              <li>
                Requires vendor-specific compiler options to allow the more
                computationally-intensive calculations to finish.
              </li>
            </Fragment>

            <Fragment>
              <li>Debugging is harder.</li>
            </Fragment>
          </ul>
        </Slide>

        <Slide>
          <h3>
            <code>consteval</code> Workaround
          </h3>

          <p>
            Generate a C++ file with the magic Bitboards.{" "}
            <a href="https://bazel.build/" target="_blank">
              Bazel
            </a>{" "}
            changes:
          </p>

          <Code language="bazel" lineNumbers="|1-5|7-12|14-18|">{`cc_binary(
   name = "magic_main",
   srcs = ["magic_main.cc"],
   deps = [":magic"],
)

run_binary(
   name = "magic_main_generate",
   outs = ["magic.generated.h",],
   args = ["$(location magic.generated.h)"],
   tool = ":magic_main",
)

cc_library(
    name = "attacks",
    hdrs = ["attacks.h", "magic.generated.h"],
    # ...
)
`}</Code>
        </Slide>

        <Slide>
          <h3>Magic Bitboard File Generator</h3>

          <Code
            language="cpp"
            lineNumbers
          >{`void AddMagicEntry(const MagicEntry& entry, std::ofstream& output) {
 std::println(output, "    MagicEntry{{");
 std::println(output, "      .mask = Bitboard({}ULL),", entry.mask.Data());
 std::println(output, "      .magic = {}ULL,", entry.magic);
 std::println(output, "      .shift = {}U,", entry.shift);
 std::println(output, "      .attack_table_index = {},",
              entry.attack_table_index);
 std::println(output, "    }},");
}

void AddTable(std::ofstream& output) {
  SlidingAttackTables table = follychess::GenerateSlidingAttackTables();

  std::println(output, "constexpr SlidingAttackTables kSliderAttacks = {{");
  std::println(output, "  .attacks = {{");
  for (int i = 0; i < SlidingAttackTables::kAttackTableSize; ++i) {
    std::println(output, "    Bitboard({}ULL),", table.attacks[i].Data());
  }
  std::println(output, "   }},");

  std::println(output, "  .bishop_magic_squares = {{");
  for (int i = 0; i < kNumSquares; ++i) {
    AddMagicEntry(table.bishop_magic_squares[i], output);
  }
  std::println(output, "  }},");

  std::println(output, "  .rook_magic_squares = {{");
  for (int i = 0; i < kNumSquares; ++i) {
    AddMagicEntry(table.rook_magic_squares[i], output);
  }
  std::println(output, "  }},");
  std::println(output, "}};");
}`}</Code>
        </Slide>

        <Slide>
          <h3>Magic Bitboard File</h3>

          <Code
            language="cpp"
            lineNumbers
          >{`constexpr SlidingAttackTables kSliderAttacks = {
  // ...
  .rook_magic_squares = {
    MagicEntry{ // A8
      .mask = Bitboard(282578800148862ULL),
      .magic = 1188950851939467536ULL,
      .shift = 52U,
      .attack_table_index = 32768,
    },
    MagicEntry{ // B8
      .mask = Bitboard(565157600297596ULL),
      .magic = 18014467247833160ULL,
      .shift = 53U,
      .attack_table_index = 36864,
  },
  MagicEntry{ // C8
      .mask = Bitboard(1130315200595066ULL),
      .magic = 144124267638915216ULL,
      .shift = 53U,
      .attack_table_index = 40960,
  },
  // ...
          `}</Code>
        </Slide>

        <Slide>
          <h3>Magic Bitboard File</h3>

          <Code
            language="cpp"
            lineNumbers
          >{`constexpr SlidingAttackTables kSliderAttacks = {
 .attacks = {
   Bitboard(9241421688590303744ULL),
   Bitboard(262656ULL),
   Bitboard(512ULL),
   Bitboard(262656ULL),
   Bitboard(512ULL),
   Bitboard(512ULL),
   Bitboard(134480384ULL),
   Bitboard(512ULL),
   Bitboard(134480384ULL),
   Bitboard(262656ULL),
   Bitboard(512ULL),
   Bitboard(262656ULL),
   Bitboard(512ULL),
   Bitboard(512ULL),
   Bitboard(68853957120ULL),
   Bitboard(512ULL),
   Bitboard(35253226045952ULL),
   Bitboard(262656ULL),
   // ...`}</Code>
        </Slide>

        <Slide>
          <h3>Magic Bitboard File Usage</h3>

          <Code language="cpp" lineNumbers="|14-19|15|16|17|18|">{`
#include "engine/magic.generated.h"

// ...

class MagicSliderAttacks {
 public:
  static Bitboard GetBishopAttacks(Square square, Bitboard occupied) {
    const MagicEntry &entry = kSliderAttacks.bishop_magic_squares[square];
    occupied &= entry.mask;
    std::size_t index = (entry.magic * occupied.Data()) >> entry.shift;
    return kSliderAttacks.attacks[entry.attack_table_index + index];
  }

  static Bitboard GetRookAttacks(Square square, Bitboard occupied) {
    const MagicEntry &entry = kSliderAttacks.rook_magic_squares[square];
    occupied &= entry.mask;
    std::size_t index = (entry.magic * occupied.Data()) >> entry.shift;
    return kSliderAttacks.attacks[entry.attack_table_index + index];
  }
};
`}</Code>
        </Slide>
      </Stack>

      <Stack>
        <Slide>
          <h3>Magic Bitboard Performance</h3>
        </Slide>

        <Slide>
          <h3>Microbenchmarks</h3>
          <Code language="plaintext" lineNumbers="22-24">{`
Run on (10 X 24 MHz CPU s)
CPU Caches:
  L1 Data 64 KiB
  L1 Instruction 128 KiB
  L2 Unified 4096 KiB (x10)
Load Average: 3.72, 4.14, 3.54
---------------------------------------------------------------------------------------------
Benchmark                                                   Time             CPU   Iterations
---------------------------------------------------------------------------------------------
BM_GenerateAttacksLazily<kBishop>                        20.6 ns         20.6 ns     34174181
BM_GenerateAttacksLazily<kRook>                          25.1 ns         25.1 ns     28057462
BM_GenerateAttacksLazily<kQueen>                         40.9 ns         40.8 ns     17477760
BM_LookupAttacksFrom<absl::flat_hash_map, kBishop>       3.55 ns         3.53 ns    194287935
BM_LookupAttacksFrom<absl::flat_hash_map, kRook>         7.65 ns         7.64 ns     92994832
BM_LookupAttacksFrom<absl::flat_hash_map, kQueen>        11.3 ns         11.3 ns     61370132
BM_LookupAttacksFrom<std::map, kBishop>                  23.6 ns         23.6 ns     29747992
BM_LookupAttacksFrom<std::map, kRook>                    64.5 ns         64.5 ns     10737514
BM_LookupAttacksFrom<std::map, kQueen>                   99.6 ns         99.6 ns      6844761
BM_LookupAttacksFrom<std::unordered_map, kBishop>        7.80 ns         7.79 ns     89946546
BM_LookupAttacksFrom<std::unordered_map, kRook>          9.84 ns         9.84 ns     70889665
BM_LookupAttacksFrom<std::unordered_map, kQueen>         18.9 ns         18.9 ns     36815172
BM_LookupAttacksFromMagicTables<kBishop>                 1.23 ns         1.23 ns    571545213
BM_LookupAttacksFromMagicTables<kRook>                   1.31 ns         1.31 ns    533565053
BM_LookupAttacksFromMagicTables<kQueen>                  1.96 ns         1.96 ns    351764097
`}</Code>
        </Slide>

        <Slide>
          <h3>Depth 10 Best Move Search</h3>

          <p>Universal Chess Interface (UCI)</p>

          <Code language="plaintext" lineNumbers="1|2|3|4-14|16|17-27">
            {`
  $ follychess
  position fen r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1
  d
  8: r . . . k . . r
  7: P p p p . p p p
  6: . b . . . n b N
  5: n P . . . . . .
  4: B B P . P . . .
  3: q . . . . N . .
  2: P p . P . . P P
  1: R . . Q . R K .
    a b c d e f g h

    w kq - 0 1

  go depth 10
  info depth 1 score cp -249 nodes 782 nps 19822 pv c4c5 b2a1r b4a3 a1d1 a4d1 b6a7
  info depth 2 score cp -249 nodes 1327 nps 32765 pv c4c5 b2a1q b4a3 a1d1 a4d1 b6a7
  info depth 3 score cp -249 nodes 3481 nps 80588 pv c4c5 b2a1q b4a3 a1d1 a4d1 b6a7
  info depth 4 score cp -274 nodes 13995 nps 261883 pv c4c5 a3b4 c5b6 b2a1q d1a1 b4a4 b6c7 g6e4
  info depth 5 score cp -274 nodes 32034 nps 479990 pv c4c5 a3b4 c5b6 b2a1q d1a1 b4a4 b6c7 g6e4
  info depth 6 score cp -302 nodes 97776 nps 891383 pv c4c5 b6c5 b4c5 a3c5 d2d4 c5b6
  info depth 7 score cp -260 nodes 394057 nps 1737388 pv c4c5 b6c5 b4c5 a3c5 d2d4 b2a1q d1a1 c5a7
  info depth 8 score cp -260 nodes 848622 nps 2321683 pv c4c5 b6c5 b4c5 a3c5 d2d4 b2a1q d1a1 c5a7
  info depth 9 score cp -375 nodes 1458344 nps 2542025 pv c4c5 b6c5 b4c5 a3c5 d2d4 b2a1q d4c5 a1d1 a4d1 g7h6
  info depth 10 score cp -338 nodes 4698200 nps 2509260 pv c4c5 b6c5 b4c5 a3c5 g1h1 h8f8 d2d3 b2a1q d1a1 a5c4
  bestmove c4c5
    `}
          </Code>
        </Slide>

        <Slide>
          <h3>Depth 10 Best Move Search</h3>
          <p>Million nodes per second</p>

          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Lazy</th>
                <th>Magic</th>
                <th>Speedup</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Initial</td>
                <td style={{ textAlign: "right" }}>2.192</td>
                <td style={{ textAlign: "right" }}>2.612</td>
                <td style={{ textAlign: "right" }}>1.19</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_3">
                    Perft 3
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>2.948</td>
                <td style={{ textAlign: "right" }}>3.833</td>
                <td style={{ textAlign: "right" }}>1.30</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_4">
                    Perft 4
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>2.557</td>
                <td style={{ textAlign: "right" }}>2.808</td>
                <td style={{ textAlign: "right" }}>1.10</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_5">
                    Perft 5
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>2.169</td>
                <td style={{ textAlign: "right" }}>2.436</td>
                <td style={{ textAlign: "right" }}>1.12</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_6">
                    Perft 6
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>2.377</td>
                <td style={{ textAlign: "right" }}>2.525</td>
                <td style={{ textAlign: "right" }}>1.06</td>
              </tr>
            </tbody>
          </table>
        </Slide>

        <Slide>
          <h3>Perft</h3>

          <p>Generating all positions to depth 5</p>

          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>
                  <a href="https://github.com/aryann/follychess/blob/bf6711bc82c68bd74a64248da6cabd1b65736ade/benchmarks/moves_benchmark_latest.txt">
                    Lazy
                  </a>
                </th>
                <th>
                  <a href="https://github.com/aryann/follychess/blob/2d1730031c751fead020318fd620d1467e97abd9/benchmarks/moves_benchmark_latest.txt">
                    Magic
                  </a>
                </th>
                <th>Speedup</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Initial</td>
                <td style={{ textAlign: "right" }}>250 ms</td>
                <td style={{ textAlign: "right" }}>194 ms</td>
                <td style={{ textAlign: "right" }}>1.29</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_3">
                    Perft 3
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>45 ms</td>
                <td style={{ textAlign: "right" }}>33 ms</td>
                <td style={{ textAlign: "right" }}>1.36</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_4">
                    Perft 4
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>812 ms</td>
                <td style={{ textAlign: "right" }}>632 ms</td>
                <td style={{ textAlign: "right" }}>1.28</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_5">
                    Perft 5
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>4,515 ms</td>
                <td style={{ textAlign: "right" }}>3,407 ms</td>
                <td style={{ textAlign: "right" }}>1.33</td>
              </tr>

              <tr>
                <td>
                  <a href="https://www.chessprogramming.org/Perft_Results#Position_6">
                    Perft 6
                  </a>
                </td>
                <td style={{ textAlign: "right" }}>7,223 ms</td>
                <td style={{ textAlign: "right" }}>6,270 ms</td>
                <td style={{ textAlign: "right" }}>1.15</td>
              </tr>
            </tbody>
          </table>
        </Slide>
      </Stack>

      <Slide>
        <h2>Thank You!</h2>
      </Slide>

      <Stack>
        <Slide>
          <h3>Bonus: Benchmarking</h3>

          <p>How do we benchmark different approaches with ease?</p>
        </Slide>

        <Slide>
          <h3>Main Move Generation Function</h3>

          <Code
            language="cpp"
            lineNumbers="|1|18-29|"
          >{`template <Piece Piece, typename SliderAttacks = MagicSliderAttacks>
  requires SliderAttacksPolicy<SliderAttacks>
constexpr Bitboard GenerateAttacks(Square square, Bitboard occupied) {
  static_assert(Piece != kPawn);

  if constexpr (Piece == kKnight) {
    static constexpr std::array<Bitboard, kNumSquares> kKnightAttacks =
        GenerateKnightAttacks();
    return kKnightAttacks[square];
  }

  if constexpr (Piece == kKing) {
    static constexpr std::array<Bitboard, kNumSquares> kKingAttacks =
        GenerateKingAttacks();
    return kKingAttacks[square];
  }

  if constexpr (Piece == kBishop) {
    return SliderAttacks::GetBishopAttacks(square, occupied);
  }

  if constexpr (Piece == kRook) {
    return SliderAttacks::GetRookAttacks(square, occupied);
  }

  if constexpr (Piece == kQueen) {
    return SliderAttacks::GetBishopAttacks(square, occupied) |
           SliderAttacks::GetRookAttacks(square, occupied);
  }

  return kEmptyBoard;
}`}</Code>
        </Slide>

        <Slide>
          <h3>Magic Bitboards Implementation</h3>

          <Code language="cpp" lineNumbers>
            {`class MagicSliderAttacks {
 public:
  static constexpr Bitboard GetBishopAttacks(Square square, Bitboard occupied) {
    const MagicEntry &magic = kSliderAttacks.bishop_magic_squares[square];
    occupied &= magic.mask;
    std::size_t index = (magic.magic * occupied.Data()) >> magic.shift;
    return kSliderAttacks.attacks[magic.attack_table_index + index];
  }

  static constexpr Bitboard GetRookAttacks(Square square, Bitboard occupied) {
    const MagicEntry &magic = kSliderAttacks.rook_magic_squares[square];
    occupied &= magic.mask;
    std::size_t index = (magic.magic * occupied.Data()) >> magic.shift;
    return kSliderAttacks.attacks[magic.attack_table_index + index];
  }
};`}
          </Code>
        </Slide>

        <Slide>
          <h3>Concept</h3>

          <Code language="cpp" lineNumbers>{`template <typename T>
concept SliderAttacksPolicy = requires(Square square, Bitboard occupied) {
  { T::GetBishopAttacks(square, occupied) } -> std::same_as<Bitboard>;
  { T::GetRookAttacks(square, occupied) } -> std::same_as<Bitboard>;
};`}</Code>
        </Slide>

        <Slide>
          <h3>Concept Requirement</h3>

          <Code
            language="cpp"
            lineNumbers="2"
          >{`template <Piece Piece, typename SliderAttacks = MagicSliderAttacks>
  requires SliderAttacksPolicy<SliderAttacks>
constexpr Bitboard GenerateAttacks(Square square, Bitboard occupied) {
// ...`}</Code>
        </Slide>

        <Slide>
          <h3>Other Implementations</h3>

          <Code
            language="cpp"
            lineNumbers="|1|37-51|12-18|"
          >{`template <template <typename...> typename Map>
class MapSliderAttacks {
 public:
  static constexpr Bitboard GetBishopAttacks(Square square, Bitboard occupied) {
    static const std::array<Map<Bitboard, Bitboard>, kNumSquares>
        kBishopAttacks = GenerateBishopAttackMap();

    Bitboard mask = kSliderAttacks.bishop_magic_squares[square].mask;
    return kBishopAttacks[square].at(occupied & mask);
  }

  static constexpr Bitboard GetRookAttacks(Square square, Bitboard occupied) {
    static const std::array<Map<Bitboard, Bitboard>, kNumSquares> kRookAttacks =
        GenerateRookAttackMap();

    Bitboard mask = kSliderAttacks.rook_magic_squares[square].mask;
    return kRookAttacks[square].at(occupied & mask);
  }

 private:
  [[nodiscard]] static auto GenerateBishopAttackMap() {
    std::array<Map<Bitboard, Bitboard>, kNumSquares> result;
    for (int square = kFirstSquare; square < kNumSquares; ++square) {
      const Square from = static_cast<Square>(square);
      Bitboard mask = kSliderAttacks.bishop_magic_squares[square].mask;

      std::vector<Bitboard> occupancies = MakePowerSet(mask);
      for (Bitboard occupied : occupancies) {
        result[from][occupied] =
            MagicSliderAttacks::GetBishopAttacks(from, occupied);
      }
    }

    return result;
  }

  [[nodiscard]] static auto GenerateRookAttackMap() {
    std::array<Map<Bitboard, Bitboard>, kNumSquares> result;
    for (int square = kFirstSquare; square < kNumSquares; ++square) {
      const Square from = static_cast<Square>(square);
      Bitboard mask = kSliderAttacks.rook_magic_squares[square].mask;

      std::vector<Bitboard> occupancies = MakePowerSet(mask);
      for (Bitboard occupied : occupancies) {
        result[from][occupied] =
            MagicSliderAttacks::GetRookAttacks(from, occupied);
      }
    }

    return result;
  }
};
`}</Code>
        </Slide>

        <Slide>
          <h3>Benchmark Implementation</h3>

          <Code
            language="cpp"
            lineNumbers="|1|9-10|19-22|"
          >{`template <template <typename...> class Map, Piece Piece>
void BM_LookupAttacksFrom(benchmark::State& state) {
  int square = 0;
  std::vector<Bitboard> occupancies = GetRandomOccupancies();
  int occupancy_index = 0;

  for (auto _ : state) {
    Bitboard occupied = occupancies[occupancy_index % occupancies.size()];
    benchmark::DoNotOptimize(GenerateAttacks<Piece, MapSliderAttacks<Map>>(
        static_cast<Square>(square % kNumSquares), occupied));

    ++square;
    ++occupancy_index;
  }
}

// ...

// Use absl::flat_hash_map to lookup precomputed attacks:
BENCHMARK(BM_LookupAttacksFrom<absl::flat_hash_map, kBishop>);
BENCHMARK(BM_LookupAttacksFrom<absl::flat_hash_map, kRook>);
BENCHMARK(BM_LookupAttacksFrom<absl::flat_hash_map, kQueen>);

// Use std::map to lookup precomputed attacks:
BENCHMARK(BM_LookupAttacksFrom<std::map, kBishop>);
BENCHMARK(BM_LookupAttacksFrom<std::map, kRook>);
BENCHMARK(BM_LookupAttacksFrom<std::map, kQueen>);`}</Code>
        </Slide>
      </Stack>
    </Deck>
  );
};
