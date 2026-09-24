import React, { useEffect, useState } from "react";

import { BomBomArena3D } from "./BomBomArena3D";

import { db } from "./firebase";

import {
  onValue,
  push,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#1a1310";

const MAX_PLAYERS = 8;
const ROUND_TIME = 15;

const CHARACTERS = [
  {
    id: "fanzi",
    name: "Fanzi",
    emoji: "⚡",
    
  },
  {
    id: "echa",
    name: "Echa",
    emoji: "🌸",
    
  },
  {
    id: "andy",
    name: "Andy",
    emoji: "🧢",
    
  },
  {
    id: "kevin",
    name: "Kevin",
    emoji: "🤖",
    
  },
  {
    id: "sherina",
    name: "Sherina",
    emoji: "🌷",
    
  },
  {
    id: "maled",
    name: "Male D",
    emoji: "🧍",
    
  },
  {
    id: "malee",
    name: "Male E",
    emoji: "🔥",
    
  },
  {
    id: "femalec",
    name: "Female C",
    emoji: "✨",
    
  },
];

function makeRoomCode() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];
  }

  return code;
}

function getPlayerId() {
  let id =
    sessionStorage.getItem(
      "bomBomPlayerId"
    );

  if (!id) {
    id = push(
      ref(db, "bomBomPlayerIds")
    ).key;

    sessionStorage.setItem(
      "bomBomPlayerId",
      id
    );
  }

  return id;
}

function getBotName(number) {
  return `Bot ${number}`;
}

function getBotCharacter(index) {
  const characters = [
    "fanzi",
    "echa",
    "andy",
    "kevin",
    "sherina",
    "maled",
    "malee",
    "femalec",
  ];

  return characters[index % characters.length];
}

function getSpawnPosition(playerNumber) {
  const spawns = [
    [-7, -4],
    [0, -4],
    [7, -4],
    [-7, 4],
    [0, 4],
    [7, 4],
    [-3.5, 0],
    [3.5, 0],
  ];

  const spawn =
    spawns[
      (playerNumber - 1) %
        spawns.length
    ];

  return {
    x: spawn[0],
    y: 1,
    z: spawn[1],
  };
}

