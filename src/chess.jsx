import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  get,
  onValue,
  ref,
  runTransaction,
  set,
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
    label: "♕",
    name: "Queen",
  },
  {
    type: "rook",
    label: "♖",
    name: "Rook",
  },
  {
    type: "bishop",
    label: "♗",
    name: "Bishop",
  },
  {
    type: "knight",
    label: "♘",
    name: "Knight",
  },
];

const BOT_LEVELS = {
  easy: {
    name: "Easy",
    emoji: "🟢",
  },
  normal: {
    name: "Normal",
    emoji: "🟡",
  },
  hard: {
    name: "Hard",
    emoji: "🔴",
  },
};

/* =========================================================
   ROOM HELPERS
========================================================= */

function generateRoomCode() {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

function getPlayerId() {
  const key =
    "rgamehub_chess_player_id";

  let id =
    localStorage.getItem(key);

  if (!id) {
    id =
      "chess_" +
      Math.random()
        .toString(36)
        .substring(2) +
      Date.now().toString(36);

    localStorage.setItem(
      key,
      id
    );
  }

  return id;
}

/* =========================================================
   GAME STATE HELPERS
========================================================= */

function normalizeBoard(board) {
  const initial =
    createInitialState();

  const initialBoard =
    initial?.board;

  /*
   * Kalau board sama sekali tidak valid,
   * langsung gunakan board awal.
   */
  if (!board) {
    return initialBoard;
  }

  /*
   * Firebase biasanya mengembalikan array
   * dengan bentuk normal.
   */
  const normalized = [];

  for (let row = 0; row < 8; row++) {
    const sourceRow =
      board?.[row];

    const newRow = [];

    for (let col = 0; col < 8; col++) {
      if (
        sourceRow &&
        typeof sourceRow ===
          "object"
      ) {
        newRow.push(
          sourceRow?.[col] ??
            initialBoard?.[row]?.[col] ??
            null
        );
      } else {
        newRow.push(
          initialBoard?.[row]?.[col] ??
            null
        );
      }
    }

    normalized.push(newRow);
  }

  return normalized;
}

function normalizeGameState(game) {
  if (!game) return null;

  const initial =
    createInitialState();

  return {
    ...initial,
    ...game,

    board:
      normalizeBoard(
        game.board
      ),

    turn:
      game.turn === "black"
        ? "black"
        : "white",

    castling:
      game.castling ||
      initial.castling,

    enPassant:
      game.enPassant ?? null,

    moveHistory:
      Array.isArray(
        game.moveHistory
      )
        ? game.moveHistory
        : [],
  };
}

function pieceColor(piece) {
  if (!piece) return null;

  if (
    typeof piece ===
    "string"
  ) {
    if (
      piece ===
      piece.toUpperCase()
    ) {
      return "white";
    }

    return "black";
  }

  return piece.color || null;
}

function pieceType(piece) {
  if (!piece) return null;

  if (
    typeof piece ===
    "string"
  ) {
    return piece.toLowerCase();
  }

  return piece.type || null;
}

function getMoveTarget(move) {
  if (!move) return null;

  if (Array.isArray(move)) {
    return {
      row: move[0],
      col: move[1],
    };
  }

  return {
    row:
      move.row ??
      move.toRow ??
      move.to?.row ??
      move.r,

    col:
      move.col ??
      move.toCol ??
      move.to?.col ??
      move.c,
  };
}

function moveKey(from, move) {
  const target =
    getMoveTarget(move);

  if (!target) return "";

  return `${from.row},${from.col}-${target.row},${target.col}`;
}

function cloneState(state) {
  return JSON.parse(
    JSON.stringify(state)
  );
}

/* =========================================================
   BOT HELPERS
========================================================= */

function allLegalMovesForColor(
  state,
  color
) {
  const result = [];

  for (
    let row = 0;
    row < 8;
    row++
  ) {
    for (
      let col = 0;
      col < 8;
      col++
    ) {
      const piece =
        state?.board?.[row]?.[col];

      if (!piece) continue;

      if (
        pieceColor(piece) !==
        color
      ) {
        continue;
      }

      const moves =
        getLegalMoves(
          state,
          row,
          col
        ) || [];

      for (const move of moves) {
        result.push({
          from: {
            row,
            col,
          },
          move,
        });
      }
    }
  }

  return result;
}

function materialValue(piece) {
  switch (
    pieceType(piece)
  ) {
    case "pawn":
    case "p":
      return 100;

    case "knight":
    case "n":
      return 320;

    case "bishop":
    case "b":
      return 330;

    case "rook":
    case "r":
      return 500;

    case "queen":
    case "q":
      return 900;

    case "king":
    case "k":
      return 20000;

    default:
      return 0;
  }
}

function evaluateBoard(
  state,
  botColor
) {
  let score = 0;

  for (
    let row = 0;
    row < 8;
    row++
  ) {
    for (
      let col = 0;
      col < 8;
      col++
    ) {
      const piece =
        state?.board?.[row]?.[col];

      if (!piece) continue;

      const value =
        materialValue(piece);

      if (
        pieceColor(piece) ===
        botColor
      ) {
        score += value;
      } else {
        score -= value;
      }
    }
  }

  const status =
    getGameStatus(state);

  if (
    status.gameOver &&
    status.check
  ) {
    if (
      status.winner ===
      botColor
    ) {
      score += 100000;
    } else {
      score -= 100000;
    }
  }

  if (status.check) {
    const checkedColor =
      state.turn;

    if (
      checkedColor ===
      botColor
    ) {
      score -= 50;
    } else {
      score += 50;
    }
  }

  return score;
}

function simulateMove(
  state,
  from,
  move,
  promotion = "queen"
) {
  try {
    const next =
      applyMove(
        cloneState(state),
        from.row,
        from.col,
        move,
        promotion
      );

    return normalizeGameState(
      next
    );
  } catch {
    return null;
  }
}

function chooseRandomMove(
  moves
) {
  if (!moves.length) {
    return null;
  }

  return moves[
    Math.floor(
      Math.random() *
        moves.length
    )
  ];
}

function chooseEasyMove(
  state,
  moves
) {
  if (!moves.length) {
    return null;
  }

  const captures = [];

  for (const item of moves) {
    const target =
      getMoveTarget(
        item.move
      );

    if (!target) continue;

    const captured =
      state?.board?.[
        target.row
      ]?.[target.col];

    if (captured) {
      captures.push(item);
    }
  }

  if (
    captures.length > 0 &&
    Math.random() < 0.65
  ) {
    return chooseRandomMove(
      captures
    );
  }

  return chooseRandomMove(
    moves
  );
}

function chooseNormalMove(
  state,
  moves,
  botColor
) {
  if (!moves.length) {
    return null;
  }

  const scored =
    moves.map((item) => {
      const target =
        getMoveTarget(
          item.move
        );

      const captured = target
        ? state?.board?.[
            target.row
          ]?.[target.col]
        : null;

      const next =
        simulateMove(
          state,
          item.from,
          item.move
        );

      let score = 0;

      if (captured) {
        score +=
          materialValue(
            captured
          ) * 1.2;
      }

      if (next) {
        const status =
          getGameStatus(next);

        if (
          status.gameOver &&
          status.winner ===
            botColor
        ) {
          score += 100000;
        }

        if (
          status.check &&
          next.turn !==
            botColor
        ) {
          score += 80;
        }

        score +=
          evaluateBoard(
            next,
            botColor
          ) * 0.25;
      }

      score +=
        Math.random() * 40;

      return {
        item,
        score,
      };
    });

  scored.sort(
    (a, b) =>
      b.score - a.score
  );

  const top =
    scored.slice(
      0,
      Math.min(
        3,
        scored.length
      )
    );

  return chooseRandomMove(
    top
  )?.item;
}

function chooseHardMove(
  state,
  moves,
  botColor
) {
  if (!moves.length) {
    return null;
  }

  let bestMove = null;
  let bestScore = -Infinity;

  for (const item of moves) {
    const next =
      simulateMove(
        state,
        item.from,
        item.move
      );

    if (!next) continue;

    const status =
      getGameStatus(next);

    if (
      status.gameOver &&
      status.winner ===
        botColor
    ) {
      return item;
    }

    let score =
      evaluateBoard(
        next,
        botColor
      );

    const opponentColor =
      botColor === "white"
        ? "black"
        : "white";

    const opponentMoves =
      allLegalMovesForColor(
        next,
        opponentColor
      );

    for (
      const opponentMove of
      opponentMoves
    ) {
      const reply =
        simulateMove(
          next,
          opponentMove.from,
          opponentMove.move
        );

      if (!reply) continue;

      const replyScore =
        evaluateBoard(
          reply,
          botColor
        );

      score = Math.min(
        score,
        replyScore
      );
    }

    const target =
      getMoveTarget(
        item.move
      );

    if (target) {
      const captured =
        state?.board?.[
          target.row
        ]?.[target.col];

      if (captured) {
        score +=
          materialValue(
            captured
          ) * 0.8;
      }
    }

    if (
      score > bestScore
    ) {
      bestScore = score;
      bestMove = item;
    }
  }

  return (
    bestMove ||
    chooseRandomMove(
      moves
    )
  );
}

/* =========================================================
   CHESS COMPONENT
========================================================= */

function Chess() {
  const playerIdRef =
    useRef(getPlayerId());

  const playerId =
    playerIdRef.current;

  const botTimerRef =
    useRef(null);

  const botBusyRef =
    useRef(false);

  const [mode, setMode] =
    useState(
      window.location.search.includes(
        "room="
      )
        ? "pvp"
        : "select"
    );

  const [botLevel, setBotLevel] =
    useState("normal");

  const [botColor, setBotColor] =
    useState("black");

  const [playerColor, setPlayerColor] =
    useState("white");

  const [roomInput, setRoomInput] =
    useState("");

  const [roomId, setRoomId] =
    useState(() => {
      const params =
        new URLSearchParams(
          window.location.search
        );

      return (
        params.get("room") ||
        ""
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

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [botThinking, setBotThinking] =
    useState(false);

  const isBotMode =
    mode === "bot";

  const isPvP =
    mode === "pvp";

  /* =======================================================
     ROOM LISTENER
  ======================================================= */

  useEffect(() => {
    if (
      !isPvP ||
      !roomId
    ) {
      return;
    }

    const roomRef =
      ref(
        db,
        `chessRooms/${roomId}`
      );

    const unsubscribe =
      onValue(
        roomRef,
        (snapshot) => {
          const data =
            snapshot.val();

          /*
           * Jangan langsung menghapus
           * roomData kalau Firebase
           * sempat mengembalikan null.
           */
          if (!data) {
            console.warn(
              "Chess room belum terbaca:",
              roomId
            );

            return;
          }

          setRoomData(data);

          if (data.game) {
            const normalized =
              normalizeGameState(
                data.game
              );

            setGameState(
              normalized
            );
          } else {
            setGameState(null);
          }
        },
        (error) => {
          console.error(
            "Chess room listener error:",
            error
          );

          setMessage(
            "Gagal membaca room dari Firebase."
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, [
    roomId,
    isPvP,
  ]);

  /* =======================================================
     URL
  ======================================================= */

  function openRoomUrl(code) {
    const url =
      `${window.location.pathname}` +
      `?game=chess&room=${code}`;

    window.history.pushState(
      {},
      "",
      url
    );

    setRoomId(code);
  }

  function clearRoomUrl() {
    const url =
      `${window.location.pathname}` +
      `?game=chess`;

    window.history.pushState(
      {},
      "",
      url
    );

    setRoomId("");
  }

  /* =======================================================
     CREATE ROOM
  ======================================================= */

  async function createRoom() {
    setLoading(true);
    setMessage("");

    try {
      const code =
        generateRoomCode();

      const newRoom = {
        createdAt:
          Date.now(),

        hostId:
          playerId,

        players: {
          [playerId]: {
            id: playerId,
            name: "Player 1",
            color: null,
            joinedAt:
              Date.now(),
          },
        },

        game: null,
      };

      const roomRef =
        ref(
          db,
          `chessRooms/${code}`
        );

      await set(
        roomRef,
        newRoom
      );

      /*
       * Pastikan room benar-benar
       * ada sebelum pindah ke lobby.
       */
      const verify =
        await get(roomRef);

      if (!verify.exists()) {
        setMessage(
          "Room gagal dibuat di Firebase."
        );
        return;
      }

      const savedRoom =
        verify.val();

      setRoomData(
        savedRoom
      );

      setGameState(null);

      openRoomUrl(code);
    } catch (error) {
      console.error(
        "Create room error:",
        error
      );

      setMessage(
        "Gagal membuat room."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     JOIN ROOM
  ======================================================= */

  async function joinRoom() {
    const code =
      roomInput
        .trim()
        .toUpperCase();

    if (!code) {
      setMessage(
        "Masukkan kode room."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const roomRef =
        ref(
          db,
          `chessRooms/${code}`
        );

      /*
       * Pastikan room ada.
       */
      const snapshot =
        await get(roomRef);

      if (!snapshot.exists()) {
        setMessage(
          "Room tidak ditemukan."
        );
        return;
      }

      const data =
        snapshot.val();

      const players =
        data.players || {};

      /*
       * Kalau player sudah ada
       * di room, langsung masuk.
       */
      if (
        players[playerId]
      ) {
        setRoomData(data);

        setGameState(
          data.game
            ? normalizeGameState(
                data.game
              )
            : null
        );

        openRoomUrl(code);

        return;
      }

      /*
       * Maksimal 2 pemain.
       */
      if (
        Object.keys(
          players
        ).length >= 2
      ) {
        setMessage(
          "Room sudah penuh."
        );
        return;
      }

      /*
       * Tambahkan Player 2.
       *
       * Warna sengaja null.
       * Player harus memilih sendiri.
       */
      const updatedPlayers =
        {
          ...players,

          [playerId]: {
            id: playerId,
            name: "Player 2",
            color: null,
            joinedAt:
              Date.now(),
          },
        };

      await set(
        ref(
          db,
          `chessRooms/${code}/players`
        ),
        updatedPlayers
      );

      /*
       * Baca ulang room setelah
       * berhasil join.
       */
      const updatedSnapshot =
        await get(roomRef);

      if (
        !updatedSnapshot.exists()
      ) {
        setMessage(
          "Room gagal dibaca setelah bergabung."
        );
        return;
      }

      const updatedData =
        updatedSnapshot.val();

      setRoomData(
        updatedData
      );

      setGameState(
        updatedData.game
          ? normalizeGameState(
              updatedData.game
            )
          : null
      );

      openRoomUrl(code);
    } catch (error) {
      console.error(
        "Join room error:",
        error
      );

      setMessage(
        "Gagal bergabung ke room."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     CURRENT PLAYER
  ======================================================= */

  const myPlayer =
    useMemo(() => {
      if (isBotMode) {
        return null;
      }

      return (
        roomData?.players?.[
          playerId
        ] || null
      );
    }, [
      roomData,
      playerId,
      isBotMode,
    ]);

  const myColor =
    useMemo(() => {
      if (isBotMode) {
        return playerColor;
      }

      return (
        myPlayer?.color ||
        null
      );
    }, [
      myPlayer,
      isBotMode,
      playerColor,
    ]);

  /* =======================================================
     CHOOSE PVP COLOR
  ======================================================= */

  async function choosePvPColor(
    color
  ) {
    if (!roomId) return;
    if (!roomData) return;
    if (gameState) return;

    const roomRef =
      ref(
        db,
        `chessRooms/${roomId}`
      );

    let errorMessage = "";

    const result =
      await runTransaction(
        roomRef,
        (current) => {
          if (!current) {
            errorMessage =
              "Room tidak ditemukan.";

            return;
          }

          const players =
            current.players || {};

          const me =
            players[playerId];

          if (!me) {
            errorMessage =
              "Kamu tidak terdaftar di room.";

            return;
          }

          /*
           * Cek warna milik lawan.
           */
          for (
            const [
              id,
              player,
            ] of Object.entries(
              players
            )
          ) {
            if (
              id !== playerId &&
              player?.color === color
            ) {
              errorMessage =
                color === "white"
                  ? "Bidak Putih sudah dipilih player lain."
                  : "Bidak Hitam sudah dipilih player lain.";

              return;
            }
          }

          /*
           * Pilih warna.
           * Kalau sebelumnya memilih warna lain,
           * otomatis pindah.
           */
          return {
            ...current,

            players: {
              ...players,

              [playerId]: {
                ...me,
                color,
              },
            },
          };
        }
      );

    if (
      !result.committed &&
      errorMessage
    ) {
      setMessage(
        errorMessage
      );

      return;
    }

    setMessage("");
  }

  /* =======================================================
     START PVP
  ======================================================= */

  async function startPvPGame() {
    if (!roomId) {
      return;
    }

    if (
      roomData?.hostId !==
      playerId
    ) {
      setMessage(
        "Hanya host yang bisa memulai game."
      );

      return;
    }

    const players =
      roomData?.players || {};

    const playerList =
      Object.values(
        players
      );

    if (
      playerList.length !== 2
    ) {
      setMessage(
        "Menunggu 2 pemain."
      );

      return;
    }

    const whitePlayer =
      playerList.find(
        (player) =>
          player?.color ===
          "white"
      );

    const blackPlayer =
      playerList.find(
        (player) =>
          player?.color ===
          "black"
      );

    if (
      !whitePlayer ||
      !blackPlayer
    ) {
      setMessage(
        "Kedua pemain harus memilih warna terlebih dahulu."
      );

      return;
    }

    try {
      const initial =
        normalizeGameState(
          createInitialState()
        );

      await set(
        ref(
          db,
          `chessRooms/${roomId}/game`
        ),
        initial
      );

      setSelected(null);
      setPendingPromotion(null);
      setMessage("");
    } catch (error) {
      console.error(
        "Start Chess error:",
        error
      );

      setMessage(
        "Gagal memulai game."
      );
    }
  }

  /* =======================================================
     BOT GAME
  ======================================================= */

  function startBotGame() {
    const initial =
      normalizeGameState(
        createInitialState()
      );

    setGameState(initial);
    setSelected(null);
    setPendingPromotion(null);
    setMessage("");
    setMode("bot");
  }

  function returnToModeSelect() {
    if (
      botTimerRef.current
    ) {
      clearTimeout(
        botTimerRef.current
      );

      botTimerRef.current =
        null;
    }

    botBusyRef.current =
      false;

    setBotThinking(false);
    setGameState(null);
    setSelected(null);
    setPendingPromotion(null);
    setRoomData(null);
    setRoomId("");

    clearRoomUrl();

    setMode("select");
  }

  /* =======================================================
     GAME STATUS
  ======================================================= */

  const status =
    useMemo(() => {
      if (!gameState) {
        return {
          status: "waiting",
          check: false,
          gameOver: false,
          winner: null,
        };
      }

      return getGameStatus(
        gameState
      );
    }, [
      gameState,
    ]);

  function getStatusText() {
    if (!gameState) {
      return "";
    }

    if (
      status.gameOver &&
      status.check
    ) {
      const winner =
        status.winner ===
        "white"
          ? "Putih"
          : "Hitam";

      if (isBotMode) {
        return (
          status.winner ===
          playerColor
            ? "♛ SKAKMAT! Kamu menang"
            : "♛ SKAKMAT! Bot menang"
        );
      }

      return `♛ SKAKMAT! ${winner} menang`;
    }

    if (
      status.gameOver &&
      !status.check
    ) {
      return "STALEMATE — REMIS";
    }

    if (status.check) {
      const turn =
        gameState.turn ===
        "white"
          ? "Putih"
          : "Hitam";

      return `⚠️ SKAK! Giliran ${turn}`;
    }

    if (
      isBotMode &&
      gameState.turn ===
        botColor
    ) {
      return `🤖 Bot (${BOT_LEVELS[botLevel].name}) sedang berpikir...`;
    }

    const turn =
      gameState.turn ===
      "white"
        ? "Putih"
        : "Hitam";

    return `Giliran ${turn}`;
  }

  /* =======================================================
     VALID MOVES
  ======================================================= */

  const validMoves =
    useMemo(() => {
      if (
        !gameState ||
        !selected
      ) {
        return [];
      }

      if (
        !myColor ||
        gameState.turn !==
          myColor
      ) {
        return [];
      }

      if (
        isBotMode &&
        botThinking
      ) {
        return [];
      }

      return (
        getLegalMoves(
          gameState,
          selected.row,
          selected.col
        ) || []
      );
    }, [
      gameState,
      selected,
      myColor,
      isBotMode,
      botThinking,
    ]);

  function isValidDestination(
    row,
    col
  ) {
    return validMoves.some(
      (move) => {
        const target =
          getMoveTarget(
            move
          );

        return (
          target?.row === row &&
          target?.col === col
        );
      }
    );
  }

  /* =======================================================
     EXECUTE MOVE
  ======================================================= */

  async function executeMove(
    from,
    move,
    promotion = "queen"
  ) {
    if (!gameState) {
      return;
    }

    if (
      !myColor ||
      gameState.turn !==
        myColor
    ) {
      return;
    }

    if (status.gameOver) {
      return;
    }

    /*
     * BOT
     */
    if (isBotMode) {
      const current =
        cloneState(
          gameState
        );

      const next =
        simulateMove(
          current,
          from,
          move,
          promotion
        );

      if (!next) {
        setMessage(
          "Langkah tidak valid."
        );

        return;
      }

      setGameState(next);
      setSelected(null);
      setPendingPromotion(null);

      return;
    }

    /*
     * MULTIPLAYER
     */
    if (!roomId) {
      return;
    }

    const gameRef =
      ref(
        db,
        `chessRooms/${roomId}/game`
      );

    let transactionError =
      "";

    const result =
      await runTransaction(
        gameRef,
        (current) => {
          if (!current) {
            transactionError =
              "Game belum dimulai.";

            return;
          }

          const normalized =
            normalizeGameState(
              current
            );

          if (
            normalized.turn !==
            myColor
          ) {
            return;
          }

          const legal =
            getLegalMoves(
              normalized,
              from.row,
              from.col
            ) || [];

          const selectedMove =
            legal.find(
              (candidate) =>
                moveKey(
                  from,
                  candidate
                ) ===
                moveKey(
                  from,
                  move
                )
            );

          if (!selectedMove) {
            transactionError =
              "Langkah tidak valid.";

            return;
          }

          return applyMove(
            normalized,
            from.row,
            from.col,
            selectedMove,
            promotion
          );
        }
      );

    if (
      !result.committed
    ) {
      if (
        transactionError
      ) {
        setMessage(
          transactionError
        );
      }

      return;
    }

    setSelected(null);
    setPendingPromotion(null);
  }

  /* =======================================================
     SQUARE CLICK
  ======================================================= */

  function handleSquareClick(
    row,
    col
  ) {
    if (!gameState) {
      return;
    }

    if (status.gameOver) {
      return;
    }

    if (!myColor) {
      return;
    }

    if (
      isBotMode &&
      botThinking
    ) {
      return;
    }

    if (
      gameState.turn !==
      myColor
    ) {
      return;
    }

    const clickedPiece =
      gameState.board?.[
        row
      ]?.[col];

    /*
     * Belum memilih bidak.
     */
    if (!selected) {
      if (
        clickedPiece &&
        pieceColor(
          clickedPiece
        ) === myColor
      ) {
        setSelected({
          row,
          col,
        });
      }

      return;
    }

    /*
     * Klik bidak sendiri.
     */
    if (
      clickedPiece &&
      pieceColor(
        clickedPiece
      ) === myColor
    ) {
      setSelected({
        row,
        col,
      });

      return;
    }

    /*
     * Cari langkah.
     */
    const move =
      validMoves.find(
        (candidate) => {
          const target =
            getMoveTarget(
              candidate
            );

          return (
            target?.row === row &&
            target?.col === col
          );
        }
      );

    if (!move) {
      setSelected(null);
      return;
    }

    const movingPiece =
      gameState.board?.[
        selected.row
      ]?.[selected.col];

    const type =
      pieceType(
        movingPiece
      );

    const isPromotion =
      type === "pawn" &&
      (
        row === 0 ||
        row === 7
      );

    if (isPromotion) {
      setPendingPromotion({
        from: selected,
        move,
      });

      return;
    }

    executeMove(
      selected,
      move
    );
  }

  /* =======================================================
     PROMOTION
  ======================================================= */

  function choosePromotion(
    promotion
  ) {
    if (
      !pendingPromotion
    ) {
      return;
    }

    executeMove(
      pendingPromotion.from,
      pendingPromotion.move,
      promotion
    );
  }

  /* =======================================================
     BOT TURN
  ======================================================= */

  useEffect(() => {
    if (!isBotMode) {
      return;
    }

    if (!gameState) {
      return;
    }

    if (status.gameOver) {
      return;
    }

    if (
      gameState.turn !==
      botColor
    ) {
      return;
    }

    if (
      botBusyRef.current
    ) {
      return;
    }

    botBusyRef.current =
      true;

    setBotThinking(true);

    const delay =
      botLevel === "easy"
        ? 450
        : botLevel === "normal"
        ? 650
        : 850;

    botTimerRef.current =
      setTimeout(() => {
        try {
          const current =
            cloneState(
              gameState
            );

          const moves =
            allLegalMovesForColor(
              current,
              botColor
            );

          if (!moves.length) {
            return;
          }

          let chosen;

          if (
            botLevel ===
            "easy"
          ) {
            chosen =
              chooseEasyMove(
                current,
                moves
              );
          } else if (
            botLevel ===
            "normal"
          ) {
            chosen =
              chooseNormalMove(
                current,
                moves,
                botColor
              );
          } else {
            chosen =
              chooseHardMove(
                current,
                moves,
                botColor
              );
          }

          if (!chosen) {
            chosen =
              chooseRandomMove(
                moves
              );
          }

          if (chosen) {
            const target =
              getMoveTarget(
                chosen.move
              );

            const movingPiece =
              current.board?.[
                chosen.from.row
              ]?.[
                chosen.from.col
              ];

            const type =
              pieceType(
                movingPiece
              );

            let promotion =
              "queen";

            if (
              type === "pawn" &&
              target &&
              (
                target.row === 0 ||
                target.row === 7
              )
            ) {
              promotion =
                "queen";
            }

            const next =
              simulateMove(
                current,
                chosen.from,
                chosen.move,
                promotion
              );

            if (next) {
              setGameState(
                next
              );
            }
          }
        } catch (error) {
          console.error(
            "Bot error:",
            error
          );
        } finally {
          botBusyRef.current =
            false;

          setBotThinking(false);
        }
      }, delay);

    return () => {
      if (
        botTimerRef.current
      ) {
        clearTimeout(
          botTimerRef.current
        );
      }

      botTimerRef.current =
        null;
    };
  }, [
    isBotMode,
    gameState,
    botColor,
    botLevel,
    status.gameOver,
  ]);

  /* =======================================================
     RESET BOT
  ======================================================= */

  function resetBotGame() {
    if (
      botTimerRef.current
    ) {
      clearTimeout(
        botTimerRef.current
      );
    }

    botBusyRef.current =
      false;

    setBotThinking(false);

    setGameState(
      normalizeGameState(
        createInitialState()
      )
    );

    setSelected(null);
    setPendingPromotion(null);
  }

  /* =======================================================
     RESET PVP
  ======================================================= */

  async function resetPvPGame() {
    if (
      !roomId ||
      !roomData
    ) {
      return;
    }

    if (
      roomData.hostId !==
      playerId
    ) {
      return;
    }

    await set(
      ref(
        db,
        `chessRooms/${roomId}/game`
      ),
      normalizeGameState(
        createInitialState()
      )
    );

    setSelected(null);
    setPendingPromotion(null);
  }

  /* =======================================================
     CHECKED KING
  ======================================================= */

  const checkedKing =
    useMemo(() => {
      if (
        !gameState ||
        !status.check
      ) {
        return null;
      }

      const checkedColor =
        gameState.turn;

      try {
        return findKing(
          gameState.board,
          checkedColor
        );
      } catch {
        return null;
      }
    }, [
      gameState,
      status.check,
    ]);

  /* =======================================================
     MODE SELECT
  ======================================================= */

  if (
    mode === "select"
  ) {
    return (
      <Page>
        <Panel maxWidth={500}>
          <div
            style={{
              fontSize: 58,
              marginBottom: 8,
            }}
          >
            ♟️
          </div>

          <h1
            style={{
              margin: 0,
              color: GOLD,
              fontFamily:
                "Georgia, serif",
            }}
          >
            Chess
          </h1>

          <p
            style={{
              opacity: 0.75,
              fontSize: 13,
              marginTop: 8,
            }}
          >
            Pilih cara bermain
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 10,
              marginTop: 22,
            }}
          >
            <ModeButton
              active={false}
              onClick={() => {
                setMode("pvp");
              }}
            >
              👥
              <span>
                MULTIPLAYER
              </span>
            </ModeButton>

            <ModeButton
              active
              onClick={() => {
                setMode("bot");
              }}
            >
              🤖
              <span>
                VS BOT
              </span>
            </ModeButton>
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 18,
              borderRadius: 16,
              background:
                "rgba(201,162,39,0.08)",
              border:
                "1px solid rgba(201,162,39,0.25)",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: GOLD,
                marginBottom: 12,
              }}
            >
              🤖 VS BOT
            </div>

            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginBottom: 10,
              }}
            >
              Pilih level bot
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {Object.entries(
                BOT_LEVELS
              ).map(
                ([
                  key,
                  value,
                ]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setBotLevel(
                        key
                      )
                    }
                    style={{
                      ...smallChoice,
                      border:
                        botLevel ===
                        key
                          ? `2px solid ${GOLD}`
                          : "1px solid rgba(201,162,39,0.25)",
                      background:
                        botLevel ===
                        key
                          ? "rgba(201,162,39,0.16)"
                          : "#14110F",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                      }}
                    >
                      {value.emoji}
                    </div>

                    <div>
                      {value.name}
                    </div>
                  </button>
                )
              )}
            </div>

            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                marginTop: 18,
                marginBottom: 10,
              }}
            >
              Pilih warna kamu
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 8,
              }}
            >
              <button
                onClick={() => {
                  setPlayerColor(
                    "white"
                  );

                  setBotColor(
                    "black"
                  );
                }}
                style={{
                  ...smallChoice,
                  border:
                    playerColor ===
                    "white"
                      ? `2px solid ${GOLD}`
                      : "1px solid rgba(201,162,39,0.25)",
                  background:
                    playerColor ===
                    "white"
                      ? "rgba(201,162,39,0.16)"
                      : "#14110F",
                }}
              >
                ⚪ Putih
              </button>

              <button
                onClick={() => {
                  setPlayerColor(
                    "black"
                  );

                  setBotColor(
                    "white"
                  );
                }}
                style={{
                  ...smallChoice,
                  border:
                    playerColor ===
                    "black"
                      ? `2px solid ${GOLD}`
                      : "1px solid rgba(201,162,39,0.25)",
                  background:
                    playerColor ===
                    "black"
                      ? "rgba(201,162,39,0.16)"
                      : "#14110F",
                }}
              >
                ⚫ Hitam
              </button>
            </div>

            <button
              style={{
                ...primaryButton,
                marginTop: 18,
              }}
              onClick={
                startBotGame
              }
            >
              🤖 Mulai VS Bot
            </button>
          </div>

          <button
            style={{
              ...secondaryButton,
              marginTop: 10,
            }}
            onClick={() => {
              window.history.back();
            }}
          >
            ← Kembali
          </button>
        </Panel>
      </Page>
    );
  }

  /* =======================================================
     PVP CREATE / JOIN
  ======================================================= */

  if (
    isPvP &&
    !roomId
  ) {
    return (
      <Page>
        <Panel maxWidth={470}>
          <div
            style={{
              fontSize: 54,
            }}
          >
            ♟️
          </div>

          <h1
            style={{
              margin:
                "8px 0 5px",
              color: GOLD,
              fontFamily:
                "Georgia, serif",
            }}
          >
            Chess Multiplayer
          </h1>

          <p
            style={{
              fontSize: 13,
              opacity: 0.7,
              marginBottom: 22,
            }}
          >
            Buat room baru atau
            masukkan kode room
            temanmu.
          </p>

          <button
            style={primaryButton}
            onClick={
              createRoom
            }
            disabled={loading}
          >
            🎮 Buat Room Baru
          </button>

          <div
            style={{
              margin:
                "16px 0 10px",
              fontSize: 11,
              opacity: 0.55,
            }}
          >
            ATAU
          </div>

          <input
            value={roomInput}
            onChange={(e) =>
              setRoomInput(
                e.target.value.toUpperCase()
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                joinRoom();
              }
            }}
            maxLength={6}
            placeholder="CONTOH: ABC123"
            style={inputStyle}
          />

          <button
            style={secondaryButton}
            onClick={
              joinRoom
            }
            disabled={loading}
          >
            🔑 Gabung Room
          </button>

          {message && (
            <Message>
              {message}
            </Message>
          )}

          <button
            style={{
              ...backButton,
              marginTop: 10,
            }}
            onClick={() => {
              setMode("select");
              clearRoomUrl();
            }}
          >
            ← Kembali
          </button>
        </Panel>
      </Page>
    );
  }

  /* =======================================================
     ROOM LOADING
  ======================================================= */

  if (
    isPvP &&
    roomId &&
    !roomData
  ) {
    return (
      <Page>
        <Panel>
          <div
            style={{
              fontSize: 36,
            }}
          >
            ⏳
          </div>

          <h2
            style={{
              color: GOLD,
            }}
          >
            Memuat Room...
          </h2>

          <div
            style={{
              fontSize: 13,
              opacity: 0.7,
            }}
          >
            Room:{" "}
            <b>{roomId}</b>
          </div>

          <button
            style={{
              ...secondaryButton,
              marginTop: 18,
            }}
            onClick={() => {
              clearRoomUrl();
              setRoomData(null);
              setGameState(null);
              setMode("pvp");
            }}
          >
            ← Kembali
          </button>
        </Panel>
      </Page>
    );
  }

  /* =======================================================
     PVP LOBBY
  ======================================================= */

  if (
    isPvP &&
    roomId &&
    roomData &&
    !gameState
  ) {
    const players =
      roomData.players || {};

    const playerList =
      Object.values(
        players
      );

    const white =
      playerList.find(
        (player) =>
          player?.color ===
          "white"
      ) || null;

    const black =
      playerList.find(
        (player) =>
          player?.color ===
          "black"
      ) || null;

    const opponent =
      playerList.find(
        (player) =>
          player?.id !==
          playerId
      ) || null;

    const isHost =
      roomData.hostId ===
      playerId;

    const bothPlayersReady =
      playerList.length ===
        2 &&
      !!white &&
      !!black;

    return (
      <Page>
        <Panel maxWidth={500}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 10,
            }}
          >
            <div
              style={{
                textAlign:
                  "left",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  opacity: 0.55,
                  letterSpacing: 2,
                }}
              >
                ROOM CODE
              </div>

              <div
                style={{
                  color: GOLD,
                  fontWeight: 900,
                  fontSize: 24,
                  letterSpacing: 4,
                }}
              >
                {roomId}
              </div>
            </div>

            <button
              style={
                smallBack
              }
              onClick={() => {
                clearRoomUrl();

                setRoomData(
                  null
                );

                setGameState(
                  null
                );

                setMode(
                  "select"
                );
              }}
            >
              ← Keluar
            </button>
          </div>

          <div
            style={{
              height: 1,
              background:
                "rgba(201,162,39,0.2)",
              margin:
                "20px 0",
            }}
          />

          <h2
            style={{
              marginTop: 0,
              color: GOLD,
              fontFamily:
                "Georgia, serif",
            }}
          >
            Lobby Chess
          </h2>

          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            {playerList.length}/2
            pemain di room
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 10,
              marginTop: 18,
            }}
          >
            <PlayerSeat
              color="white"
              player={white}
              mine={
                white?.id ===
                playerId
              }
              canChoose={
                !!myPlayer &&
                !gameState &&
                (
                  !white ||
                  white.id ===
                    playerId
                )
              }
              onChoose={() =>
                choosePvPColor(
                  "white"
                )
              }
            />

            <PlayerSeat
              color="black"
              player={black}
              mine={
                black?.id ===
                playerId
              }
              canChoose={
                !!myPlayer &&
                !gameState &&
                (
                  !black ||
                  black.id ===
                    playerId
                )
              }
              onChoose={() =>
                choosePvPColor(
                  "black"
                )
              }
            />
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 12,
              background:
                "rgba(255,255,255,0.04)",
              border:
                "1px solid rgba(201,162,39,0.15)",
              fontSize: 12,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color: GOLD,
                marginBottom: 6,
              }}
            >
              👥 Pemain
            </div>

            <div>
              Kamu:{" "}
              <b>
                {myPlayer?.name ||
                  "Belum masuk"}
              </b>

              {" • "}

              {myColor
                ? myColor ===
                  "white"
                  ? "⚪ Putih"
                  : "⚫ Hitam"
                : "Belum memilih warna"}
            </div>

            <div
              style={{
                marginTop: 5,
                opacity: 0.7,
              }}
            >
              Lawan:{" "}
              <b>
                {opponent
                  ? opponent.name ||
                    "Player"
                  : "Menunggu pemain..."}
              </b>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background:
                "rgba(201,162,39,0.08)",
              fontSize: 12,
            }}
          >
            {!myColor ? (
              <>
                ⚪ Pilih{" "}
                <b>Putih</b>{" "}
                atau ⚫ pilih{" "}
                <b>Hitam</b> untuk
                menentukan bidakmu.
              </>
            ) : playerList.length <
              2 ? (
              <>
                ⏳ Menunggu player
                kedua masuk...
              </>
            ) : bothPlayersReady ? (
              <>
                ✅ Kedua warna sudah
                dipilih. Menunggu
                host memulai game.
              </>
            ) : (
              <>
                ⏳ Menunggu lawan
                memilih warna...
              </>
            )}
          </div>

          {isHost ? (
            <button
              style={{
                ...primaryButton,
                marginTop: 15,
                opacity:
                  bothPlayersReady
                    ? 1
                    : 0.5,
              }}
              disabled={
                !bothPlayersReady
              }
              onClick={
                startPvPGame
              }
            >
              ♟️ Mulai Game
            </button>
          ) : (
            <div
              style={{
                marginTop: 15,
                padding: 14,
                borderRadius: 12,
                background:
                  "rgba(201,162,39,0.08)",
                fontSize: 12,
              }}
            >
              ⏳ Menunggu Host
              memulai game...
            </div>
          )}

          {message && (
            <Message>
              {message}
            </Message>
          )}
        </Panel>
      </Page>
    );
  }

  /* =======================================================
     SAFETY
  ======================================================= */

  if (!gameState) {
    return null;
  }

  /* =======================================================
     BOARD
  ======================================================= */

  const board =
    normalizeBoard(
      gameState.board
    );

  const displayRows =
    myColor === "black"
      ? [...Array(8).keys()].reverse()
      : [...Array(8).keys()];

  const displayCols =
    myColor === "black"
      ? [...Array(8).keys()].reverse()
      : [...Array(8).keys()];

  const isHost =
    isPvP &&
    roomData?.hostId ===
      playerId;

  return (
    <Page alignTop>
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.55,
                letterSpacing: 2,
              }}
            >
              CHESS
            </div>

            <div
              style={{
                color: GOLD,
                fontWeight: 900,
              }}
            >
              {isBotMode
                ? `VS BOT • ${BOT_LEVELS[botLevel].name}`
                : `ROOM ${roomId}`}
            </div>
          </div>

          <div
            style={{
              padding:
                "8px 12px",
              borderRadius: 10,
              background:
                "rgba(201,162,39,0.1)",
              border:
                "1px solid rgba(201,162,39,0.25)",
              fontSize: 12,
            }}
          >
            Kamu:{" "}
            <b
              style={{
                color: GOLD,
              }}
            >
              {myColor ===
              "white"
                ? "Putih"
                : "Hitam"}
            </b>
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 14,
            background:
              status.gameOver
                ? "rgba(201,162,39,0.16)"
                : "rgba(255,255,255,0.04)",
            border:
              "1px solid rgba(201,162,39,0.25)",
            textAlign:
              "center",
            fontWeight: 900,
            color:
              status.gameOver
                ? GOLD
                : CREAM,
            marginBottom: 12,
          }}
        >
          {getStatusText()}
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 620,
            margin: "0 auto",
            aspectRatio:
              "1 / 1",
            display: "grid",
            gridTemplateColumns:
              "repeat(8, 1fr)",
            border:
              `4px solid ${GOLD}`,
            borderRadius: 8,
            overflow: "hidden",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {displayRows.flatMap(
            (row) =>
              displayCols.map(
                (col) => {
                  const piece =
                    board?.[
                      row
                    ]?.[col];

                  const selectedHere =
                    selected?.row ===
                      row &&
                    selected?.col ===
                      col;

                  const validHere =
                    isValidDestination(
                      row,
                      col
                    );

                  const checkedHere =
                    checkedKing?.row ===
                      row &&
                    checkedKing?.col ===
                      col;

                  const dark =
                    (row + col) %
                      2 ===
                    1;

                  return (
                    <button
                      key={`${row}-${col}`}
                      onClick={() =>
                        handleSquareClick(
                          row,
                          col
                        )
                      }
                      style={{
                        position:
                          "relative",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        aspectRatio:
                          "1 / 1",
                        cursor:
                          gameState.turn ===
                            myColor &&
                          !status.gameOver
                            ? "pointer"
                            : "default",
                        background:
                          checkedHere
                            ? "#8d2b22"
                            : selectedHere
                            ? "#b68a20"
                            : dark
                            ? "#6B4226"
                            : "#D8B878",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        userSelect:
                          "none",
                      }}
                    >
                      {validHere && (
                        <div
                          style={{
                            position:
                              "absolute",
                            width:
                              piece
                                ? "72%"
                                : "22%",
                            height:
                              piece
                                ? "72%"
                                : "22%",
                            borderRadius:
                              "50%",
                            background:
                              piece
                                ? "transparent"
                                : "rgba(20,17,15,0.5)",
                            border:
                              piece
                                ? `4px solid rgba(201,162,39,0.9)`
                                : "none",
                            zIndex: 1,
                            pointerEvents:
                              "none",
                          }}
                        />
                      )}

                      {piece && (
                        <span
                          style={{
                            position:
                              "relative",
                            zIndex: 2,
                            fontSize:
                              "clamp(30px, 7vw, 58px)",
                            lineHeight: 1,
                            filter:
                              "drop-shadow(0 2px 1px rgba(0,0,0,0.45))",
                            color:
                              pieceColor(
                                piece
                              ) ===
                              "white"
                                ? "#F5EFE0"
                                : "#17110E",
                            textShadow:
                              pieceColor(
                                piece
                              ) ===
                              "white"
                                ? "0 2px 2px rgba(0,0,0,.8)"
                                : "0 1px 1px rgba(255,255,255,.35)",
                          }}
                        >
                          {getPieceSymbol(
                            piece
                          )}
                        </span>
                      )}

                      {row ===
                        displayRows[0] && (
                        <span
                          style={{
                            position:
                              "absolute",
                            top: 2,
                            left: 4,
                            fontSize: 9,
                            opacity:
                              0.45,
                            pointerEvents:
                              "none",
                          }}
                        >
                          {8 -
                            row}
                        </span>
                      )}

                      {col ===
                        displayCols[7] && (
                        <span
                          style={{
                            position:
                              "absolute",
                            bottom: 2,
                            right: 4,
                            fontSize: 9,
                            opacity:
                              0.45,
                            pointerEvents:
                              "none",
                          }}
                        >
                          {String.fromCharCode(
                            97 +
                              col
                          )}
                        </span>
                      )}
                    </button>
                  );
                }
              )
          )}
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background:
              "rgba(255,255,255,0.04)",
            textAlign:
              "center",
            fontSize: 12,
            opacity: 0.75,
          }}
        >
          {gameState.message ||
            "Pilih bidak untuk melihat langkah yang tersedia."}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent:
              "center",
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          {isBotMode && (
            <>
              <button
                style={
                  secondaryButton
                }
                onClick={
                  resetBotGame
                }
              >
                🔄 Rematch
              </button>

              <button
                style={
                  secondaryButton
                }
                onClick={
                  returnToModeSelect
                }
              >
                ← Pilih Mode
              </button>
            </>
          )}

          {isPvP && (
            <>
              {isHost && (
                <button
                  style={
                    secondaryButton
                  }
                  onClick={
                    resetPvPGame
                  }
                >
                  🔄 Reset Game
                </button>
              )}

              <button
                style={
                  secondaryButton
                }
                onClick={() => {
                  clearRoomUrl();

                  setRoomData(
                    null
                  );

                  setGameState(
                    null
                  );

                  setMode(
                    "select"
                  );
                }}
              >
                ← Keluar Room
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===================================================
          PROMOTION MODAL
      =================================================== */}

      {pendingPromotion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              background:
                "#211813",
              border:
                "1px solid rgba(201,162,39,0.5)",
              borderRadius: 18,
              padding: 22,
              textAlign:
                "center",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.6)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: GOLD,
                fontFamily:
                  "Georgia, serif",
              }}
            >
              ♛ Pilih Promosi
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, 1fr)",
                gap: 8,
              }}
            >
              {PROMOTION_OPTIONS.map(
                (option) => (
                  <button
                    key={
                      option.type
                    }
                    onClick={() =>
                      choosePromotion(
                        option.type
                      )
                    }
                    style={{
                      border:
                        "1px solid rgba(201,162,39,0.35)",
                      borderRadius: 12,
                      background:
                        "#14110F",
                      color: CREAM,
                      padding:
                        "12px 6px",
                      cursor:
                        "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 32,
                      }}
                    >
                      {
                        option.label
                      }
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        marginTop: 5,
                      }}
                    >
                      {
                        option.name
                      }
                    </div>
                  </button>
                )
              )}
            </div>

            <button
              style={{
                ...secondaryButton,
                marginTop: 12,
              }}
              onClick={() => {
                setPendingPromotion(
                  null
                );
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function Page({
  children,
  alignTop = false,
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: BG,
        color: CREAM,
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          alignTop
            ? "flex-start"
            : "center",
        padding: 20,
        boxSizing:
          "border-box",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      {children}
    </div>
  );
}

function Panel({
  children,
  maxWidth = 460,
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth,
        background:
          "linear-gradient(180deg, #241A15, #17110E)",
        border:
          "1px solid rgba(201,162,39,0.35)",
        borderRadius: 20,
        padding: 26,
        boxSizing:
          "border-box",
        textAlign:
          "center",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.45)",
      }}
    >
      {children}
    </div>
  );
}

