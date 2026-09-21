import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  get,
  onValue,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";

import { db } from "./firebase";

import {
  createInitialState,
  getPieceSymbol,
  getLegalMoves,
  getGameStatus,
  applyMove,
  findKing,
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

function generateRoomCode() {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

function getPlayerId() {
  try {
    const key =
      "rgamehub_chess_player_id";

    let id = sessionStorage.getItem(key);

    if (!id) {
      id =
        "player_" +
        Math.random()
          .toString(36)
          .substring(2) +
        Date.now().toString(36);

      sessionStorage.setItem(
        key,
        id
      );
    }

    return id;
  } catch {
    return (
      "player_" +
      Math.random()
        .toString(36)
        .substring(2) +
      Date.now().toString(36)
    );
  }
}

function normalizeBoard(board) {
  if (!board) return null;

  const result = [];

  for (let row = 0; row < 8; row++) {
    const sourceRow =
      Array.isArray(board)
        ? board[row]
        : board[String(row)];

    const newRow = [];

    for (let col = 0; col < 8; col++) {
      let value = null;

      if (Array.isArray(sourceRow)) {
        value =
          sourceRow[col] ?? null;
      } else if (sourceRow) {
        value =
          sourceRow[String(col)] ??
          null;
      }

      newRow.push(value);
    }

    result.push(newRow);
  }

  if (
    result.length !== 8 ||
    !result.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 8
    )
  ) {
    return null;
  }

  return result;
}

function normalizeGameState(state) {
  if (!state) return null;

  const board = normalizeBoard(
    state.board
  );

  if (!board) return null;

  return {
    ...state,
    board,
  };
}

export function Chess() {
  const [playerId] = useState(() =>
    getPlayerId()
  );

  const [roomId, setRoomId] =
    useState(() => {
      const params =
        new URLSearchParams(
          window.location.search
        );

      return (
        params.get("room") || null
      );
    });

  const [roomInput, setRoomInput] =
    useState(() => {
      const params =
        new URLSearchParams(
          window.location.search
        );

      return (
        params.get("room") || ""
      );
    });

  const [roomData, setRoomData] =
    useState(null);

  const [gameState, setGameState] =
    useState(null);

  const [selected, setSelected] =
    useState(null);

  const [
    pendingPromotion,
    setPendingPromotion,
  ] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // =========================================
  // FIREBASE ROOM LISTENER
  // =========================================

  useEffect(() => {
    if (!roomId) {
      setRoomData(null);
      setGameState(null);
      return;
    }

    setLoading(true);

    const roomRef = ref(
      db,
      `chessRooms/${roomId}`
    );

    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRoomData(null);
          setGameState(null);
          setLoading(false);
          setMessage(
            "Room tidak ditemukan."
          );
          return;
        }

        const data = snapshot.val();

        setRoomData(data);

        if (
          data?.game?.started ===
            true &&
          data?.game?.state
        ) {
          const normalized =
            normalizeGameState(
              data.game.state
            );

          setGameState(normalized);
        } else {
          setGameState(null);
          setSelected(null);
          setPendingPromotion(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          "Chess room listener error:",
          error
        );

        setLoading(false);

        setMessage(
          "Gagal membaca room."
        );
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  // =========================================
  // URL
  // =========================================

  function openRoomInUrl(code) {
    const newUrl =
      `${window.location.pathname}` +
      `?game=chess&room=${code}`;

    window.history.replaceState(
      {},
      "",
      newUrl
    );
  }

  // =========================================
  // CREATE ROOM
  // =========================================

  async function createRoom() {
    setLoading(true);
    setMessage("");

    try {
      let code =
        generateRoomCode();

      let roomRef = ref(
        db,
        `chessRooms/${code}`
      );

      let snapshot =
        await get(roomRef);

      if (snapshot.exists()) {
        code =
          generateRoomCode();

        roomRef = ref(
          db,
          `chessRooms/${code}`
        );

        snapshot =
          await get(roomRef);
      }

      await set(roomRef, {
        host: playerId,

        players: {
          white: null,
          black: null,
        },

        game: {
          started: false,
          state: null,
        },

        createdAt: Date.now(),
      });

      setRoomId(code);
      setRoomInput(code);

      openRoomInUrl(code);

      setMessage(
        "Room berhasil dibuat."
      );
    } catch (error) {
      console.error(
        "Create room error:",
        error
      );

      setMessage(
        "Gagal membuat room."
      );
    }

    setLoading(false);
  }

  // =========================================
  // JOIN ROOM
  // =========================================

  async function joinRoom() {
    const code =
      roomInput
        .trim()
        .toUpperCase();

    if (!code) {
      setMessage(
        "Masukkan kode room dulu."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const roomRef = ref(
        db,
        `chessRooms/${code}`
      );

      const snapshot =
        await get(roomRef);

      if (!snapshot.exists()) {
        setMessage(
          "Room tidak ditemukan."
        );

        setLoading(false);
        return;
      }

      setRoomId(code);
      setRoomInput(code);

      openRoomInUrl(code);
    } catch (error) {
      console.error(
        "Join room error:",
        error
      );

      setMessage(
        "Gagal masuk ke room."
      );
    }

    setLoading(false);
  }

  // =========================================
  // LEAVE ROOM
  // =========================================

  function leaveRoom() {
    setRoomId(null);
    setRoomData(null);
    setGameState(null);
    setSelected(null);
    setPendingPromotion(null);
    setMessage("");

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?game=chess`
    );
  }

  // =========================================
  // MY COLOR
  // =========================================

  const myColor = useMemo(() => {
    if (!roomData?.players) {
      return null;
    }

    if (
      roomData.players.white?.id ===
      playerId
    ) {
      return "white";
    }

    if (
      roomData.players.black?.id ===
      playerId
    ) {
      return "black";
    }

    return null;
  }, [roomData, playerId]);

  // =========================================
  // TAKE SEAT
  // =========================================

  async function takeSeat(color) {
    if (!roomId || !roomData) {
      return;
    }

    if (roomData.game?.started) {
      setMessage(
        "Game sudah dimulai."
      );
      return;
    }

    const currentSeat =
      roomData.players?.[color];

    if (
      currentSeat &&
      currentSeat.id !== playerId
    ) {
      setMessage(
        "Kursi ini sudah ditempati."
      );
      return;
    }

    try {
      const roomRef = ref(
        db,
        `chessRooms/${roomId}`
      );

      const updates = {};

      if (
        roomData.players?.white
          ?.id === playerId
      ) {
        updates[
          "players/white"
        ] = null;
      }

      if (
        roomData.players?.black
          ?.id === playerId
      ) {
        updates[
          "players/black"
        ] = null;
      }

      updates[
        `players/${color}`
      ] = {
        id: playerId,
        joinedAt: Date.now(),
      };

      await update(
        roomRef,
        updates
      );

      setMessage(
        color === "white"
          ? "Lu duduk sebagai PUTIH."
          : "Lu duduk sebagai HITAM."
      );
    } catch (error) {
      console.error(
        "Take seat error:",
        error
      );

      setMessage(
        "Gagal memilih kursi."
      );
    }
  }

  // =========================================
  // LEAVE SEAT
  // =========================================

  async function leaveSeat() {
    if (!roomId || !myColor) {
      return;
    }

    if (roomData?.game?.started) {
      setMessage(
        "Game sudah dimulai."
      );
      return;
    }

    try {
      await set(
        ref(
          db,
          `chessRooms/${roomId}/players/${myColor}`
        ),
        null
      );

      setMessage(
        "Lu meninggalkan kursi."
      );
    } catch (error) {
      console.error(
        "Leave seat error:",
        error
      );

      setMessage(
        "Gagal meninggalkan kursi."
      );
    }
  }

  // =========================================
  // START GAME
  // =========================================

  async function startGame() {
    if (!roomId || !roomData) {
      return;
    }

    if (roomData.host !== playerId) {
      setMessage(
        "Hanya host yang bisa memulai game."
      );
      return;
    }

    if (
      !roomData.players?.white ||
      !roomData.players?.black
    ) {
      setMessage(
        "PUTIH dan HITAM harus terisi dulu."
      );
      return;
    }

    if (roomData.game?.started) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const initialState =
        createInitialState();

      await update(
        ref(
          db,
          `chessRooms/${roomId}`
        ),
        {
          "game/started": true,
          "game/state":
            initialState,
        }
      );

      setMessage(
        "Game dimulai!"
      );
    } catch (error) {
      console.error(
        "Start game error:",
        error
      );

      setMessage(
        "Gagal memulai game."
      );
    }

    setLoading(false);
  }

  // =========================================
  // STATUS
  // =========================================

  const status = useMemo(() => {
    if (
      !roomData?.game?.started
    ) {
      return {
        status: "waiting",
        gameOver: false,
        check: false,
        winner: null,
      };
    }

    if (!gameState) {
      return {
        status: "waiting",
        gameOver: false,
        check: false,
        winner: null,
      };
    }

    const board =
      gameState.board;

    const validBoard =
      Array.isArray(board) &&
      board.length === 8 &&
      board.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 8
      );

    if (!validBoard) {
      return {
        status: "waiting",
        gameOver: false,
        check: false,
        winner: null,
      };
    }

    return getGameStatus(
      gameState
    );
  }, [
    gameState,
    roomData?.game?.started,
  ]);

  // =========================================
  // VALID MOVES
  // =========================================

  const validMoves = useMemo(() => {
    if (
      !gameState ||
      !selected ||
      !myColor
    ) {
      return [];
    }

    if (
      gameState.turn !== myColor
    ) {
      return [];
    }

    return getLegalMoves(
      gameState,
      selected.row,
      selected.col
    );
  }, [
    gameState,
    selected,
    myColor,
  ]);

  // =========================================
  // STATUS TEXT
  // =========================================

  function getStatusText() {
    if (!roomData?.game?.started) {
      return "Menunggu pemain...";
    }

    if (!gameState) {
      return "Memuat game...";
    }

    if (
      status.status ===
      "checkmate"
    ) {
      const winner =
        status.winner === "white"
          ? "Putih"
          : "Hitam";

      return `SKAKMAT! ${winner} menang`;
    }

    if (
      status.status ===
      "stalemate"
    ) {
      return "STALEMATE — REMIS";
    }

    if (
      status.status === "check"
    ) {
      const turn =
        gameState.turn ===
        "white"
          ? "Putih"
          : "Hitam";

      return `SKAK! Giliran ${turn}`;
    }

    return gameState.turn ===
      "white"
      ? "Giliran Putih"
      : "Giliran Hitam";
  }

  // =========================================
  // EXECUTE MOVE
  // =========================================

  async function executeMove(
    move,
    promotionPiece = "queen"
  ) {
    if (
      !selected ||
      !roomId ||
      !gameState ||
      !myColor
    ) {
      return;
    }

    if (
      gameState.turn !== myColor
    ) {
      setMessage(
        "Bukan giliran lu."
      );
      return;
    }

    const fromRow =
      selected.row;

    const fromCol =
      selected.col;

    setSelected(null);
    setPendingPromotion(null);

    try {
      const gameRef = ref(
        db,
        `chessRooms/${roomId}/game/state`
      );

      await runTransaction(
        gameRef,
        (currentState) => {
          const current =
            normalizeGameState(
              currentState
            );

          if (!current) {
            return;
          }

          if (
            current.turn !==
            myColor
          ) {
            return;
          }

          const legalMoves =
            getLegalMoves(
              current,
              fromRow,
              fromCol
            );

          const legal = legalMoves.some(
            (item) =>
              item.row ===
                move.row &&
              item.col ===
                move.col &&
              Boolean(
                item.promotion
              ) ===
                Boolean(
                  move.promotion
                )
          );

          if (!legal) {
            return;
          }

          return applyMove(
            current,
            fromRow,
            fromCol,
            move,
            promotionPiece
          );
        }
      );
    } catch (error) {
      console.error(
        "Move error:",
        error
      );

      setMessage(
        "Gagal menjalankan langkah."
      );
    }
  }

  // =========================================
  // CLICK SQUARE
  // =========================================

  function handleSquareClick(
    row,
    col
  ) {
    if (
      !roomData?.game?.started ||
      !gameState
    ) {
      return;
    }

    if (status.gameOver) {
      return;
    }

    if (pendingPromotion) {
      return;
    }

    if (
      gameState.turn !== myColor
    ) {
      setMessage(
        "Bukan giliran lu."
      );
      return;
    }

    const piece =
      gameState.board[row][col];

    // BELUM PILIH BIDAK
    if (!selected) {
      if (!piece) {
        return;
      }

      if (
        piece.color !== myColor
      ) {
        return;
      }

      const moves =
        getLegalMoves(
          gameState,
          row,
          col
        );

      if (moves.length === 0) {
        return;
      }

      setSelected({
        row,
        col,
      });

      return;
    }

    // KLIK BIDAK SENDIRI
    if (
      piece &&
      piece.color === myColor
    ) {
      const moves =
        getLegalMoves(
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

    // CARI MOVE
    const move =
      validMoves.find(
        (item) =>
          item.row === row &&
          item.col === col
      );

    if (!move) {
      return;
    }

    // PROMOTION
    if (move.promotion) {
      setPendingPromotion({
        move,
        from: selected,
      });

      return;
    }

    executeMove(move);
  }

  // =========================================
  // RESET
  // =========================================

  async function resetGame() {
    if (!roomId) {
      return;
    }

    if (
      roomData?.host !== playerId
    ) {
      setMessage(
        "Hanya host yang bisa reset game."
      );
      return;
    }

    try {
      await update(
        ref(
          db,
          `chessRooms/${roomId}/game`
        ),
        {
          started: false,
          state: null,
        }
      );

      setSelected(null);
      setPendingPromotion(null);

      setMessage(
        "Game di-reset. Pilih kursi lagi untuk memulai."
      );
    } catch (error) {
      console.error(
        "Reset error:",
        error
      );

      setMessage(
        "Gagal reset game."
      );
    }
  }

  // =========================================
  // CHECKED KING
  // =========================================

  const checkedKing =
    status.check &&
    gameState
      ? findKing(
          gameState.board,
          gameState.turn
        )
      : null;

  // =========================================
  // NO ROOM
  // =========================================

  if (!roomId) {
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
          fontFamily:
            "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            background:
              "rgba(255,255,255,0.06)",
            border:
              "1px solid rgba(201,162,39,0.35)",
            borderRadius: "16px",
            padding: "24px",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: GOLD,
              fontFamily:
                "Georgia, serif",
              fontSize: "34px",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            ♟ Chess
          </div>

          <div
            style={{
              fontSize: "14px",
              opacity: 0.75,
              marginBottom: "20px",
              lineHeight: 1.5,
            }}
          >
            Masukkan kode room
            untuk bermain dengan
            teman, atau buat room
            baru.
          </div>

          <input
            value={roomInput}
            onChange={(e) =>
              setRoomInput(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                if (
                  roomInput.trim()
                ) {
                  joinRoom();
                } else {
                  createRoom();
                }
              }
            }}
            placeholder="Kode room"
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              padding:
                "13px 14px",
              borderRadius: "9px",
              border:
                `1px solid ${GOLD}`,
              background:
                "rgba(0,0,0,0.25)",
              color: CREAM,
              outline: "none",
              textAlign: "center",
              textTransform:
                "uppercase",
              fontSize: "16px",
              marginBottom: "12px",
            }}
          />

          <button
            type="button"
            onClick={
              roomInput.trim()
                ? joinRoom
                : createRoom
            }
            disabled={loading}
            style={{
              width: "100%",
              padding:
                "13px 16px",
              border: "none",
              borderRadius: "9px",
              background: GOLD,
              color: "#17100c",
              fontWeight: 700,
              fontSize: "15px",
              cursor: loading
                ? "wait"
                : "pointer",
            }}
          >
            {loading
              ? "Memproses..."
              : roomInput.trim()
              ? "Gabung Room"
              : "Buat Room Baru"}
          </button>

          {message && (
            <div
              style={{
                marginTop: "14px",
                fontSize: "13px",
                color: "#ffd98a",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              window.location.href =
                window.location.pathname;
            }}
            style={{
              marginTop: "14px",
              background:
                "transparent",
              color: CREAM,
              border:
                `1px solid ${GOLD}`,
              borderRadius: "9px",
              padding:
                "10px 15px",
              cursor: "pointer",
            }}
          >
            ← Kembali ke Game Hub
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // ROOM NOT FOUND / LOADING
  // =========================================

  if (
    loading &&
    !roomData
  ) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: BG,
          color: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, sans-serif",
        }}
      >
        Memuat room...
      </div>
    );
  }

  if (!roomData) {
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
          fontFamily:
            "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: GOLD,
              fontSize: "26px",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Room tidak ditemukan
          </div>

          <button
            type="button"
            onClick={leaveRoom}
            style={{
              background: GOLD,
              border: "none",
              borderRadius: "8px",
              padding:
                "11px 18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // GAME STARTED
  // =========================================

  const gameStarted =
    roomData.game?.started ===
    true;

  // =========================================
  // BOARD
  // =========================================

  function renderBoard() {
    if (!gameState) {
      return null;
    }

    return (
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
            border:
              `3px solid ${GOLD}`,
            borderRadius: "4px",
            overflow: "hidden",
            boxSizing: "border-box",
            boxShadow:
              "0 8px 25px rgba(0,0,0,0.35)",
          }}
        >
          {Array.from(
            { length: 8 },
            (_, displayRow) => {
              const actualRow =
                myColor === "black"
                  ? 7 - displayRow
                  : displayRow;

              return Array.from(
                { length: 8 },
                (_, displayCol) => {
                  const actualCol =
                    myColor === "black"
                      ? 7 - displayCol
                      : displayCol;

                  const piece =
                    gameState.board[
                      actualRow
                    ][actualCol];

                  const isDark =
                    (displayRow +
                      displayCol) %
                      2 ===
                    1;

                  const isSelected =
                    selected?.row ===
                      actualRow &&
                    selected?.col ===
                      actualCol;

                  const isValidMove =
                    validMoves.some(
                      (move) =>
                        move.row ===
                          actualRow &&
                        move.col ===
                          actualCol
                    );

                  const selectedPiece =
                    selected
                      ? gameState
                          .board[
                          selected.row
                        ]?.[
                          selected.col
                        ]
                      : null;

                  const hasEnemyPiece =
                    Boolean(
                      piece &&
                        selectedPiece &&
                        piece.color !==
                          selectedPiece.color
                    );

                  const isCheckedKing =
                    Boolean(
                      checkedKing &&
                        checkedKing.row ===
                          actualRow &&
                        checkedKing.col ===
                          actualCol
                    );

                  return (
                    <button
                      key={`${actualRow}-${actualCol}`}
                      type="button"
                      onClick={() =>
                        handleSquareClick(
                          actualRow,
                          actualCol
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
              );
            }
          )}
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN UI
  // =========================================

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
          maxWidth: "620px",
          margin: "0 auto",
          display: "flex",
          flexDirection:
            "column",
          alignItems: "center",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "12px",
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

          {gameStarted && (
            <div
              style={{
                marginTop: "6px",
                fontSize:
                  "clamp(15px, 3vw, 19px)",
                fontWeight: 700,
                color:
                  status.status ===
                  "checkmate"
                    ? "#ff6b6b"
                    : status.status ===
                      "check"
                    ? "#ffb347"
                    : CREAM,
              }}
            >
              {getStatusText()}
            </div>
          )}
        </div>

        {/* ROOM BAR */}

        <div
          style={{
            width: "90vw",
            maxWidth: "680px",
            display: "grid",
            gridTemplateColumns:
              "1fr auto 1fr",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              justifySelf:
                "start",
            }}
          >
            <button
              type="button"
              onClick={() =>
                !gameStarted &&
                takeSeat("white")
              }
              style={{
                background:
                  myColor === "white"
                    ? "#2c2521"
                    : "rgba(255,255,255,0.06)",
                color: CREAM,
                border: "none",
                borderRadius: "9px",
                padding:
                  "9px 13px",
                fontWeight: 700,
                cursor:
                  gameStarted
                    ? "default"
                    : "pointer",
                opacity:
                  roomData.players
                    ?.white &&
                  myColor !==
                    "white"
                    ? 0.5
                    : 1,
              }}
            >
              ♔ PUTIH
            </button>
          </div>

          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              opacity: 0.65,
              whiteSpace:
                "nowrap",
            }}
          >
            ROOM {roomId}
          </div>

          <div
            style={{
              justifySelf:
                "end",
            }}
          >
            <button
              type="button"
              onClick={() =>
                !gameStarted &&
                takeSeat("black")
              }
              style={{
                background:
                  myColor === "black"
                    ? GOLD
                    : "rgba(255,255,255,0.06)",
                color:
                  myColor === "black"
                    ? "#17100c"
                    : CREAM,
                border: "none",
                borderRadius: "9px",
                padding:
                  "9px 13px",
                fontWeight: 700,
                cursor:
                  gameStarted
                    ? "default"
                    : "pointer",
                opacity:
                  roomData.players
                    ?.black &&
                  myColor !==
                    "black"
                    ? 0.5
                    : 1,
              }}
            >
              ♜ HITAM
              {myColor ===
                "black" &&
                " • LU"}
            </button>
          </div>
        </div>

        {/* LOBBY */}

        {!gameStarted && (
          <div
            style={{
              width: "90vw",
              maxWidth: "560px",
              background:
                "rgba(255,255,255,0.06)",
              border:
                "1px solid rgba(201,162,39,0.3)",
              borderRadius: "14px",
              padding: "16px",
              boxSizing:
                "border-box",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                textAlign:
                  "center",
                fontWeight: 700,
                marginBottom:
                  "12px",
              }}
            >
              Lobby Chess
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "10px",
              }}
            >
              <div
                style={{
                  background:
                    "rgba(255,255,255,0.05)",
                  borderRadius:
                    "10px",
                  padding: "12px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "13px",
                    marginBottom:
                      "5px",
                  }}
                >
                  ♔ PUTIH
                </div>

                <div
                  style={{
                    fontSize:
                      "12px",
                    opacity: 0.7,
                  }}
                >
                  {roomData
                    .players
                    ?.white
                    ? roomData
                        .players
                        .white
                        .id ===
                      playerId
                      ? "Lu"
                      : "Terisi"
                    : "Kosong"}
                </div>

                {myColor ===
                  "white" && (
                  <button
                    type="button"
                    onClick={
                      leaveSeat
                    }
                    style={{
                      marginTop:
                        "8px",
                      background:
                        "transparent",
                      color:
                        "#ffb0b0",
                      border:
                        "1px solid #9d4a4a",
                      borderRadius:
                        "7px",
                      padding:
                        "6px 9px",
                      cursor:
                        "pointer",
                      fontSize:
                        "11px",
                    }}
                  >
                    Ganti Kursi
                  </button>
                )}
              </div>

              <div
                style={{
                  background:
                    "rgba(255,255,255,0.05)",
                  borderRadius:
                    "10px",
                  padding: "12px",
                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "13px",
                    marginBottom:
                      "5px",
                  }}
                >
                  ♜ HITAM
                </div>

                <div
                  style={{
                    fontSize:
                      "12px",
                    opacity: 0.7,
                  }}
                >
                  {roomData
                    .players
                    ?.black
                    ? roomData
                        .players
                        .black
                        .id ===
                      playerId
                      ? "Lu"
                      : "Terisi"
                    : "Kosong"}
                </div>

                {myColor ===
                  "black" && (
                  <button
                    type="button"
                    onClick={
                      leaveSeat
                    }
                    style={{
                      marginTop:
                        "8px",
                      background:
                        "transparent",
                      color:
                        "#ffb0b0",
                      border:
                        "1px solid #9d4a4a",
                      borderRadius:
                        "7px",
                      padding:
                        "6px 9px",
                      cursor:
                        "pointer",
                      fontSize:
                        "11px",
                    }}
                  >
                    Ganti Kursi
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "center",
                gap: "8px",
                flexWrap:
                  "wrap",
                marginTop:
                  "14px",
              }}
            >
              {myColor !==
                "white" &&
                !roomData.players
                  ?.white && (
                  <button
                    type="button"
                    onClick={() =>
                      takeSeat(
                        "white"
                      )
                    }
                    style={{
                      background:
                        "#e9ddc4",
                      color:
                        "#17100c",
                      border:
                        "none",
                      borderRadius:
                        "8px",
                      padding:
                        "10px 14px",
                      fontWeight:
                        700,
                      cursor:
                        "pointer",
                    }}
                  >
                    Pilih Putih
                  </button>
                )}

              {myColor !==
                "black" &&
                !roomData.players
                  ?.black && (
                  <button
                    type="button"
                    onClick={() =>
                      takeSeat(
                        "black"
                      )
                    }
                    style={{
                      background:
                        GOLD,
                      color:
                        "#17100c",
                      border:
                        "none",
                      borderRadius:
                        "8px",
                      padding:
                        "10px 14px",
                      fontWeight:
                        700,
                      cursor:
                        "pointer",
                    }}
                  >
                    Pilih Hitam
                  </button>
                )}
            </div>

            {roomData.host ===
              playerId && (
              <button
                type="button"
                onClick={
                  startGame
                }
                disabled={
                  !roomData
                    .players
                    ?.white ||
                  !roomData
                    .players
                    ?.black ||
                  loading
                }
                style={{
                  width: "100%",
                  marginTop:
                    "14px",
                  padding:
                    "12px",
                  border: "none",
                  borderRadius:
                    "9px",
                  background:
                    roomData
                      .players
                      ?.white &&
                    roomData
                      .players
                      ?.black
                      ? GOLD
                      : "#555",
                  color:
                    "#17100c",
                  fontWeight:
                    700,
                  cursor:
                    roomData
                      .players
                      ?.white &&
                    roomData
                      .players
                      ?.black
                      ? "pointer"
                      : "default",
                }}
              >
                Mulai Chess
              </button>
            )}
          </div>
        )}

        {/* GAME */}

        {gameStarted &&
          gameState && (
            <>
              {renderBoard()}

              {/* PROMOTION */}

              {pendingPromotion && (
                <div
                  style={{
                    width: "90vw",
                    maxWidth:
                      "560px",
                    marginTop:
                      "16px",
                    padding:
                      "14px",
                    boxSizing:
                      "border-box",
                    background:
                      "rgba(255,255,255,0.06)",
                    border:
                      `1px solid rgba(201,162,39,0.5)`,
                    borderRadius:
                      "12px",
                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight:
                        700,
                      marginBottom:
                        "10px",
                    }}
                  >
                    Pilih promosi
                    pion:
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(4, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {PROMOTION_OPTIONS.map(
                      (option) => {
                        const movingPiece =
                          gameState
                            .board[
                            pendingPromotion
                              .from
                              .row
                          ][
                            pendingPromotion
                              .from
                              .col
                          ];

                        return (
                          <button
                            key={
                              option.type
                            }
                            type="button"
                            onClick={() =>
                              executeMove(
                                pendingPromotion.move,
                                option.type
                              )
                            }
                            style={{
                              minHeight:
                                "70px",
                              background:
                                "rgba(255,255,255,0.08)",
                              color:
                                CREAM,
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
                              {getPieceSymbol(
                                {
                                  type:
                                    option.type,
                                  color:
                                    movingPiece.color,
                                }
                              )}
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "11px",
                                marginTop:
                                  "3px",
                              }}
                            >
                              {
                                option.label
                              }
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop:
                    "14px",
                  textAlign:
                    "center",
                  fontSize:
                    "13px",
                  opacity: 0.8,
                }}
              >
                {myColor
                  ? myColor ===
                    gameState.turn
                    ? "Giliran lu."
                    : "Bukan giliran lu."
                  : "Lu belum memilih kursi."}
              </div>
            </>
          )}

        {/* MESSAGE */}

        {message && (
          <div
            style={{
              marginTop:
                "10px",
              textAlign:
                "center",
              fontSize:
                "13px",
              color:
                "#ffd98a",
              minHeight:
                "18px",
            }}
          >
            {message}
          </div>
        )}

        {/* BUTTONS */}

        <div
          style={{
            width: "90vw",
            maxWidth: "560px",
            marginTop:
              "18px",
            display: "flex",
            justifyContent:
              "center",
            gap: "10px",
            flexWrap:
              "wrap",
          }}
        >
          {gameStarted &&
            roomData.host ===
              playerId && (
              <button
                type="button"
                onClick={
                  resetGame
                }
                style={{
                  background:
                    GOLD,
                  color:
                    "#17100c",
                  border: "none",
                  borderRadius:
                    "8px",
                  padding:
                    "11px 17px",
                  fontSize:
                    "14px",
                  fontWeight:
                    700,
                  cursor:
                    "pointer",
                  minHeight:
                    "42px",
                }}
              >
                Reset Chess
              </button>
            )}

          <button
            type="button"
            onClick={
              leaveRoom
            }
            style={{
              background:
                "transparent",
              color: CREAM,
              border:
                `1px solid ${GOLD}`,
              borderRadius:
                "8px",
              padding:
                "11px 17px",
              fontSize:
                "14px",
              fontWeight:
                700,
              cursor:
                "pointer",
              minHeight:
                "42px",
            }}
          >
            ← Kembali ke Game Hub
          </button>
        </div>

        {/* ROOM INFO */}

        <div
          style={{
            marginTop:
              "12px",
            textAlign:
              "center",
            fontSize:
              "11px",
            opacity: 0.45,
          }}
        >
          Room: {roomId}
        </div>
      </div>
    </div>
  );
}

export default Chess;