function BomBomGame() {
  const [roomCode, setRoomCode] =
    useState(null);

  const [screen, setScreen] =
    useState("menu");

  const [joinCode, setJoinCode] =
    useState("");

  const [players, setPlayers] =
    useState({});

  const [game, setGame] =
    useState({
      status: "waiting",
    });

  const [error, setError] =
    useState("");

  const playerId =
    getPlayerId();

  // ========================================
  // AMBIL ROOM DARI URL
  // ========================================

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const gameParam =
      params.get("game");

    const roomParam =
      params.get("room");

    if (
      gameParam === "bom-bom" &&
      roomParam
    ) {
      setRoomCode(
        roomParam.toUpperCase()
      );

      setScreen("room");
    }
  }, []);

  // ========================================
  // FIREBASE ROOM LISTENER
  // ========================================

  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(
      db,
      `bomBomRooms/${roomCode}`
    );

    const unsubscribe =
      onValue(
        roomRef,
        (snapshot) => {
          const data =
            snapshot.val();

          if (!data) {
            setError(
              "Room tidak ditemukan."
            );

            return;
          }

          setPlayers(
            data.players || {}
          );

          setGame(
            data.game || {
              status: "waiting",
            }
          );

          setError("");
        },
        (err) => {
          console.error(
            "Firebase room error:",
            err
          );

          setError(
            "Gagal terhubung ke room."
          );
        }
      );

    return () =>
      unsubscribe();
  }, [roomCode]);

  // ========================================
  // DATA PEMAIN
  // ========================================

  const sortedPlayers =
    Object.entries(players)
      .map(([id, player]) => ({
        id,
        ...player,
      }))
      .sort(
        (a, b) =>
          (a.playerNumber ||
            999) -
          (b.playerNumber ||
            999)
      );

  const currentPlayer =
    players[playerId];

  const isHost =
    currentPlayer?.playerNumber ===
    1;

  const selectedCharacter =
    currentPlayer?.character ||
    null;

  const allPlayersSelected =
    sortedPlayers.length > 0 &&
    sortedPlayers.every(
      (player) =>
        player.character
    );

  // ========================================
  // TIMER + ELIMINASI + RONDE BERIKUTNYA
  // ========================================

  useEffect(() => {
    if (!roomCode) return;

    // Hanya HOST yang menjalankan timer
    if (!isHost) return;

    // Timer hanya aktif ketika arena
    if (game.status !== "arena") {
      return;
    }

    if (!game.roundStartedAt) {
      return;
    }

    const timer =
      setInterval(async () => {
        const elapsed =
          (Date.now() -
            game.roundStartedAt) /
          1000;

        if (elapsed < ROUND_TIME) {
          return;
        }

        try {
          const roomRef = ref(
            db,
            `bomBomRooms/${roomCode}`
          );

          await runTransaction(
            roomRef,
            (room) => {
              if (!room) {
                return;
              }

              // Pastikan masih arena
              if (
                !room.game ||
                room.game.status !==
                  "arena"
              ) {
                return;
              }

              // Pastikan ronde yang diproses
              // masih ronde yang sama
              if (
                room.game
                  .roundStartedAt !==
                game.roundStartedAt
              ) {
                return;
              }

              const roomPlayers =
                room.players || {};

              const holderId =
                room.game
                  .bombHolderId;

              if (!holderId) {
                return;
              }

              const holder =
                roomPlayers[
                  holderId
                ];

              if (!holder) {
                return;
              }

              // Jangan eliminasi pemain
              // yang sudah mati
              if (
                holder.alive === false
              ) {
                return;
              }

              // ========================================
              // ELIMINASI PEMEGANG BOM
              // ========================================

              const nextPlayers = {
                ...roomPlayers,
              };

              nextPlayers[
                holderId
              ] = {
                ...holder,

                alive: false,

                eliminatedRound:
                  room.game.round ||
                  1,
              };

              // Cari pemain yang masih hidup
              const alivePlayers =
                Object.entries(
                  nextPlayers
                ).filter(
                  ([, player]) =>
                    player.alive !==
                    false
                );

              // ========================================
              // TINGGAL 1 = PEMENANG
              // ========================================

              if (
                alivePlayers.length ===
                1
              ) {
                const winner =
                  alivePlayers[0];

                return {
                  ...room,

                  players:
                    nextPlayers,

                  game: {
                    ...room.game,

                    status: "winner",

                    winnerId:
                      winner[0],

                    eliminatedPlayerId:
                      holderId,

                    roundEnded:
                      true,

                    finishedAt:
                      Date.now(),

                    roundStartedAt:
                      null,

                    bombHolderId:
                      null,
                  },
                };
              }

              // ========================================
              // MASIH ADA PEMAIN
              // → RONDE BARU
              // ========================================

              const nextRound =
                (room.game.round ||
                  1) + 1;

              const totalRounds =
                Math.max(
                  1,
                  Object.keys(
                    roomPlayers
                  ).length - 1
                );

              // Pilih pemegang bom
              // secara random
              const nextHolder =
                alivePlayers.length >
                0
                  ? alivePlayers[
                      Math.floor(
                        Math.random() *
                          alivePlayers.length
                      )
                    ][0]
                  : null;

              return {
                ...room,

                players:
                  nextPlayers,

                game: {
                  ...room.game,

                  status: "arena",

                  round: nextRound,

                  totalRounds,

                  roundStartedAt:
                    Date.now(),

                  bombHolderId:
                    nextHolder,

                  eliminatedPlayerId:
                    holderId,

                  roundEnded:
                    false,

                  lastThrowerId:
                    null,

                  lastThrowAt:
                    null,
                },
              };
            }
          );
        } catch (err) {
          console.error(
            "Gagal memproses ronde:",
            err
          );
        }
      }, 250);

    return () =>
      clearInterval(timer);
  }, [
    roomCode,
    game.status,
    game.round,
    game.roundStartedAt,
    game.bombHolderId,
    isHost,
  ]);

  // ========================================
  // MASUK ROOM
  // ========================================

  function goToRoom(code) {
    const url = new URL(
      window.location.href
    );

    url.search =
      `?game=bom-bom&room=${code}`;

    window.history.pushState(
      {},
      "",
      url
    );

    setRoomCode(code);
    setScreen("room");
  }

  // ========================================
  // KEMBALI KE MENU
  // ========================================

  function backToMenu() {
    const url = new URL(
      window.location.href
    );

    url.search =
      "?game=bom-bom";

    window.history.pushState(
      {},
      "",
      url
    );

    setRoomCode(null);

    setScreen("menu");

    setPlayers({});

    setGame({
      status: "waiting",
    });

    setJoinCode("");

    setError("");
  }

  // ========================================
  // BUAT ROOM
  // ========================================

  async function createRoom() {
    try {
      setError("");

      const code =
        makeRoomCode();

      const roomRef = ref(
        db,
        `bomBomRooms/${code}`
      );

      await set(roomRef, {
        game: {
          status: "waiting",
          hostId: playerId,
          createdAt: Date.now(),
        },

        players: {
          [playerId]: {
            playerNumber: 1,
            joinedAt: Date.now(),
            character: null,
          },
        },
      });

      goToRoom(code);
    } catch (err) {
      console.error(err);

      setError(
        "Gagal membuat room. Cek koneksi Firebase."
      );
    }
  }

  // ========================================
  // BUKA JOIN
  // ========================================

  function openJoinForm() {
    setError("");

    setJoinCode("");

    setScreen("join");
  }

  // ========================================
  // JOIN ROOM
  // ========================================

  async function joinRoom() {
    try {
      setError("");

      const code =
        joinCode
          .trim()
          .toUpperCase();

      if (!code) {
        setError(
          "Masukkan kode room terlebih dahulu."
        );

        return;
      }

      if (code.length !== 6) {
        setError(
          "Kode room harus 6 karakter."
        );

        return;
      }

      const roomRef = ref(
        db,
        `bomBomRooms/${code}`
      );

      const snapshot =
        await new Promise(
          (resolve, reject) => {
            onValue(
              roomRef,
              resolve,
              {
                onlyOnce: true,
              }
            );
          }
        );

      const room =
        snapshot.val();

      if (!room) {
        setError(
          "Room tidak ditemukan."
        );

        return;
      }

      const existingPlayers =
        room.players || {};

      if (
        existingPlayers[playerId]
      ) {
        goToRoom(code);

        return;
      }

      const playerCount =
        Object.keys(
          existingPlayers
        ).length;

      if (
        playerCount >=
        MAX_PLAYERS
      ) {
        setError(
          "Room sudah penuh. Maksimal 8 pemain."
        );

        return;
      }

      const usedNumbers =
        Object.values(
          existingPlayers
        )
          .map(
            (player) =>
              player.playerNumber
          )
          .filter(Boolean);

      let playerNumber = 1;

      while (
        usedNumbers.includes(
          playerNumber
        )
      ) {
        playerNumber++;
      }

      const playerRef = ref(
        db,
        `bomBomRooms/${code}/players/${playerId}`
      );

      await set(
        playerRef,
        {
          playerNumber,
          joinedAt: Date.now(),
          character: null,
        }
      );

      goToRoom(code);
    } catch (err) {
      console.error(err);

      setError(
        "Gagal masuk room. Cek koneksi Firebase."
      );
    }
  }

  // ========================================
  // TAMBAH BOT
  // ========================================

  async function addBot() {
    try {
      setError("");

      if (!roomCode) {
        return;
      }

      if (!isHost) {
        return;
      }

      const playerEntries =
        Object.entries(players);

      if (
        playerEntries.length >=
        MAX_PLAYERS
      ) {
        setError(
          "Maksimal 8 peserta."
        );

        return;
      }

      // Cari nomor player yang masih kosong
      const usedNumbers =
        playerEntries
          .map(
            ([, player]) =>
              player.playerNumber
          )
          .filter(Boolean);

      let nextNumber = 1;

      while (
        usedNumbers.includes(
          nextNumber
        )
      ) {
        nextNumber++;
      }

      // Hitung jumlah bot
      const botIndex =
        playerEntries.filter(
          ([, player]) =>
            player.isBot
        ).length;

      const botId =
        `bot-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}`;

      const position =
        getSpawnPosition(
          nextNumber
        );

      const playerRef = ref(
        db,
        `bomBomRooms/${roomCode}/players/${botId}`
      );

      await set(playerRef, {
        playerNumber: nextNumber,
        joinedAt: Date.now(),

        character:
          getBotCharacter(
            botIndex
          ),

        isBot: true,

        botName:
          getBotName(
            botIndex + 1
          ),

        alive: true,

        position,
      });
    } catch (err) {
      console.error(
        "Gagal menambah bot:",
        err
      );

      setError(
        "Gagal menambahkan bot."
      );
    }
  }

  // ========================================
  // HAPUS BOT
  // ========================================

  async function removeBot() {
    try {
      setError("");

      if (!roomCode) {
        return;
      }

      if (!isHost) {
        return;
      }

      const botEntries =
        Object.entries(players)
          .filter(
            ([, player]) =>
              player.isBot
          )
          .sort(
            ([, a], [, b]) =>
              (b.playerNumber ||
                0) -
              (a.playerNumber ||
                0)
          );

      if (
        botEntries.length ===
        0
      ) {
        return;
      }

      // Hapus bot dengan nomor
      // player paling besar
      const [botId] =
        botEntries[0];

      const botRef = ref(
        db,
        `bomBomRooms/${roomCode}/players/${botId}`
      );

      await set(
        botRef,
        null
      );
    } catch (err) {
      console.error(
        "Gagal menghapus bot:",
        err
      );

      setError(
        "Gagal menghapus bot."
      );
    }
  }

  // ========================================
  // MULAI CHARACTER SELECTION
  // ========================================

  async function startCharacterSelection() {
    try {
      setError("");

      if (!roomCode) {
        return;
      }

      const gameRef = ref(
        db,
        `bomBomRooms/${roomCode}/game`
      );

      await set(gameRef, {
        status:
          "character-select",

        hostId: playerId,

        startedAt:
          Date.now(),
      });
    } catch (err) {
      console.error(err);

      setError(
        "Gagal membuka pemilihan karakter."
      );
    }
  }

  // ========================================
  // PILIH KARAKTER
  // ========================================

  async function selectCharacter(
    characterId
  ) {
    try {
      setError("");

      if (!roomCode) {
        return;
      }

      const alreadyUsed =
        Object.entries(
          players
        ).some(
          ([id, player]) =>
            id !== playerId &&
            player.character ===
              characterId
        );

      if (alreadyUsed) {
        setError(
          "Karakter tersebut sudah dipilih pemain lain."
        );

        return;
      }

      const playerRef = ref(
        db,
        `bomBomRooms/${roomCode}/players/${playerId}/character`
      );

      await set(
        playerRef,
        characterId
      );
    } catch (err) {
      console.error(err);

      setError(
        "Gagal memilih karakter."
      );
    }
  }

  // ========================================
  // KEMBALI KE LOBBY
  // ========================================

  async function backToLobby() {
    try {
      setError("");

      if (!roomCode) {
        return;
      }

      const gameRef = ref(
        db,
        `bomBomRooms/${roomCode}/game`
      );

      await set(gameRef, {
        status: "waiting",

        hostId:
          players[playerId]
            ?.playerNumber === 1
            ? playerId
            : game.hostId,
      });
    } catch (err) {
      console.error(err);

      setError(
        "Gagal kembali ke lobby."
      );
    }
  }

  // ========================================
  // MENU
  // ========================================

  if (screen === "menu") {
    return (
      <div style={pageStyle}>
        <div style={boxStyle}>
          <div style={bombIcon}>
            💣
          </div>

          <h1 style={titleStyle}>
            Bom-Bom
          </h1>

          <p style={subtitleStyle}>
            Multiplayer Bomb Arena
          </p>

          <button
            style={primaryButton}
            onClick={createRoom}
          >
            🎮 Buat Room Baru
          </button>

          <button
            style={secondaryButton}
            onClick={openJoinForm}
          >
            🔑 Masukkan Kode Room
          </button>

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // JOIN
  // ========================================

  if (screen === "join") {
    return (
      <div style={pageStyle}>
        <div style={boxStyle}>
          <div style={bombIcon}>
            💣
          </div>

          <h1 style={titleStyle}>
            Gabung Room
          </h1>

          <p style={subtitleStyle}>
            Masukkan kode room
            temanmu
          </p>

          <input
            value={joinCode}
            onChange={(e) =>
              setJoinCode(
                e.target.value.toUpperCase()
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                joinRoom();
              }
            }}
            maxLength={6}
            placeholder="CONTOH: ABC123"
            style={inputStyle}
            autoFocus
          />

          <button
            style={primaryButton}
            onClick={joinRoom}
          >
            🚀 Gabung Room
          </button>

          <button
            style={secondaryButton}
            onClick={() => {
              setError("");
              setScreen("menu");
            }}
          >
            ← Kembali
          </button>

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // ARENA
  // ========================================

  if (
    game.status === "arena" ||
    game.status === "winner"
  ) {
    return (
      <BomBomArena3D
        characterId={
          players[playerId]
            ?.character ||
          "fanzi"
        }
        game={game}
        players={players}
        playerId={playerId}
        roomCode={roomCode}
      />
    );
  }

  // ========================================
  // CHARACTER SELECTION
  // ========================================

  if (
    game.status ===
    "character-select"
  ) {
    return (
      <div style={pageStyle}>
        <div
          style={
            characterBoxStyle
          }
        >
          <div
            style={
              characterHeaderStyle
            }
          >
            <div>
              <div
                style={smallLabel}
              >
                ROOM
              </div>

              <div
                style={
                  roomCodeSmall
                }
              >
                {roomCode}
              </div>
            </div>

            <button
              style={
                smallBackButton
              }
              onClick={
                backToLobby
              }
            >
              ← Lobby
            </button>
          </div>

          <div
            style={dividerStyle}
          />

          <h1
            style={
              characterTitle
            }
          >
            🎭 Pilih Karakter
          </h1>

          <p
            style={subtitleStyle}
          >
            Pilih satu karakter
            untuk bermain.
          </p>

          <div
            style={
              characterGridStyle
            }
          >
            {CHARACTERS.map(
              (character) => {
                const owner =
                  sortedPlayers.find(
                    (player) =>
                      player.character ===
                      character.id
                  );

                const isMine =
                  selectedCharacter ===
                  character.id;

                const isTaken =
                  owner &&
                  owner.id !==
                    playerId;

                return (
                  <button
                    key={
                      character.id
                    }
                    disabled={
                      isTaken
                    }
                    onClick={() =>
                      selectCharacter(
                        character.id
                      )
                    }
                    style={{
                      ...characterCardStyle,

                      ...(isMine
                        ? selectedCharacterStyle
                        : {}),

                      ...(isTaken
                        ? takenCharacterStyle
                        : {}),
                    }}
                  >
                    <div
                      style={
                        characterEmojiStyle
                      }
                    >
                      {
                        character.emoji
                      }
                    </div>

                    <div
                      style={
                        characterNameStyle
                      }
                    >
                      {
                        character.name
                      }
                    </div>

                    <div
                      style={
                        characterDescriptionStyle
                      }
                    >
                      {
                        character.description
                      }
                    </div>

                    {isMine && (
                      <div
                        style={
                          selectedBadge
                        }
                      >
                        ✓ PILIHANMU
                      </div>
                    )}

                    {isTaken && (
                      <div
                        style={
                          takenBadge
                        }
                      >
                        Player{" "}
                        {
                          owner.playerNumber
                        }
                      </div>
                    )}

                    {!isMine &&
                      !isTaken && (
                        <div
                          style={
                            chooseText
                          }
                        >
                          PILIH
                        </div>
                      )}
                  </button>
                );
              }
            )}
          </div>

          <div
            style={
              selectedInfoStyle
            }
          >
            {selectedCharacter ? (
              <>
                Kamu memilih{" "}
                <strong>
                  {
                    CHARACTERS.find(
                      (c) =>
                        c.id ===
                        selectedCharacter
                    )?.name
                  }
                </strong>
              </>
            ) : (
              "Kamu belum memilih karakter."
            )}
          </div>

          <div
            style={
              playersSelectionStyle
            }
          >
            {sortedPlayers.map(
              (player) => {
                const character =
                  CHARACTERS.find(
                    (c) =>
                      c.id ===
                      player.character
                  );

                return (
                  <div
                    key={player.id}
                    style={
                      miniPlayerStyle
                    }
                  >
                    <span>
                      Player{" "}
                      {
                        player.playerNumber
                      }
                    </span>

                    <span>
                      {character
                        ? `${character.emoji} ${character.name}`
                        : "⏳ Belum memilih"}
                    </span>
                  </div>
                );
              }
            )}
          </div>

          {isHost && (
            <button
              style={{
                ...primaryButton,

                opacity:
                  allPlayersSelected
                    ? 1
                    : 0.5,
              }}
              disabled={
                !allPlayersSelected
              }
              onClick={async () => {
                try {
                  setError("");

                  if (!roomCode) {
                    return;
                  }

                  const gameRef =
                    ref(
                      db,
                      `bomBomRooms/${roomCode}/game`
                    );

                  const now =
                    Date.now();

                  const totalParticipants =
                    sortedPlayers.length;

                  const totalRounds =
                    Math.max(
                      1,
                      totalParticipants -
                        1
                    );

                  // Pemegang bom awal RANDOM
                  const firstPlayer =
                    sortedPlayers.length >
                    0
                      ? sortedPlayers[
                          Math.floor(
                            Math.random() *
                              sortedPlayers.length
                          )
                        ].id
                      : null;

                  const playerUpdates =
                    {};

                  sortedPlayers.forEach(
                    (player) => {
                      const spawn =
                        getSpawnPosition(
                          player.playerNumber
                        );

                      playerUpdates[
                        `players/${player.id}/alive`
                      ] = true;

                      playerUpdates[
                        `players/${player.id}/position`
                      ] = spawn;
                    }
                  );

                  playerUpdates[
                    "game"
                  ] = {
                    status: "arena",

                    hostId:
                      game.hostId,

                    startedAt:
                      now,

                    round: 1,

                    totalRounds,

                    roundStartedAt:
                      now,

                    bombHolderId:
                      firstPlayer,

                    roundEnded:
                      false,

                    eliminatedPlayerId:
                      null,

                    winnerId:
                      null,
                  };

                  await update(
                    ref(
                      db,
                      `bomBomRooms/${roomCode}`
                    ),
                    playerUpdates
                  );
                } catch (err) {
                  console.error(
                    err
                  );

                  setError(
                    "Gagal memulai arena."
                  );
                }
              }}
            >
              💣 Semua Siap —
              Mulai Arena
            </button>
          )}

          {!isHost && (
            <div
              style={
                waitingStyle
              }
            >
              ⏳ Menunggu Player 1
              memulai arena...
            </div>
          )}

          {error && (
            <div
              style={errorStyle}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // LOBBY
  // ========================================

  return (
    <div style={pageStyle}>
      <div style={roomBoxStyle}>
        <div
          style={
            roomHeaderStyle
          }
        >
          <div>
            <div
              style={smallLabel}
            >
              ROOM CODE
            </div>

            <div
              style={roomCodeStyle}
            >
              {roomCode}
            </div>
          </div>

          <button
            style={
              smallBackButton
            }
            onClick={backToMenu}
          >
            ← Keluar
          </button>
        </div>

        <div
          style={dividerStyle}
        />

        <h2
          style={lobbyTitle}
        >
          💣 Bom-Bom Lobby
        </h2>

        <p
          style={subtitleStyle}
        >
          Bagikan kode ini ke
          temanmu.
        </p>

        <div
          style={playerListStyle}
        >
          {sortedPlayers.map(
            (player) => {
              const character =
                CHARACTERS.find(
                  (c) =>
                    c.id ===
                    player.character
                );

              return (
                <div
                  key={player.id}
                  style={
                    playerCardStyle
                  }
                >
                  <div
                    style={
                      playerNumberStyle
                    }
                  >
                    {
                      player.playerNumber
                    }
                  </div>

                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <div
                      style={
                        playerNameStyle
                      }
                    >
                      {player.isBot
                        ? player.botName ||
                          `Bot ${player.playerNumber}`
                        : `Player ${player.playerNumber}`}
                    </div>

                    {player.playerNumber ===
                      1 && (
                      <div
                        style={
                          hostText
                        }
                      >
                        HOST
                      </div>
                    )}

                    {player.id ===
                      playerId && (
                      <div
                        style={
                          youText
                        }
                      >
                        Kamu
                      </div>
                    )}

                    {player.isBot && (
                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 10,
                          opacity: 0.55,
                        }}
                      >
                        🤖 BOT
                      </div>
                    )}

                    {character && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: GOLD,
                        }}
                      >
                        {
                          character.emoji
                        }{" "}
                        {
                          character.name
                        }
                      </div>
                    )}
                  </div>

                  <div
                    style={readyDot}
                  >
                    ●
                  </div>
                </div>
              );
            }
          )}
        </div>

        <div
          style={
            playerCountStyle
          }
        >
          {sortedPlayers.length} /{" "}
          {MAX_PLAYERS} pemain
        </div>

        {isHost ? (
          <>
            <button
              style={
                primaryButton
              }
              onClick={
                startCharacterSelection
              }
              disabled={
                sortedPlayers.length <
                2
              }
            >
              🎭 Pilih Karakter &
              Mulai
            </button>

            <button
              style={{
                ...secondaryButton,
                marginTop: 8,
              }}
              onClick={addBot}
              disabled={
                sortedPlayers.length >=
                MAX_PLAYERS
              }
            >
              🤖 Tambah Bot
            </button>

            {sortedPlayers.some(
              (player) =>
                player.isBot
            ) && (
              <button
                style={{
                  ...secondaryButton,
                  marginTop: 8,
                }}
                onClick={
                  removeBot
                }
              >
                ❌ Hapus Bot
              </button>
            )}

            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background:
                  "rgba(201,162,39,0.08)",
                color: CREAM,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {sortedPlayers.length <
              2
                ? "Minimal 2 peserta untuk mulai."
                : `Akan ada ${
                    sortedPlayers.length -
                    1
                  } ronde.`}
            </div>
          </>
        ) : (
          <div
            style={
              waitingStyle
            }
          >
            ⏳ Menunggu Player 1
            memulai...
          </div>
        )}

        {error && (
          <div
            style={errorStyle}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// STYLES
// ========================================

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  background: BG,
  color: CREAM,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  boxSizing: "border-box",
  fontFamily:
    "Arial, Helvetica, sans-serif",
};

const boxStyle = {
  width: "100%",
  maxWidth: 420,
  background:
    "linear-gradient(180deg, #241a15, #17110e)",
  border:
    "1px solid rgba(201,162,39,0.35)",
  borderRadius: 20,
  padding: 30,
  boxSizing: "border-box",
  textAlign: "center",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.45)",
};

const roomBoxStyle = {
  width: "100%",
  maxWidth: 520,
  background:
    "linear-gradient(180deg, #241a15, #17110e)",
  border:
    "1px solid rgba(201,162,39,0.35)",
  borderRadius: 20,
  padding: 25,
  boxSizing: "border-box",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.45)",
};

const characterBoxStyle = {
  width: "100%",
  maxWidth: 760,
  background:
    "linear-gradient(180deg, #241a15, #17110e)",
  border:
    "1px solid rgba(201,162,39,0.35)",
  borderRadius: 20,
  padding: 25,
  boxSizing: "border-box",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.45)",
};

const bombIcon = {
  fontSize: 58,
  marginBottom: 8,
};

const titleStyle = {
  margin: 0,
  fontSize: 34,
  color: GOLD,
};

const subtitleStyle = {
  marginTop: 8,
  marginBottom: 25,
  opacity: 0.7,
  fontSize: 14,
};

const primaryButton = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: 12,
  border: "none",
  background: GOLD,
  color: "#17110e",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
  marginTop: 10,
};