function ModeButton({
  children,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border:
          active
            ? `2px solid ${GOLD}`
            : "1px solid rgba(201,162,39,0.25)",
        borderRadius: 14,
        background:
          active
            ? "rgba(201,162,39,0.13)"
            : "#14110F",
        color: CREAM,
        padding: 14,
        cursor: "pointer",
        fontWeight: 900,
        display: "flex",
        flexDirection:
          "column",
        alignItems:
          "center",
        gap: 5,
      }}
    >
      <span
        style={{
          fontSize: 25,
        }}
      >
        {children[0]}
      </span>

      <span
        style={{
          fontSize: 11,
        }}
      >
        {children[1]}
      </span>
    </button>
  );
}

function PlayerSeat({
  color,
  player,
  mine,
  canChoose,
  onChoose,
}) {
  const isWhite =
    color === "white";

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        background:
          "rgba(255,255,255,0.04)",
        border:
          mine
            ? `2px solid ${GOLD}`
            : player
            ? "2px solid rgba(201,162,39,0.5)"
            : "1px solid rgba(201,162,39,0.2)",
      }}
    >
      <div
        style={{
          fontSize: 28,
        }}
      >
        {isWhite
          ? "⚪"
          : "⚫"}
      </div>

      <div
        style={{
          fontWeight: 900,
          marginTop: 5,
        }}
      >
        {isWhite
          ? "Putih"
          : "Hitam"}
      </div>

      <div
        style={{
          fontSize: 11,
          opacity: 0.65,
          marginTop: 4,
        }}
      >
        {player
          ? player.name ||
            "Player"
          : "Kosong"}
      </div>

      {mine && (
        <div
          style={{
            marginTop: 7,
            fontSize: 10,
            color: GOLD,
            fontWeight: 900,
          }}
        >
          KAMU
        </div>
      )}

      {canChoose && (
        <button
          onClick={onChoose}
          style={{
            marginTop: 10,
            width: "100%",
            minHeight: 36,
            borderRadius: 9,
            border:
              `1px solid ${GOLD}`,
            background:
              player?.color ===
              color
                ? "rgba(201,162,39,0.2)"
                : "#14110F",
            color: CREAM,
            fontSize: 11,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {mine &&
          player?.color ===
            color
            ? "✓ Dipilih"
            : `Pilih ${
                isWhite
                  ? "Putih"
                  : "Hitam"
              }`}
        </button>
      )}
    </div>
  );
}

