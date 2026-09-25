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

function generateRoomCode() {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

function getPlayerId() {
  const key = "rgamehub_chess_player_id";

  let id = localStorage.getItem(key);

  if (!id) {
    id =
      "chess_" +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36);

    localStorage.setItem(key, id);
  }

  return id;
}

/*
  Firebase tidak menerima undefined.
  Jadi state chess kita bersihkan dulu sebelum
  dikirim ke database.
*/
function cleanForFirebase(value) {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(cleanForFirebase);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const result = {};

    Object.entries(value).forEach(
      ([key, val]) => {
        if (val !== undefined) {
          result[key] =
            cleanForFirebase(val);
        }
      }
    );

    return result;
  }

  return value;
}

function createCleanInitialState() {
  return cleanForFirebase(
    createInitialState()
  );
}

function normalizeBoard(board) {
  if (!Array.isArray(board)) {
    return createInitialState().board;
  }

  return board.map((row) =>
    Array.isArray(row)
      ? [...row]
      : Array(8).fill(null)
  );
}

function normalizeGameState(game) {
  if (!game) return null;

  const initial =
    createInitialState();

  return {
    ...initial,
    ...game,
    board: normalizeBoard(
      game.board
    ),
    turn:
      game.turn || "white",
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

  if (typeof piece === "string") {
    return piece === piece.toUpperCase()
      ? "white"
      : "black";
  }

  return piece.color || null;
}

function pieceType(piece) {
  if (!piece) return null;

  if (typeof piece === "string") {
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
        state.board?.[row]?.[col];

      if (!piece) continue;

      if (
        pieceColor(piece) !== color
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
  switch (pieceType(piece)) {
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
        state.board?.[row]?.[col];

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
      state.board?.[
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

      const captured =
        target
          ? state.board?.[
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
        state.board?.[
          target.row
        ]?.[target.col];

      if (captured) {
        score +=
          materialValue(
            captured
          ) * 0.8;
      }
    }

    if (score > bestScore) {
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

export function Chess() {
  const playerIdRef =
    useRef(getPlayerId());

  const playerId =
    playerIdRef.current;

  const botTimerRef =
    useRef(null);

  const botBusyRef =
    useRef(false);

  const [mode, setMode] =
    useState(() =>
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

  /*
    ==========================
    FIREBASE ROOM LISTENER
    ==========================
  */

  useEffect(() => {
    if (!isPvP || !roomId) {
      return;
    }

    const roomRef = ref(
      db,
      `chessRooms/${roomId}`
    );

    const unsubscribe =
      onValue(
        roomRef,
        (snapshot) => {
          const data =
            snapshot.val();

          if (!data) {
            setRoomData(null);
            setGameState(null);
            return;
          }

          setRoomData(data);

          if (data.game) {
            setGameState(
              normalizeGameState(
                data.game
              )
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
            "Gagal membaca room Firebase."
          );
        }
      );

    return () =>
      unsubscribe();
  }, [
    roomId,
    isPvP,
  ]);

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

  /*
    ==========================
    CREATE ROOM
    ==========================
  */

  async function createRoom() {
    setLoading(true);
    setMessage("");

    try {
      const code =
        generateRoomCode();

      const roomDataToCreate = {
        createdAt: Date.now(),

        hostId: playerId,

        players: {
          [playerId]: {
            id: playerId,
            name: "Player 1",
            number: 1,
            color: null,
          },
        },

        game: null,
      };

      await set(
        ref(
          db,
          `chessRooms/${code}`
        ),
        roomDataToCreate
      );

      openRoomUrl(code);
    } catch (error) {
      console.error(
        "CREATE ROOM ERROR:",
        error
      );

      setMessage(
        `Gagal membuat room${
          error?.code
            ? ` (${error.code})`
            : ""
        }.`
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    ==========================
    JOIN ROOM
    ==========================
  */

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
      const roomRef = ref(
        db,
        `chessRooms/${code}`
      );

      let joinError = "";

      const result =
        await runTransaction(
          roomRef,
          (current) => {
            if (!current) {
              joinError =
                "Room tidak ditemukan.";
              return;
            }

            const players =
              current.players || {};

            /*
              Kalau player ini sudah
              ada di room, jangan tambah
              player kedua.
            */
            if (
              players[playerId]
            ) {
              return current;
            }

            /*
              Hanya maksimal 2 player.
            */
            const entries =
              Object.entries(
                players
              );

            if (
              entries.length >= 2
            ) {
              joinError =
                "Room sudah penuh.";
              return;
            }

            const nextNumber =
              entries.length + 1;

            return {
              ...current,

              players: {
                ...players,

                [playerId]: {
                  id: playerId,
                  name: `Player ${nextNumber}`,
                  number:
                    nextNumber,
                  color: null,
                },
              },
            };
          }
        );

      if (
        joinError &&
        !result.committed
      ) {
        setMessage(joinError);
        return;
      }

      if (!result.committed) {
        setMessage(
          "Gagal bergabung ke room."
        );
        return;
      }

      openRoomUrl(code);
    } catch (error) {
      console.error(
        "JOIN ROOM ERROR:",
        error
      );

      setMessage(
        `Gagal bergabung ke room${
          error?.code
            ? ` (${error.code})`
            : ""
        }.`
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    ==========================
    CURRENT PLAYER COLOR
    ==========================
  */

  const myColor = useMemo(() => {
    if (isBotMode) {
      return playerColor;
    }

    if (
      !roomData?.players
    ) {
      return null;
    }

    return (
      roomData.players[
        playerId
      ]?.color || null
    );
  }, [
    roomData,
    playerId,
    isBotMode,
    playerColor,
  ]);

  /*
    ==========================
    LOBBY DATA
    ==========================
  */

  const lobbyPlayers =
    useMemo(() => {
      const players =
        roomData?.players || {};

      return Object.entries(
        players
      )
        .map(
          ([id, player]) => ({
            id,
            ...player,
          })
        )
        .sort(
          (a, b) =>
            (a.number || 99) -
            (b.number || 99)
        );
    }, [
      roomData,
    ]);

  const whitePlayer =
    useMemo(() => {
      return (
        lobbyPlayers.find(
          (player) =>
            player.color ===
            "white"
        ) || null
      );
    }, [
      lobbyPlayers,
    ]);

  const blackPlayer =
    useMemo(() => {
      return (
        lobbyPlayers.find(
          (player) =>
            player.color ===
            "black"
        ) || null
      );
    }, [
      lobbyPlayers,
    ]);

  const currentLobbyPlayer =
    useMemo(() => {
      return (
        lobbyPlayers.find(
          (player) =>
            player.id ===
            playerId
        ) || null
      );
    }, [
      lobbyPlayers,
      playerId,
    ]);

  const opponentLobbyPlayer =
    useMemo(() => {
      return (
        lobbyPlayers.find(
          (player) =>
            player.id !==
            playerId
        ) || null
      );
    }, [
      lobbyPlayers,
      playerId,
    ]);

  /*
    ==========================
    CHOOSE PVP COLOR
    ==========================
  */

  async function choosePvPColor(
    color
  ) {
    if (!roomId) return;

    setMessage("");

    try {
      const roomRef = ref(
        db,
        `chessRooms/${roomId}`
      );

      let colorError = "";

      const result =
        await runTransaction(
          roomRef,
          (current) => {
            if (!current) {
              colorError =
                "Room tidak ditemukan.";
              return;
            }

            if (current.game) {
              colorError =
                "Game sudah dimulai.";
              return;
            }

            const players =
              current.players || {};

            const me =
              players[playerId];

            if (!me) {
              colorError =
                "Kamu tidak terdaftar di room.";
              return;
            }

            /*
              Cek apakah warna sudah
              dipakai player lain.
            */
            const occupiedByOther =
              Object.entries(
                players
              ).some(
                ([id, player]) =>
                  id !== playerId &&
                  player?.color ===
                    color
              );

            if (
              occupiedByOther
            ) {
              colorError =
                color === "white"
                  ? "Bidak Putih sudah dipilih player lain."
                  : "Bidak Hitam sudah dipilih player lain.";

              return;
            }

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
        colorError &&
        !result.committed
      ) {
        setMessage(
          colorError
        );
        return;
      }

      if (!result.committed) {
        setMessage(
          "Gagal memilih warna."
        );
      }
    } catch (error) {
      console.error(
        "CHOOSE COLOR ERROR:",
        error
      );

      setMessage(
        `Gagal memilih warna${
          error?.code
            ? ` (${error.code})`
            : ""
        }.`
      );
    }
  }

  /*
    ==========================
    START PVP GAME
    ==========================
  */

  async function startPvPGame() {
    if (!roomId) {
      setMessage(
        "Room belum tersedia."
      );
      return;
    }

    const players =
      roomData?.players || {};

    const playerEntries =
      Object.values(players);

    if (
      playerEntries.length !== 2
    ) {
      setMessage(
        "Harus ada 2 pemain di room."
      );
      return;
    }

    if (
      !whitePlayer ||
      !blackPlayer
    ) {
      setMessage(
        "Kedua pemain harus memilih warna."
      );
      return;
    }

    if (
      roomData?.hostId !==
      playerId
    ) {
      setMessage(
        "Hanya host yang dapat memulai game."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const roomRef = ref(
        db,
        `chessRooms/${roomId}`
      );

      const result =
        await runTransaction(
          roomRef,
          (current) => {
            if (!current) {
              return;
            }

            if (
              current.hostId !==
              playerId
            ) {
              return;
            }

            const currentPlayers =
              current.players ||
              {};

            const entries =
              Object.values(
                currentPlayers
              );

            if (
              entries.length !== 2
            ) {
              return;
            }

            const hasWhite =
              entries.some(
                (player) =>
                  player?.color ===
                  "white"
              );

            const hasBlack =
              entries.some(
                (player) =>
                  player?.color ===
                  "black"
              );

            if (
              !hasWhite ||
              !hasBlack
            ) {
              return;
            }

            /*
              INI BAGIAN PENTING.
              State dibersihkan supaya
              Firebase tidak menerima
              undefined.
            */
            const initialGame =
              createCleanInitialState();

            return {
              ...current,
              game: initialGame,
              gameStarted: true,
            };
          }
        );

      if (!result.committed) {
        setMessage(
          "Game tidak dapat dimulai. Pastikan 2 pemain dan kedua warna sudah dipilih."
        );
        return;
      }

      setMessage("");
    } catch (error) {
      console.error(
        "START GAME ERROR:",
        error
      );

      setMessage(
        `Gagal memulai game${
          error?.code
            ? ` (${error.code})`
            : ""
        }.`
      );
    } finally {
      setLoading(false);
    }
  }

  /*
    ==========================
    BOT GAME
    ==========================
  */

  function startBotGame() {
    const initial =
      createCleanInitialState();

    setGameState(
      normalizeGameState(
        initial
      )
    );

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

  /*
    ==========================
    GAME STATUS
    ==========================
  */

  const status = useMemo(() => {
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
        return status.winner ===
          playerColor
          ? "♛ SKAKMAT! Kamu menang"
          : "♛ SKAKMAT! Bot menang";
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

  /*
    ==========================
    LEGAL MOVES
    ==========================
  */

  const validMoves =
    useMemo(() => {
      if (
        !gameState ||
        !selected
      ) {
        return [];
      }

      if (
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
          getMoveTarget(move);

        return (
          target?.row === row &&
          target?.col === col
        );
      }
    );
  }

  /*
    ==========================
    EXECUTE MOVE
    ==========================
  */

  async function executeMove(
    from,
    move,
    promotion = "queen"
  ) {
    if (!gameState) {
      return;
    }

    if (
      gameState.turn !==
      myColor
    ) {
      return;
    }

    if (status.gameOver) {
      return;
    }

    /*
      BOT
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
      PVP
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

    try {
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

            return cleanForFirebase(
              applyMove(
                normalized,
                from.row,
                from.col,
                selectedMove,
                promotion
              )
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
    } catch (error) {
      console.error(
        "MOVE ERROR:",
        error
      );

      setMessage(
        `Gagal mengirim langkah${
          error?.code
            ? ` (${error.code})`
            : ""
        }.`
      );
    }
  }

  /*
    ==========================
    BOARD CLICK
    ==========================
  */

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
      (row === 0 ||
        row === 7);

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

  /*
    ==========================
    BOT AI LOOP
    ==========================
  */

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

    if (botBusyRef.current) {
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
                target.row ===
                  0 ||
                target.row ===
                  7
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
              setGameState(next);
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
        createCleanInitialState()
      )
    );

    setSelected(null);
    setPendingPromotion(null);
  }

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

    try {
      await set(
        ref(
          db,
          `chessRooms/${roomId}/game`
        ),
        createCleanInitialState()
      );

      setSelected(null);
      setPendingPromotion(null);
      setMessage("");
    } catch (error) {
      console.error(
        "RESET GAME ERROR:",
        error
      );

      setMessage(
        "Gagal reset game."
      );
    }
  }

  /*
    ==========================
    CHECKED KING
    ==========================
  */

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

  /*
    ==========================
    MODE SELECT
    ==========================
  */

  if (mode === "select") {
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
              icon="👥"
              label="MULTIPLAYER"
              onClick={() =>
                setMode("pvp")
              }
            />

            <ModeButton
              active
              icon="🤖"
              label="VS BOT"
              onClick={() =>
                setMode("bot")
              }
            />
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
                ([key, value]) => (
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
            onClick={() =>
              window.history.back()
            }
          >
            ← Kembali
          </button>
        </Panel>
      </Page>
    );
  }

  /*
    ==========================
    PVP ROOM ENTRY
    ==========================
  */

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
                e.key ===
                "Enter"
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

  /*
    ==========================
    LOADING ROOM
    ==========================
  */

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
        </Panel>
      </Page>
    );
  }

  /*
    ==========================
    PVP LOBBY
    ==========================
  */

  if (
    isPvP &&
    roomId &&
    roomData &&
    !gameState
  ) {
    const players =
      roomData.players || {};

    const playerCount =
      lobbyPlayers.length;

    const isHost =
      roomData.hostId ===
      playerId;

    const bothPlayers =
      playerCount === 2;

    const bothColors =
      !!whitePlayer &&
      !!blackPlayer;

    const canStart =
      isHost &&
      bothPlayers &&
      bothColors;

    return (
      <Page>
        <Panel maxWidth={560}>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
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
              style={smallBack}
              onClick={() => {
                clearRoomUrl();
                setRoomData(
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
              marginBottom: 8,
            }}
          >
            Lobby Chess
          </h2>

          <div
            style={{
              fontSize: 13,
              opacity: 0.7,
              marginBottom: 18,
            }}
          >
            {playerCount}/2 pemain
            di room
          </div>

          /*
            ======================
            WARNA
            ======================
          */

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 10,
            }}
          >
            <ColorSeat
              color="white"
              player={
                whitePlayer
              }
              mine={
                whitePlayer?.id ===
                playerId
              }
              selected={
                myColor ===
                "white"
              }
              onChoose={() =>
                choosePvPColor(
                  "white"
                )
              }
              disabled={
                !currentLobbyPlayer ||
                (
                  !!whitePlayer &&
                  whitePlayer.id !==
                    playerId
                )
              }
            />

            <ColorSeat
              color="black"
              player={
                blackPlayer
              }
              mine={
                blackPlayer?.id ===
                playerId
              }
              selected={
                myColor ===
                "black"
              }
              onChoose={() =>
                choosePvPColor(
                  "black"
                )
              }
              disabled={
                !currentLobbyPlayer ||
                (
                  !!blackPlayer &&
                  blackPlayer.id !==
                    playerId
                )
              }
            />
          </div>

          /*
            ======================
            PLAYER INFO
            ======================
          */

          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              background:
                "rgba(255,255,255,0.04)",
              border:
                "1px solid rgba(201,162,39,0.2)",
              textAlign: "left",
            }}
          >
            <div
              style={{
                color: GOLD,
                fontWeight: 900,
                marginBottom: 8,
              }}
            >
              👥 Pemain
            </div>

            {lobbyPlayers.map(
              (player) => (
                <div
                  key={
                    player.id
                  }
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: 10,
                    padding:
                      "7px 0",
                    borderBottom:
                      "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div>
                    <b>
                      {player.name ||
                        "Player"}
                    </b>

                    {player.id ===
                      playerId && (
                      <span
                        style={{
                          marginLeft: 6,
                          color: GOLD,
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        KAMU
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.75,
                    }}
                  >
                    {player.color ===
                    "white"
                      ? "⚪ Putih"
                      : player.color ===
                        "black"
                      ? "⚫ Hitam"
                      : "🎨 Belum pilih"}
                  </div>
                </div>
              )
            )}

            {opponentLobbyPlayer ===
              null &&
              playerCount <
                2 && (
              <div
                style={{
                  paddingTop: 10,
                  fontSize: 12,
                  opacity: 0.65,
                }}
              >
                ⏳ Menunggu player
                kedua masuk...
              </div>
            )}
          </div>

          /*
            ======================
            STATUS
            ======================
          */

          {!bothPlayers && (
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
              ⏳ Menunggu player
              kedua masuk...
            </div>
          )}

          {bothPlayers &&
            !bothColors && (
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
                🎨 Kedua pemain
                harus memilih warna
                masing-masing.
              </div>
            )}

          {bothPlayers &&
            bothColors &&
            !isHost && (
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
                ✅ Kedua warna sudah
                dipilih. Menunggu
                host memulai game.
              </div>
            )}

          {message && (
            <Message>
              {message}
            </Message>
          )}

          /*
            ======================
            START BUTTON
            ======================
          */

          {isHost && (
            <button
              style={{
                ...primaryButton,
                marginTop: 15,
                opacity: canStart
                  ? 1
                  : 0.45,
                cursor: canStart
                  ? "pointer"
                  : "not-allowed",
              }}
              disabled={
                !canStart ||
                loading
              }
              onClick={
                startPvPGame
              }
            >
              {loading
                ? "⏳ Memulai..."
                : "♟️ Mulai Game"}
            </button>
          )}
        </Panel>
      </Page>
    );
  }

  /*
    ==========================
    SAFETY
    ==========================
  */

  if (!gameState) {
    return null;
  }

  const board =
    gameState.board || [];

  const displayRows =
    myColor === "black"
      ? [
          ...Array(8).keys(),
        ].reverse()
      : [
          ...Array(8).keys(),
        ];

  const displayCols =
    myColor === "black"
      ? [
          ...Array(8).keys(),
        ].reverse()
      : [
          ...Array(8).keys(),
        ];

  const isHost =
    isPvP &&
    roomData?.hostId ===
      playerId;

  /*
    ==========================
    GAME BOARD
    ==========================
  */

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
            aspectRatio: "1 / 1",
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
                        border:
                          "none",
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
                          {8 - row}
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
                            97 + col
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
            flexWrap:
              "wrap",
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

      /*
        ======================
        PROMOTION MODAL
        ======================
      */

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
              onClick={() =>
                setPendingPromotion(
                  null
                )
              }
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}

/*
  ==========================
  UI COMPONENTS
  ==========================
*/

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
        alignItems: alignTop
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
  icon,
  label,
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
        {icon}
      </span>

      <span
        style={{
          fontSize: 11,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function ColorSeat({
  color,
  player,
  mine,
  selected,
  onChoose,
  disabled,
}) {
  const isWhite =
    color === "white";

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background:
          "rgba(255,255,255,0.04)",
        border:
          selected
            ? `2px solid ${GOLD}`
            : "1px solid rgba(201,162,39,0.2)",
        opacity:
          disabled && !selected
            ? 0.75
            : 1,
      }}
    >
      <div
        style={{
          fontSize: 30,
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
          minHeight: 17,
        }}
      >
        {player
          ? player.name ||
            "Player"
          : "Belum dipilih"}
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

      {!player && !disabled && (
        <button
          onClick={onChoose}
          style={{
            width: "100%",
            marginTop: 10,
            border:
              "1px solid rgba(201,162,39,0.7)",
            borderRadius: 10,
            background:
              "#14110F",
            color: CREAM,
            padding:
              "10px 8px",
            cursor:
              "pointer",
            fontWeight: 800,
          }}
        >
          Pilih{" "}
          {isWhite
            ? "Putih"
            : "Hitam"}
        </button>
      )}

      {mine && (
        <button
          onClick={onChoose}
          disabled={disabled}
          style={{
            width: "100%",
            marginTop: 10,
            border:
              selected
                ? `1px solid ${GOLD}`
                : "1px solid rgba(201,162,39,0.35)",
            borderRadius: 10,
            background:
              selected
                ? "rgba(201,162,39,0.16)"
                : "#14110F",
            color: CREAM,
            padding:
              "10px 8px",
            cursor: disabled
              ? "not-allowed"
              : "pointer",
            fontWeight: 800,
          }}
        >
          {selected
            ? "✓ Dipilih"
            : `Pilih ${
                isWhite
                  ? "Putih"
                  : "Hitam"
              }`}
        </button>
      )}

      {player &&
        !mine && (
          <div
            style={{
              marginTop: 10,
              fontSize: 10,
              opacity: 0.55,
            }}
          >
            Dipilih player lain
          </div>
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
  textTransform:
    "uppercase",
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

/*
  IMPORTANT:
  Named export + default export.
*/
export default Chess;