const secondaryButton = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: 12,
  border:
    "1px solid rgba(245,239,224,0.25)",
  background:
    "rgba(255,255,255,0.05)",
  color: CREAM,
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
  marginTop: 10,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "15px 16px",
  borderRadius: 12,
  border:
    "1px solid rgba(201,162,39,0.45)",
  background: "#120d0a",
  color: CREAM,
  outline: "none",
  fontSize: 18,
  fontWeight: 800,
  textAlign: "center",
  letterSpacing: 4,
  textTransform: "uppercase",
};

const errorStyle = {
  marginTop: 15,
  padding: 12,
  borderRadius: 10,
  background:
    "rgba(180,50,50,0.15)",
  border:
    "1px solid rgba(220,80,80,0.35)",
  color: "#ffb4b4",
  fontSize: 13,
};

const roomHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 15,
};

const characterHeaderStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: 15,
};

const smallLabel = {
  fontSize: 10,
  opacity: 0.55,
  letterSpacing: 2,
};

const roomCodeStyle = {
  marginTop: 4,
  color: GOLD,
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: 5,
};

const roomCodeSmall = {
  marginTop: 3,
  color: GOLD,
  fontSize: 20,
  fontWeight: 900,
  letterSpacing: 3,
};

const smallBackButton = {
  padding: "9px 12px",
  borderRadius: 9,
  border:
    "1px solid rgba(245,239,224,0.2)",
  background:
    "rgba(255,255,255,0.05)",
  color: CREAM,
  cursor: "pointer",
};

