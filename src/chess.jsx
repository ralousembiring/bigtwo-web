import React, { useMemo, useState } from "react";

import {
  createInitialState,
  getPieceSymbol,
  getLegalMoves,
  getGameStatus,
  applyMove,
  findKing,
  isKingInCheck,
} from "./chessLogic";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#1a1310";

const PROMOTION_OPTIONS = [
  {
    type: "queen",
    label: "Ratu",
  },
  {
    type: "rook",
    label: "Benteng",
  },
  {
    type: "bishop",
    label: "Gajah",
  },
  {
    type: "knight",
    label: "Kuda",
  },
];

export function Chess() {
  const [gameState, setGameState] =
    useState(() =>
      createInitialState()
    );

  const [selected, setSelected] =
    useState(null);

  const [pendingPromotion, setPendingPromotion] =
    useState(null);

  const status = useMemo(
    () => getGameStatus(gameState),
    [gameState]
  );

  const validMoves = useMemo(() => {
    if (!selected) return [];

    return getLegalMoves(
      gameState,
      selected.row,
      selected.col
    );
  }, [gameState, selected]);

  // Beberapa posisi bisa sudah terdeteksi sebagai "check",
  // tetapi status dari logic lama belum memberi label checkmate.
  // Cek langsung apakah pemain yang sedang kena skak masih punya
  // SATU pun langkah legal. Kalau tidak ada, berarti checkmate.
  const hasAnyLegalMove = useMemo(() => {
    for (let row = 0; row < gameState.board.length; row++) {
      for (let col = 0; col < gameState.board[row].length; col++) {
        const piece = gameState.board[row][col];

        if (!piece || piece.color !== gameState.turn) {
          continue;
        }

        if (getLegalMoves(gameState, row, col).length > 0) {
          return true;
        }
      }
    }

    return false;
  }, [gameState]);

  const isCheckmate =
    status.status === "checkmate" ||
    (status.status === "check" && !hasAnyLegalMove);

  function getStatusText() {
    if (isCheckmate) {
      const winner =
        gameState.turn === "white"
          ? "Hitam"
          : "Putih";

      return `SKAKMAT! ${winner} menang`;
    }

    if (status.status === "stalemate") {
      return "STALEMATE — REMIS";
    }

    if (status.status === "check") {
      const turn =
        gameState.turn === "white"
          ? "Putih"
          : "Hitam";

      return `SKAK! Giliran ${turn}`;
    }

    return gameState.turn === "white"
      ? "Giliran Putih"
      : "Giliran Hitam";
  }

  function executeMove(
    move,
    promotionPiece = "queen"
  ) {
    if (!selected) return;

    const newState = applyMove(
      gameState,
      selected.row,
      selected.col,
      move,
      promotionPiece
    );

    setGameState(newState);
    setSelected(null);
    setPendingPromotion(null);
  }

  function handleSquareClick(
    row,
    col
  ) {
    // Game selesai
    if (status.gameOver) {
      return;
    }

    // Sedang memilih promosi
    if (pendingPromotion) {
      return;
    }

    const piece =
      gameState.board[row][col];

    // ====================================
    // BELUM MEMILIH BIDAK
    // ====================================

    if (!selected) {
      if (!piece) return;

      if (
        piece.color !==
        gameState.turn
      ) {
        return;
      }

      const moves = getLegalMoves(
        gameState,
        row,
        col
      );

      // Tidak ada langkah legal
      if (moves.length === 0) {
        return;
      }

      setSelected({
        row,
        col,
      });

      return;
    }

    // ====================================
    // KLIK BIDAK SENDIRI
    // ====================================

    if (
      piece &&
      piece.color ===
        gameState.turn
    ) {
      const moves = getLegalMoves(
        gameState,
        row,
        col
      );

      if (moves.length > 0) {
        setSelected({
          row,
          col,
        });
      }

      return;
    }

    // ====================================
    // CARI LANGKAH YANG DIPILIH
    // ====================================

    const move =
      validMoves.find(
        (item) =>
          item.row === row &&
          item.col === col
      );

    if (!move) {
      return;
    }

    // ====================================
    // PROMOTION
    // ====================================

    if (move.promotion) {
      setPendingPromotion({
        move,
        from: selected,
      });

      return;
    }

    // ====================================
    // JALANKAN MOVE
    // ====================================

    executeMove(move);
  }

  function resetGame() {
    setGameState(
      createInitialState()
    );

    setSelected(null);
    setPendingPromotion(null);
  }

  const checkedKing =
    status.check
      ? findKing(
          gameState.board,
          gameState.turn
        )
      : null;

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: BG,
        color: CREAM,
        boxSizing: "border-box",
        padding:
          "clamp(12px, 3vw, 28px) 12px 24px",
        overflowX: "hidden",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "580px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              color: GOLD,
              fontFamily:
                "Georgia, serif",
              fontSize:
                "clamp(28px, 5vw, 40px)",
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            ♟ Chess
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize:
                "clamp(15px, 3vw, 19px)",
              fontWeight: 700,

              color:
                isCheckmate
                  ? "#ff6b6b"
                  : status.status === "check"
                  ? "#ffb347"
                  : CREAM,
            }}
          >
            {getStatusText()}
          </div>
        </div>

        {/* BOARD */}

        <div
          style={{
            width: "90vw",
            maxWidth: "560px",
            aspectRatio: "1 / 1",
            margin: "0 auto",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              gridTemplateColumns:
                "repeat(8, 1fr)",
              gridTemplateRows:
                "repeat(8, 1fr)",
              border: `3px solid ${GOLD}`,
              borderRadius: "4px",
              overflow: "hidden",
              boxSizing: "border-box",
              boxShadow:
                "0 8px 25px rgba(0,0,0,0.35)",
            }}
          >
            {gameState.board.map(
              (row, rowIndex) =>
                row.map(
                  (
                    piece,
                    colIndex
                  ) => {
                    const isDark =
                      (rowIndex +
                        colIndex) %
                        2 ===
                      1;

                    const isSelected =
                      selected?.row ===
                        rowIndex &&
                      selected?.col ===
                        colIndex;

                    const isValidMove =
                      validMoves.some(
                        (move) =>
                          move.row ===
                            rowIndex &&
                          move.col ===
                            colIndex
                      );

                    const hasEnemyPiece =
                      piece &&
                      selected &&
                      piece.color !==
                        gameState
                          .board[
                          selected.row
                        ][
                          selected.col
                        ]?.color;

                    const isCheckedKing =
                      checkedKing &&
                      checkedKing.row ===
                        rowIndex &&
                      checkedKing.col ===
                        colIndex;

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        onClick={() =>
                          handleSquareClick(
                            rowIndex,
                            colIndex
                          )
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

                          background:
                            isCheckedKing
                              ? "#b33a3a"
                              : isSelected
                              ? GOLD
                              : isDark
                              ? "#8B6F47"
                              : "#F0D9B5",

                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",

                          cursor:
                            status.gameOver ||
                            pendingPromotion
                              ? "default"
                              : "pointer",

                          userSelect:
                            "none",

                          WebkitTapHighlightColor:
                            "transparent",

                          boxSizing:
                            "border-box",

                          position:
                            "relative",
                        }}
                      >
                        {/* PIECE */}

                        {piece && (
                          <span
                            style={{
                              display:
                                "block",

                              fontSize:
                                "clamp(30px, 7vw, 58px)",

                              lineHeight: 1,

                              transform:
                                "translateY(-1px)",

                              color:
                                piece.color ===
                                "white"
                                  ? "#ffffff"
                                  : "#111111",

                              textShadow:
                                piece.color ===
                                "white"
                                  ? "0 1px 2px rgba(0,0,0,0.8)"
                                  : "0 1px 1px rgba(255,255,255,0.8)",

                              pointerEvents:
                                "none",

                              position:
                                "relative",

                              zIndex: 2,
                            }}
                          >
                            {getPieceSymbol(
                              piece
                            )}
                          </span>
                        )}

                        {/* MOVE DOT */}

                        {isValidMove && (
                          <span
                            style={{
                              position:
                                "absolute",

                              width:
                                hasEnemyPiece
                                  ? "78%"
                                  : "24%",

                              height:
                                hasEnemyPiece
                                  ? "78%"
                                  : "24%",

                              borderRadius:
                                "50%",

                              background:
                                hasEnemyPiece
                                  ? "rgba(190,40,40,0.35)"
                                  : "rgba(30,30,30,0.35)",

                              pointerEvents:
                                "none",

                              zIndex: 1,
                            }}
                          />
                        )}
                      </button>
                    );
                  }
                )
            )}
          </div>
        </div>

        {/* PROMOTION MENU */}

        {pendingPromotion && (
          <div
            style={{
              width: "90vw",
              maxWidth: "560px",
              marginTop: "16px",
              padding: "14px",
              boxSizing: "border-box",

              background:
                "rgba(255,255,255,0.06)",

              border:
                `1px solid rgba(201,162,39,0.5)`,

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
                gridTemplateColumns:
                  "repeat(4, 1fr)",
                gap: "8px",
              }}
            >
              {PROMOTION_OPTIONS.map(
                (option) => {
                  const movingPiece =
                    gameState.board[
                      pendingPromotion
                        .from.row
                    ][
                      pendingPromotion
                        .from.col
                    ];

                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() =>
                        executeMove(
                          pendingPromotion.move,
                          option.type
                        )
                      }
                      style={{
                        minHeight: "70px",
                        background:
                          "rgba(255,255,255,0.08)",
                        color: CREAM,
                        border:
                          `1px solid ${GOLD}`,
                        borderRadius:
                          "8px",
                        cursor:
                          "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "32px",
                        }}
                      >
                        {getPieceSymbol({
                          type:
                            option.type,
                          color:
                            movingPiece.color,
                        })}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "11px",
                          marginTop:
                            "3px",
                        }}
                      >
                        {option.label}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* BUTTONS */}

        <div
          style={{
            width: "90vw",
            maxWidth: "560px",
            marginTop: "18px",
            display: "flex",
            justifyContent:
              "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={resetGame}
            style={{
              background: GOLD,
              color: "#17100c",
              border: "none",
              borderRadius: "8px",
              padding:
                "11px 17px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              minHeight: "42px",
            }}
          >
            Reset Chess
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                window.location.pathname;
            }}
            style={{
              background:
                "transparent",
              color: CREAM,
              border:
                `1px solid ${GOLD}`,
              borderRadius: "8px",
              padding:
                "11px 17px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              minHeight: "42px",
            }}
          >
            ← Kembali ke Game Hub
          </button>
        </div>

        <div
          style={{
            marginTop: "14px",
            textAlign: "center",
            fontSize: "12px",
            lineHeight: 1.5,
            opacity: 0.55,
            maxWidth: "560px",
          }}
        >
          Chess lokal — multiplayer
          Firebase akan ditambahkan
          setelah aturan permainan
          selesai diuji.
        </div>
      </div>
    </div>
  );
}