import React, { useEffect, useMemo, useState } from "react";

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
    const key = "rgamehub_chess_player_id";
    let id = sessionStorage.getItem(key);

    if (!id) {
      id =
        "player_" +
        Math.random().toString(36).substring(2) +
        Date.now().toString(36);

      sessionStorage.setItem(key, id);
    }

    return id;
  } catch {
    return (
      "player_" +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36)
    );
  }
}

/*
 * Firebase bisa mengembalikan array sebagai object.
 * Fungsi ini memastikan board kembali menjadi
 * array 8 x 8 sebelum diberikan ke chessLogic.
 */
function normalizeBoard(board) {
  if (!board) {
    return null;
  }

  const getKeys = (value) =>
    Object.keys(value || {}).sort(
      (a, b) => Number(a) - Number(b)
    );

  const result = [];

  for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
    const sourceRow = Array.isArray(board)
      ? board[rowIndex]
      : board[String(rowIndex)];

    if (Array.isArray(sourceRow)) {
      result.push(
        Array.from(
          { length: 8 },
          (_, colIndex) =>
            sourceRow[colIndex] ?? null
        )
      );

      continue;
    }

    const row = [];

    for (let colIndex = 0; colIndex < 8; colIndex++) {
      row.push(
        sourceRow?.[String(colIndex)] ?? null
      );
    }

    result.push(row);
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
  if (!state) {
    return null;
  }

  const board = normalizeBoard(state.board);

  if (!board) {
    return null;
  }

  return {
    ...state,
    board,
  };
}