function Message({
  children,
}) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 10,
        borderRadius: 10,
        background:
          "rgba(201,162,39,0.08)",
        color: CREAM,
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const primaryButton = {
  width: "100%",
  minHeight: 48,
  border: "none",
  borderRadius: 12,
  background:
    "linear-gradient(180deg, #D7B52F, #A98213)",
  color: "#17110E",
  fontWeight: 900,
  cursor: "pointer",
  padding: "0 16px",
  boxShadow:
    "0 8px 20px rgba(0,0,0,0.25)",
};

const secondaryButton = {
  width: "100%",
  minHeight: 46,
  border:
    "1px solid rgba(201,162,39,0.45)",
  borderRadius: 12,
  background: "#14110F",
  color: CREAM,
  fontWeight: 800,
  cursor: "pointer",
  padding: "0 16px",
};

const backButton = {
  width: "100%",
  minHeight: 44,
  border: "none",
  background: "transparent",
  color: CREAM,
  opacity: 0.7,
  cursor: "pointer",
};

const smallBack = {
  border:
    "1px solid rgba(201,162,39,0.3)",
  borderRadius: 10,
  background: "#14110F",
  color: CREAM,
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: 11,
};

const inputStyle = {
  width: "100%",
  height: 56,
  boxSizing: "border-box",
  borderRadius: 14,
  border:
    "1px solid rgba(201,162,39,0.75)",
  background: "#14110F",
  color: CREAM,
  outline: "none",
  textAlign: "center",
  fontSize: 20,
  fontWeight: 900,
  letterSpacing: 5,
  padding: "0 16px",
  textTransform: "uppercase",
  boxShadow:
    "inset 0 2px 8px rgba(0,0,0,0.35)",
  marginBottom: 10,
};

const smallChoice = {
  minHeight: 54,
  borderRadius: 12,
  color: CREAM,
  fontWeight: 800,
  cursor: "pointer",
  padding: 8,
};

/* =========================================================
   EXPORT
========================================================= */

export { Chess };
export default Chess;