const dividerStyle = {
  height: 1,
  background:
    "rgba(245,239,224,0.1)",
  margin: "20px 0",
};

const lobbyTitle = {
  margin: 0,
  fontSize: 24,
};

const playerListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 9,
  marginTop: 18,
};

const playerCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 12,
  borderRadius: 12,
  background:
    "rgba(255,255,255,0.045)",
  border:
    "1px solid rgba(245,239,224,0.08)",
};

const playerNumberStyle = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background:
    "rgba(201,162,39,0.15)",
  border:
    "1px solid rgba(201,162,39,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: GOLD,
  fontSize: 18,
  fontWeight: 900,
};

const playerNameStyle = {
  fontSize: 15,
  fontWeight: 800,
};

const hostText = {
  color: GOLD,
  fontSize: 10,
  fontWeight: 800,
  marginTop: 3,
  letterSpacing: 1,
};

const youText = {
  opacity: 0.55,
  fontSize: 10,
  marginTop: 2,
};

const readyDot = {
  color: "#63d471",
  fontSize: 13,
};

const playerCountStyle = {
  textAlign: "center",
  marginTop: 15,
  marginBottom: 8,
  fontSize: 12,
  opacity: 0.55,
};

const waitingStyle = {
  marginTop: 10,
  padding: 14,
  borderRadius: 12,
  background:
    "rgba(255,255,255,0.04)",
  textAlign: "center",
  fontSize: 13,
  opacity: 0.7,
};