export function Chess() {
  const [playerId] = useState(() =>
    getPlayerId()
  );

  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("room") || null;
  });

  const [roomInput, setRoomInput] = useState(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("room") || "";
  });

  const [roomData, setRoomData] = useState(null);

  const [gameState, setGameState] =
    useState(null);

  const [selected, setSelected] =
    useState(null);

  const [pendingPromotion, setPendingPromotion] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * =====================================================
   * FIREBASE ROOM LISTENER
   * =====================================================
   */

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

        /*
         * Jangan menjalankan game state
         * sebelum game benar-benar dimulai.
         */
        if (
          data?.game?.started &&
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

  /*
   * =====================================================
   * URL ROOM
   * =====================================================
   */

  function openRoomInUrl(code) {
    const newUrl =
      `${window.location.pathname}?game=chess&room=${code}`;

    window.history.replaceState(
      {},
      "",
      newUrl
    );
  }

  /*
   * =====================================================
   * CREATE ROOM
   * =====================================================
   */

  async function createRoom() {
    setLoading(true);
    setMessage("");

    try {
      let code = generateRoomCode();

      let roomRef = ref(
        db,
        `chessRooms/${code}`
      );

      let snapshot = await get(roomRef);

      if (snapshot.exists()) {
        code = generateRoomCode();

        roomRef = ref(
          db,
          `chessRooms/${code}`
        );

        snapshot = await get(roomRef);
      }

      /*
       * PENTING:
       * Jangan simpan createInitialState()
       * saat membuat room.
       *
       * State baru dibuat ketika host
       * menekan START GAME.
       */
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

  /*
   * =====================================================
   * JOIN ROOM
   * =====================================================
   */

  async function joinRoom() {
    const code =
      roomInput.trim().toUpperCase();

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

      const snapshot = await get(roomRef);

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

  /*
   * =====================================================
   * LEAVE ROOM
   * =====================================================
   */

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

  /*
   * =====================================================
   * PLAYER COLOR
   * =====================================================
   */

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

  /*
   * =====================================================
   * TAKE SEAT
   * =====================================================
   */

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

      /*
       * Kalau pemain sudah duduk
       * di warna lain, kosongkan.
       */
      if (
        roomData.players?.white?.id ===
        playerId
      ) {
        updates["players/white"] = null;
      }

      if (
        roomData.players?.black?.id ===
        playerId
      ) {
        updates["players/black"] = null;
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

  /*
   * =====================================================
   * LEAVE SEAT
   * =====================================================
   */

  async function leaveSeat() {
    if (!roomId || !myColor) {
      return;
    }

    if (roomData?.game?.started) {
      setMessage(
        "Game sudah dimulai. Kursi tidak bisa ditinggalkan."
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

  /*
   * =====================================================
   * START GAME
   * =====================================================
   */

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
        ref(db, `chessRooms/${roomId}`),
        {
          "game/started": true,
          "game/state": initialState,
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

  /*
   * =====================================================
   * STATUS
   * =====================================================
   */

  const status = useMemo(() => {
    /*
     * Lobby = jangan panggil getGameStatus.
     */
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

  /*
   * =====================================================
   * VALID MOVES
   * =====================================================
   */

  const validMoves = useMemo(() => {
    if (
      !gameState ||
      !selected ||
      !myColor
    ) {
      return [];
    }

    /*
     * Jangan izinkan pemain bergerak
     * kalau bukan gilirannya.
     */
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

  /*
   * =====================================================
   * STATUS TEXT
   * =====================================================
   */

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
      status.status ===
      "check"
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

  /*
   * =====================================================
   * EXECUTE MOVE
   * =====================================================
   */

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
      const roomRef = ref(
        db,
        `chessRooms/${roomId}`
      );

      await runTransaction(
        roomRef,
        (currentRoom) => {
          if (!currentRoom) {
            return;
          }

          if (
            currentRoom.game
              ?.started !== true
          ) {
            return;
          }

          const currentState =
            normalizeGameState(
              currentRoom.game?.state
            );

          if (!currentState) {
            return;
          }

          /*
           * Validasi turn di dalam
           * transaction Firebase.
           */
          if (
            currentState.turn !==
            myColor
          ) {
            return;
          }

          const seat =
            currentRoom.players?.[
              myColor
            ];

          if (
            seat?.id !== playerId
          ) {
            return;
          }

          const legalMoves =
            getLegalMoves(
              currentState,
              fromRow,
              fromCol
            );

          const isLegal =
            legalMoves.some(
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

          if (!isLegal) {
            return;
          }

          const newState =
            applyMove(
              currentState,
              fromRow,
              fromCol,
              move,
              promotionPiece
            );

          currentRoom.game.state =
            newState;

          return currentRoom;
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

  /*
   * =====================================================
   * SQUARE CLICK
   * =====================================================
   */

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

    /*
     * Turn enforcement.
     */
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

    /*
     * =====================================
     * BELUM MEMILIH BIDAK
     * =====================================
     */

    if (!selected) {
      if (!piece) {
        return;
      }

      /*
       * Hanya boleh memilih bidak
       * milik warna sendiri.
       */
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

    /*
     * =====================================
     * KLIK BIDAK SENDIRI
     * =====================================
     */

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

    /*
     * =====================================
     * CARI LANGKAH
     * =====================================
     */

    const move =
      validMoves.find(
        (item) =>
          item.row === row &&
          item.col === col
      );

    if (!move) {
      return;
    }

    /*
     * =====================================
     * PROMOTION
     * =====================================
     */

    if (move.promotion) {
      setPendingPromotion({
        move,
        from: selected,
      });

      return;
    }

    executeMove(move);
  }

  /*
   * =====================================================
   * RESET GAME
   * =====================================================
   */

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
        ref(db, `chessRooms/${roomId}`),
        {
          "game/started": false,
          "game/state": null,
        }
      );

      setSelected(null);
      setPendingPromotion(null);

      setMessage(
        "Game di-reset. Pilih kursi lagi untuk memulai."
      );
    } catch (error) {
      console.error(
        "Reset game error:",
        error
      );

      setMessage(
        "Gagal reset game."
      );
    }
  }

  /*
   * =====================================================
   * CHECKED KING
   * =====================================================
   */

  const checkedKing =
    status.check &&
    gameState
      ? findKing(
          gameState.board,
          gameState.turn
        )
      : null;

  /*
   * =====================================================
   * ROOM CREATION / JOIN SCREEN
   * =====================================================
   */

  if (!roomId) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          width: "100%",
          background: BG,
          color: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          boxSizing: "border-box",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            background:
              "rgba(255,255,255,0.05)",
            border:
              `1px solid rgba(201,162,39,0.45)`,
            borderRadius: "16px",
            padding: "28px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: GOLD,
              fontFamily:
                "Georgia, serif",
              fontSize: "40px",
              fontWeight: 700,
            }}
          >
            ♟ Chess
          </div>

          <div
            style={{
              textAlign: "center",
              marginTop: "8px",
              opacity: 0.75,
            }}
          >
            Multiplayer
          </div>

          <button
            type="button"
            onClick={createRoom}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "28px",
              minHeight: "48px",
              border: "none",
              borderRadius: "9px",
              background: GOLD,
              color: "#17100c",
              fontWeight: 800,
              fontSize: "15px",
              cursor: loading
                ? "default"
                : "pointer",
            }}
          >
            {loading
              ? "Membuat Room..."
              : "Buat Room Baru"}
          </button>

          <div
            style={{
              textAlign: "center",
              margin:
                "20px 0 12px",
              opacity: 0.55,
            }}
          >
            atau
          </div>

          <input
            value={roomInput}
            onChange={(event) =>
              setRoomInput(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                joinRoom();
              }
            }}
            placeholder="Masukkan kode room"
            maxLength={8}
            style={{
              width: "100%",
              minHeight: "46px",
              boxSizing: "border-box",
              borderRadius: "9px",
              border:
                "1px solid rgba(255,255,255,0.2)",
              background:
                "rgba(0,0,0,0.25)",
              color: CREAM,
              padding: "0 13px",
              fontSize: "15px",
              outline: "none",
              textTransform:
                "uppercase",
            }}
          />

          <button
            type="button"
            onClick={joinRoom}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "10px",
              minHeight: "46px",
              border:
                `1px solid ${GOLD}`,
              borderRadius: "9px",
              background:
                "transparent",
              color: CREAM,
              fontWeight: 700,
              fontSize: "15px",
              cursor: loading
                ? "default"
                : "pointer",
            }}
          >
            Masuk Room
          </button>

          {message && (
            <div
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "13px",
                color: CREAM,
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
              display: "block",
              margin:
                "22px auto 0",
              background:
                "transparent",
              border: "none",
              color: GOLD,
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ← Kembali ke Game Hub
          </button>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * ROOM NOT FOUND / LOADING
   * =====================================================
   */

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
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            Room tidak ditemukan.
          </div>

          <button
            type="button"
            onClick={leaveRoom}
            style={{
              marginTop: "16px",
              background: GOLD,
              border: "none",
              borderRadius: "8px",
              padding: "11px 17px",
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

  /*
   * =====================================================
   * LOBBY
   * =====================================================
   */

  if (!roomData.game?.started) {
    const whitePlayer =
      roomData.players?.white;

    const blackPlayer =
      roomData.players?.black;

    return (
      <div
        style={{
          minHeight: "100dvh",
          width: "100%",
          background: BG,
          color: CREAM,
          padding:
            "clamp(16px, 4vw, 32px) 14px",
          boxSizing: "border-box",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "580px",
            margin: "0 auto",
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
                fontFamily:
                  "Georgia, serif",
                fontSize:
                  "clamp(30px, 7vw, 42px)",
                fontWeight: 700,
              }}
            >
              ♟ Chess
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "14px",
                opacity: 0.7,
              }}
            >
              Lobby Multiplayer
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              borderRadius: "12px",
              background:
                "rgba(255,255,255,0.05)",
              border:
                `1px solid rgba(201,162,39,0.4)`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                opacity: 0.65,
              }}
            >
              KODE ROOM
            </div>

            <div
              style={{
                marginTop: "5px",
                color: GOLD,
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "5px",
              }}
            >
              {roomId}
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(
                    window.location.href
                  );

                setMessage(
                  "Link room berhasil disalin."
                );
              }}
              style={{
                marginTop: "10px",
                background:
                  "transparent",
                color: CREAM,
                border:
                  `1px solid ${GOLD}`,
                borderRadius: "7px",
                padding:
                  "8px 13px",
                cursor: "pointer",
              }}
            >
              Salin Link Room
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "12px",
              marginTop: "16px",
            }}
          >
            {/* WHITE */}

            <div
              style={{
                padding: "18px 12px",
                borderRadius: "12px",
                background:
                  "rgba(255,255,255,0.07)",
                border:
                  whitePlayer
                    ? `2px solid ${GOLD}`
                    : "1px solid rgba(255,255,255,0.15)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                }}
              >
                ♔
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontWeight: 800,
                }}
              >
                PUTIH
              </div>

              <div
                style={{
                  marginTop: "6px",
                  minHeight: "20px",
                  fontSize: "12px",
                  opacity: 0.7,
                }}
              >
                {whitePlayer
                  ? whitePlayer.id ===
                    playerId
                    ? "Lu"
                    : "Terisi"
                  : "Kosong"}
              </div>

              {!whitePlayer ||
              whitePlayer.id ===
                playerId ? (
                <button
                  type="button"
                  onClick={() =>
                    whitePlayer
                      ? leaveSeat()
                      : takeSeat(
                          "white"
                        )
                  }
                  style={{
                    width: "100%",
                    marginTop: "14px",
                    minHeight: "40px",
                    borderRadius: "8px",
                    border:
                      `1px solid ${GOLD}`,
                    background:
                      whitePlayer
                        ? "transparent"
                        : GOLD,
                    color:
                      whitePlayer
                        ? CREAM
                        : "#17100c",
                    fontWeight: 800,
                    cursor:
                      "pointer",
                  }}
                >
                  {whitePlayer
                    ? "Keluar Kursi"
                    : "Pilih PUTIH"}
                </button>
              ) : null}
            </div>

            {/* BLACK */}

            <div
              style={{
                padding: "18px 12px",
                borderRadius: "12px",
                background:
                  "rgba(255,255,255,0.07)",
                border:
                  blackPlayer
                    ? `2px solid ${GOLD}`
                    : "1px solid rgba(255,255,255,0.15)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "38px",
                }}
              >
                ♚
              </div>

              <div
                style={{
                  marginTop: "6px",
                  fontWeight: 800,
                }}
              >
                HITAM
              </div>

              <div
                style={{
                  marginTop: "6px",
                  minHeight: "20px",
                  fontSize: "12px",
                  opacity: 0.7,
                }}
              >
                {blackPlayer
                  ? blackPlayer.id ===
                    playerId
                    ? "Lu"
                    : "Terisi"
                  : "Kosong"}
              </div>

              {!blackPlayer ||
              blackPlayer.id ===
                playerId ? (
                <button
                  type="button"
                  onClick={() =>
                    blackPlayer
                      ? leaveSeat()
                      : takeSeat(
                          "black"
                        )
                  }
                  style={{
                    width: "100%",
                    marginTop: "14px",
                    minHeight: "40px",
                    borderRadius: "8px",
                    border:
                      `1px solid ${GOLD}`,
                    background:
                      blackPlayer
                        ? "transparent"
                        : GOLD,
                    color:
                      blackPlayer
                        ? CREAM
                        : "#17100c",
                    fontWeight: 800,
                    cursor:
                      "pointer",
                  }}
                >
                  {blackPlayer
                    ? "Keluar Kursi"
                    : "Pilih HITAM"}
                </button>
              ) : null}
            </div>
          </div>

          <div
            style={{
              marginTop: "18px",
              textAlign: "center",
              fontSize: "13px",
              opacity: 0.7,
            }}
          >
            {roomData.host ===
            playerId
              ? "Lu adalah host."
              : "Menunggu host memulai game."}
          </div>

          {roomData.host ===
            playerId && (
            <button
              type="button"
              onClick={startGame}
              disabled={
                !whitePlayer ||
                !blackPlayer
              }
              style={{
                width: "100%",
                marginTop: "14px",
                minHeight: "48px",
                border: "none",
                borderRadius: "9px",
                background:
                  whitePlayer &&
                  blackPlayer
                    ? GOLD
                    : "rgba(255,255,255,0.15)",
                color:
                  whitePlayer &&
                  blackPlayer
                    ? "#17100c"
                    : "rgba(255,255,255,0.45)",
                fontWeight: 900,
                cursor:
                  whitePlayer &&
                  blackPlayer
                    ? "pointer"
                    : "default",
              }}
            >
              START GAME
            </button>
          )}

          {message && (
            <div
              style={{
                marginTop: "14px",
                textAlign: "center",
                fontSize: "13px",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={leaveRoom}
            style={{
              display: "block",
              margin:
                "20px auto 0",
              background:
                "transparent",
              border: "none",
              color: GOLD,
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ← Kembali ke Game Hub
          </button>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * GAME BOARD
   * =====================================================
   */

  if (!gameState) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: BG,
          color: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Memuat papan Chess...
      </div>
    );
  }

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

          <div
            style={{
              marginTop: "6px",
              fontSize:
                "clamp(14px, 3vw, 18px)",
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
        </div>

        {/* PLAYER INFO */}

        <div
          style={{
            width: "90vw",
            maxWidth: "560px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              padding: "7px 11px",
              borderRadius: "8px",
              background:
                myColor === "white"
                  ? GOLD
                  : "rgba(255,255,255,0.08)",
              color:
                myColor === "white"
                  ? "#17100c"
                  : CREAM,
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            ♔ PUTIH
            {roomData.players
              ?.white?.id ===
              playerId
              ? " • LU"
              : ""}
          </div>

          <div
            style={{
              fontSize: "12px",
              opacity: 0.65,
            }}
          >
            ROOM {roomId}
          </div>

          <div
            style={{
              padding: "7px 11px",
              borderRadius: "8px",
              background:
                myColor === "black"
                  ? GOLD
                  : "rgba(255,255,255,0.08)",
              color:
                myColor === "black"
                  ? "#17100c"
                  : CREAM,
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            ♚ HITAM
            {roomData.players
              ?.black?.id ===
              playerId
              ? " • LU"
              : ""}
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
              border:
                `3px solid ${GOLD}`,
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

                    const selectedPiece =
                      selected
                        ? gameState
                            .board[
                            selected
                              .row
                          ]?.[
                            selected
                              .col
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
                            pendingPromotion ||
                            gameState.turn !==
                              myColor
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

        {/* PROMOTION */}

        {pendingPromotion && (
          <div
            style={{
              width: "90vw",
              maxWidth: "560px",
              marginTop: "16px",
              padding: "14px",
              boxSizing:
                "border-box",
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
                    gameState
                      .board[
                      pendingPromotion
                        .from.row
                    ]?.[
                      pendingPromotion
                        .from.col
                    ];

                  if (!movingPiece) {
                    return null;
                  }

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
                        minHeight:
                          "70px",
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

        {/* MESSAGE */}

        {message && (
          <div
            style={{
              marginTop: "12px",
              textAlign: "center",
              fontSize: "13px",
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
            marginTop: "18px",
            display: "flex",
            justifyContent:
              "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {roomData.host ===
            playerId && (
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
          )}

          <button
            type="button"
            onClick={leaveRoom}
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
            opacity: 0.5,
            maxWidth: "560px",
          }}
        >
          Multiplayer Chess • Firebase
        </div>
      </div>
    </div>
  );
}