import React, { useEffect, useMemo, useState } from "react";

import {
  createInitialState,
  getPieceSymbol,
  getLegalMoves,
  getAllLegalMoves,
  getGameStatus,
  applyMove,
  findKing,
} from "./chessLogic";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#1a1310";

const PROMOTION_OPTIONS = [
  { type: "queen", label: "Ratu" },
  { type: "rook", label: "Benteng" },
  { type: "bishop", label: "Gajah" },
  { type: "knight", label: "Kuda" },
];

const PIECE_VALUES = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

function opposite(color) {
  return color === "white" ? "black" : "white";
}

function moveKey(move) {
  return `${move.fromRow},${move.fromCol}-${move.row},${move.col}-${move.promotion ? "p" : ""}-${move.castle || ""}-${move.enPassant ? "ep" : ""}`;
}

function evaluateBoard(state, botColor) {
  const status = getGameStatus(state);

  if (status.gameOver) {
    if (status.winner === botColor) return 1000000;
    if (status.winner === opposite(botColor)) return -1000000;
    return 0;
  }

  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = state.board[row][col];
      if (!piece) continue;

      let value = PIECE_VALUES[piece.type];

      // Sedikit positional bonus supaya bot tidak cuma mengejar nilai bidak.
      const centerDistance = Math.abs(3.5 - row) + Math.abs(3.5 - col);
      const centerBonus =
        piece.type === "pawn" ? Math.max(0, 4 - centerDistance) * 5 : 0;

      value += centerBonus;

      score += piece.color === botColor ? value : -value;
    }
  }

  if (status.check) {
    score += state.turn === botColor ? -35 : 35;
  }

  return score;
}

function orderMoves(state, moves) {
  return [...moves].sort((a, b) => {
    const targetA = state.board[a.row][a.col];
    const targetB = state.board[b.row][b.col];

    const captureA = targetA ? PIECE_VALUES[targetA.type] : 0;
    const captureB = targetB ? PIECE_VALUES[targetB.type] : 0;

    const promotionA = a.promotion ? 800 : 0;
    const promotionB = b.promotion ? 800 : 0;

    const castleA = a.castle ? 40 : 0;
    const castleB = b.castle ? 40 : 0;

    return (
      captureB +
      promotionB +
      castleB -
      (captureA + promotionA + castleA)
    );
  });
}

function minimax(state, depth, botColor, alpha, beta) {
  const status = getGameStatus(state);

  if (depth === 0 || status.gameOver) {
    return evaluateBoard(state, botColor);
  }

  const movingColor = state.turn;
  const moves = orderMoves(
    state,
    getAllLegalMoves(state, movingColor)
  );

  if (moves.length === 0) {
    return evaluateBoard(state, botColor);
  }

  const maximizing = movingColor === botColor;

  if (maximizing) {
    let best = -Infinity;

    for (const move of moves) {
      const next = applyMove(
        state,
        move.fromRow,
        move.fromCol,
        move,
        move.promotion ? "queen" : "queen"
      );

      best = Math.max(
        best,
        minimax(next, depth - 1, botColor, alpha, beta)
      );

      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }

    return best;
  }

  let best = Infinity;

  for (const move of moves) {
    const next = applyMove(
      state,
      move.fromRow,
      move.fromCol,
      move,
      move.promotion ? "queen" : "queen"
    );

    best = Math.min(
      best,
      minimax(next, depth - 1, botColor, alpha, beta)
    );

    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }

  return best;
}