const characterTitle = {
  margin: 0,
  fontSize: 28,
  color: GOLD,
  textAlign: "center",
};

const characterGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 12,
  marginTop: 20,
};

const characterCardStyle = {
  minHeight: 175,
  padding: 15,
  borderRadius: 15,
  border:
    "1px solid rgba(245,239,224,0.12)",
  background:
    "rgba(255,255,255,0.045)",
  color: CREAM,
  cursor: "pointer",
  textAlign: "center",
  transition: "0.15s",
};

const selectedCharacterStyle = {
  border:
    `2px solid ${GOLD}`,
  background:
    "rgba(201,162,39,0.13)",
};

const takenCharacterStyle = {
  opacity: 0.35,
  cursor: "not-allowed",
};

const characterEmojiStyle = {
  fontSize: 48,
  marginBottom: 8,
};

const characterNameStyle = {
  fontSize: 17,
  fontWeight: 900,
};

const characterDescriptionStyle = {
  fontSize: 11,
  opacity: 0.6,
  marginTop: 5,
};

const selectedBadge = {
  marginTop: 10,
  color: GOLD,
  fontSize: 10,
  fontWeight: 900,
};

const takenBadge = {
  marginTop: 10,
  fontSize: 10,
  fontWeight: 800,
  opacity: 0.8,
};

const chooseText = {
  marginTop: 12,
  fontSize: 10,
  fontWeight: 800,
  opacity: 0.5,
};

const selectedInfoStyle = {
  marginTop: 18,
  padding: 12,
  borderRadius: 10,
  background:
    "rgba(255,255,255,0.04)",
  textAlign: "center",
  fontSize: 13,
};

const playersSelectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginTop: 12,
};

const miniPlayerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  padding: "9px 11px",
  borderRadius: 9,
  background:
    "rgba(255,255,255,0.035)",
  fontSize: 12,
};

export { BomBomGame };