function chooseBotMove(state, botColor, difficulty) {
  const moves = getAllLegalMoves(state, botColor);

  if (!moves.length) return null;

  // EASY: benar-benar santai. Tetap legal, tapi tidak pintar.
  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // MEDIUM: lihat 1 langkah ke depan, lalu pilih beberapa kandidat terbaik.
  if (difficulty === "medium") {
    const scored = moves.map((move) => {
      const next = applyMove(
        state,
        move.fromRow,
        move.fromCol,
        move,
        move.promotion ? "queen" : "queen"
      );

      return {
        move,
        score: minimax(
          next,
          1,
          botColor,
          -Infinity,
          Infinity
        ),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const topCount = Math.min(4, scored.length);
    const candidates = scored.slice(0, topCount);

    return candidates[
      Math.floor(Math.random() * candidates.length)
    ].move;
  }

  // HARD (WNI): minimax + alpha-beta. Tetap lokal dan tanpa ML/API.
  const scored = moves.map((move) => {
    const next = applyMove(
      state,
      move.fromRow,
      move.fromCol,
      move,
      move.promotion ? "queen" : "queen"
    );

    return {
      move,
      score: minimax(
        next,
        2,
        botColor,
        -Infinity,
        Infinity
      ),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // Sedikit variasi hanya di antara langkah yang nilainya sangat dekat,
  // supaya Hard tidak selalu terasa identik.
  const bestScore = scored[0].score;
  const nearBest = scored.filter(
    (item) => bestScore - item.score <= 15
  );

  return nearBest[
    Math.floor(Math.random() * nearBest.length)
  ].move;
}

export function ChessBot({ onBack }) {
  const [screen, setScreen] = useState("setup");
  const [playerColor, setPlayerColor] = useState("white");
  const [difficulty, setDifficulty] = useState("medium");
  const [gameState, setGameState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [botThinking, setBotThinking] = useState(false);
  const [message, setMessage] = useState("");

  const botColor = opposite(playerColor);

  const status = useMemo(() => {
    if (!gameState) {
      return {
        status: "waiting",
        gameOver: false,
        check: false,
        winner: null,
      };
    }

    return getGameStatus(gameState);
  }, [gameState]);

  const validMoves = useMemo(() => {
    if (!gameState || !selected || botThinking) return [];

    if (gameState.turn !== playerColor) return [];

    return getLegalMoves(
      gameState,
      selected.row,
      selected.col
    );
  }, [gameState, selected, playerColor, botThinking]);

  const checkedKing =
    status.check && gameState
      ? findKing(gameState.board, gameState.turn)
      : null;

  function startGame() {
    setGameState(createInitialState());
    setSelected(null);
    setPendingPromotion(null);
    setMessage("");
    setScreen("game");
  }

  function backToSetup() {
    setScreen("setup");
    setGameState(null);
    setSelected(null);
    setPendingPromotion(null);
    setBotThinking(false);
    setMessage("");
  }

  function getStatusText() {
    if (!gameState) return "";

    if (status.status === "checkmate") {
      const winner =
        status.winner === playerColor ? "KAMU" : "BOT";
      return `SKAKMAT! ${winner} MENANG`;
    }

    if (status.status === "stalemate") {
      return "STALEMATE — REMIS";
    }

    if (status.status === "check") {
      const turn =
        gameState.turn === playerColor ? "KAMU" : "BOT";
      return `SKAK! Giliran ${turn}`;
    }

    return gameState.turn === playerColor
      ? "Giliran kamu"
      : "Bot sedang berpikir...";
  }

  function commitPlayerMove(
    move,
    promotionPiece = "queen"
  ) {
    if (!gameState || !selected) return;

    const next = applyMove(
      gameState,
      selected.row,
      selected.col,
      move,
      promotionPiece
    );

    setGameState(next);
    setSelected(null);
    setPendingPromotion(null);
  }

  function handleSquareClick(row, col) {
    if (
      !gameState ||
      status.gameOver ||
      botThinking ||
      pendingPromotion ||
      gameState.turn !== playerColor
    ) {
      return;
    }

    const piece = gameState.board[row][col];

    if (!selected) {
      if (!piece || piece.color !== playerColor) return;

      const moves = getLegalMoves(
        gameState,
        row,
        col
      );

      if (!moves.length) return;

      setSelected({ row, col });
      return;
    }

    if (
      piece &&
      piece.color === playerColor
    ) {
      const moves = getLegalMoves(
        gameState,
        row,
        col
      );

      if (moves.length) {
        setSelected({ row, col });
      }

      return;
    }

    const move = validMoves.find(
      (item) =>
        item.row === row &&
        item.col === col
    );

    if (!move) return;

    if (move.promotion) {
      setPendingPromotion({
        move,
        from: selected,
      });
      return;
    }

    commitPlayerMove(move);
  }

  useEffect(() => {
    if (
      screen !== "game" ||
      !gameState ||
      status.gameOver ||
      gameState.turn !== botColor
    ) {
      return;
    }

    let cancelled = false;

    setBotThinking(true);

    const timer = setTimeout(() => {
      if (cancelled) return;

      const move = chooseBotMove(
        gameState,
        botColor,
        difficulty
      );

      if (!move) {
        setBotThinking(false);
        return;
      }

      const next = applyMove(
        gameState,
        move.fromRow,
        move.fromCol,
        move,
        move.promotion ? "queen" : "queen"
      );

      if (!cancelled) {
        setGameState(next);
        setSelected(null);
        setPendingPromotion(null);
        setBotThinking(false);
      }
    }, difficulty === "easy" ? 450 : difficulty === "medium" ? 700 : 900);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    screen,
    gameState,
    botColor,
    difficulty,
    status.gameOver,
  ]);

  function renderBoard() {
    if (!gameState) return null;

    return (
      <div
        style={{
          width: "90vw",
          maxWidth: "560px",
          aspectRatio: "1 / 1",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(8, 1fr)",
            border: `3px solid ${GOLD}`,
            borderRadius: "4px",
            overflow: "hidden",
            boxSizing: "border-box",
            boxShadow: "0 8px 25px rgba(0,0,0,0.35)",
          }}
        >
          {Array.from({ length: 8 }, (_, displayRow) => {
            const actualRow =
              playerColor === "black"
                ? 7 - displayRow
                : displayRow;

            return Array.from({ length: 8 }, (_, displayCol) => {
              const actualCol =
                playerColor === "black"
                  ? 7 - displayCol
                  : displayCol;

              const piece =
                gameState.board[actualRow][actualCol];

              const isDark =
                (displayRow + displayCol) % 2 === 1;

              const isSelected =
                selected?.row === actualRow &&
                selected?.col === actualCol;

              const isValidMove =
                validMoves.some(
                  (move) =>
                    move.row === actualRow &&
                    move.col === actualCol
                );

              const selectedPiece = selected
                ? gameState.board[selected.row]?.[selected.col]
                : null;

              const hasEnemyPiece = Boolean(
                piece &&
                  selectedPiece &&
                  piece.color !== selectedPiece.color
              );

              const isCheckedKing = Boolean(
                checkedKing &&
                  checkedKing.row === actualRow &&
                  checkedKing.col === actualCol
              );

              return (
                <button
                  key={`${actualRow}-${actualCol}`}
                  type="button"
                  onClick={() =>
                    handleSquareClick(actualRow, actualCol)
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 0,
                    minHeight: 0,
                    border: "none",
                    borderRadius: 0,
                    padding: 0,
                    margin: 0,
                    background: isCheckedKing
                      ? "#b33a3a"
                      : isSelected
                      ? GOLD
                      : isDark
                      ? "#8B6F47"
                      : "#F0D9B5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor:
                      status.gameOver || botThinking
                        ? "default"
                        : "pointer",
                    userSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                    boxSizing: "border-box",
                    position: "relative",
                  }}
                >
                  {isValidMove && (
                    <span
                      style={{
                        position: "absolute",
                        width: hasEnemyPiece ? "78%" : "22%",
                        height: hasEnemyPiece ? "78%" : "22%",
                        borderRadius: "50%",
                        border: hasEnemyPiece
                          ? "3px solid rgba(20,15,10,0.55)"
                          : "none",
                        background: hasEnemyPiece
                          ? "transparent"
                          : "rgba(20,15,10,0.38)",
                        boxSizing: "border-box",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {piece && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "clamp(30px, 7vw, 58px)",
                        lineHeight: 1,
                        transform: "translateY(-1px)",
                        color:
                          piece.color === "white"
                            ? "#ffffff"
                            : "#111111",
                        textShadow:
                          piece.color === "white"
                            ? "0 1px 2px rgba(0,0,0,0.8)"
                            : "0 1px 1px rgba(255,255,255,0.8)",
                        pointerEvents: "none",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                </button>
              );
            });
          })}
        </div>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: BG,
          color: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          boxSizing: "border-box",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(201,162,39,0.35)",
            borderRadius: "16px",
            padding: "24px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: "34px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            ♟ VS Bot
          </div>

          <div
            style={{
              fontSize: "14px",
              opacity: 0.75,
              marginBottom: "20px",
            }}
          >
            Pilih warna dan tingkat kesulitan bot.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <button
              type="button"
              onClick={() => setPlayerColor("white")}
              style={{
                padding: "14px",
                borderRadius: "9px",
                border:
                  playerColor === "white"
                    ? `2px solid ${GOLD}`
                    : "1px solid rgba(201,162,39,0.35)",
                background:
                  playerColor === "white"
                    ? "#e9ddc4"
                    : "rgba(255,255,255,0.06)",
                color:
                  playerColor === "white"
                    ? "#17100c"
                    : CREAM,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ♔ Putih
            </button>

            <button
              type="button"
              onClick={() => setPlayerColor("black")}
              style={{
                padding: "14px",
                borderRadius: "9px",
                border:
                  playerColor === "black"
                    ? `2px solid ${GOLD}`
                    : "1px solid rgba(201,162,39,0.35)",
                background:
                  playerColor === "black"
                    ? GOLD
                    : "rgba(255,255,255,0.06)",
                color: "#17100c",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ♜ Hitam
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            {[
              ["easy", "Easy"],
              ["medium", "Medium"],
              ["hard", "Hard (WNI)"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDifficulty(value)}
                style={{
                  padding: "12px 6px",
                  borderRadius: "9px",
                  border:
                    difficulty === value
                      ? `2px solid ${GOLD}`
                      : "1px solid rgba(201,162,39,0.35)",
                  background:
                    difficulty === value
                      ? "rgba(201,162,39,0.2)"
                      : "rgba(255,255,255,0.06)",
                  color: CREAM,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={startGame}
            style={{
              width: "100%",
              padding: "13px 16px",
              border: "none",
              borderRadius: "9px",
              background: GOLD,
              color: "#17100c",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            Mulai VS Bot
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{
              marginTop: "12px",
              background: "transparent",
              color: CREAM,
              border: `1px solid ${GOLD}`,
              borderRadius: "9px",
              padding: "10px 15px",
              cursor: "pointer",
            }}
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: BG,
        color: CREAM,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 10px 28px",
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "90vw",
          maxWidth: "560px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            color: GOLD,
            fontFamily: "Georgia, serif",
            fontSize: "24px",
            fontWeight: 700,
          }}
        >
          ♟ VS Bot
        </div>

        <div
          style={{
            fontSize: "12px",
            opacity: 0.75,
            textAlign: "right",
          }}
        >
          {playerColor === "white" ? "Kamu: Putih" : "Kamu: Hitam"}
          <br />
          Bot: {difficulty === "hard" ? "Hard (WNI)" : difficulty}
        </div>
      </div>

      {renderBoard()}

      {pendingPromotion && (
        <div
          style={{
            width: "90vw",
            maxWidth: "560px",
            marginTop: "16px",
            padding: "14px",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)",
            border: `1px solid rgba(201,162,39,0.5)`,
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Pilih promosi pion:
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
            }}
          >
            {PROMOTION_OPTIONS.map((option) => {
              const movingPiece =
                gameState.board[pendingPromotion.from.row][
                  pendingPromotion.from.col
                ];

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() =>
                    commitPlayerMove(
                      pendingPromotion.move,
                      option.type
                    )
                  }
                  style={{
                    minHeight: "70px",
                    background: "rgba(255,255,255,0.08)",
                    color: CREAM,
                    border: `1px solid ${GOLD}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: "32px" }}>
                    {getPieceSymbol({
                      type: option.type,
                      color: movingPiece.color,
                    })}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      marginTop: "3px",
                    }}
                  >
                    {option.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "14px",
          textAlign: "center",
          fontSize: "13px",
          opacity: 0.85,
          minHeight: "20px",
        }}
      >
        {getStatusText()}
      </div>

      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={backToSetup}
          style={{
            background: GOLD,
            color: "#17100c",
            border: "none",
            borderRadius: "8px",
            padding: "11px 17px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ganti Mode
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: CREAM,
            border: `1px solid ${GOLD}`,
            borderRadius: "8px",
            padding: "11px 17px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Game Hub
        </button>
      </div>
    </div>
  );
}
