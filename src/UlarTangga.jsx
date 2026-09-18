import React, { useEffect, useRef, useState } from "react";
import { db } from "./firebase";
import { ref, onValue, runTransaction, set } from "firebase/database";

const SNAKES = {
  98: 78,
  95: 75,
  92: 88,
  83: 63,
  73: 53,
  64: 60,
  48: 26,
  45: 7,
  36: 17,
  32: 10,
};

const LADDERS = {
  4: 25,
  8: 31,
  20: 41,
  28: 55,
  40: 59,
  51: 67,
  54: 69,
  62: 81,
  71: 91,
  80: 100,
};

const COLORS = ["#C9A227", "#5DA9E9", "#E56B6F", "#78C091"];

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function displayName(players, seat) {
  return players[seat]?.name || `Bot ${seat + 1}`;
}

function makeInitialGame() {
  return {
    phase: "playing",
    positions: [1, 1, 1, 1],
    currentPlayer: 0,
    lastRoll: null,
    message: "Giliran pemain pertama.",
    winner: null,
    rolling: false,
    log: [],
  };
}

function getCellNumber(row, col) {
  // Baris bawah = 1, lalu naik ke atas.
  const rowFromBottom = 9 - row;

  if (rowFromBottom % 2 === 0) {
    return rowFromBottom * 10 + col + 1;
  }

  return rowFromBottom * 10 + (10 - col);
}

function getCellStyle(number) {
  if (number === 1) {
    return {
      background: "rgba(201,162,39,0.25)",
      border: "1px solid #C9A227",
    };
  }

  if (SNAKES[number]) {
    return {
      background: "rgba(180,70,70,0.25)",
      border: "1px solid rgba(220,100,100,0.6)",
    };
  }

  if (LADDERS[number]) {
    return {
      background: "rgba(80,160,100,0.25)",
      border: "1px solid rgba(100,190,120,0.6)",
    };
  }

  if (number === 100) {
    return {
      background: "rgba(201,162,39,0.35)",
      border: "2px solid #C9A227",
    };
  }

  return {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
  };
}

function PlayerToken({ seat }) {
  return (
    <div
      style={{
        width: 25,
        height: 25,
        borderRadius: "50%",
        background: COLORS[seat],
        border: "2px solid rgba(255,255,255,0.85)",
        boxShadow: "0 2px 5px rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#1a1a1a",
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {seat + 1}
    </div>
  );
}

function Button({ children, onClick, primary, disabled, small }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: small ? "6px 11px" : "9px 16px",
        borderRadius: 10,
        border: primary
          ? "none"
          : "1px solid rgba(255,255,255,0.25)",
        background: disabled
          ? "#4a4238"
          : primary
          ? "#C9A227"
          : "rgba(255,255,255,0.08)",
        color: primary && !disabled ? "#1a1a1a" : "#F5EFE0",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 700,
        fontSize: small ? 11 : 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function UlarTangga() {
  const params = new URLSearchParams(window.location.search);

  const [roomId, setRoomId] = useState(
    params.get("room") || ""
  );
  const [roomInput, setRoomInput] = useState(
    params.get("room") || ""
  );
  const [joined, setJoined] = useState(false);

  const [players, setPlayers] = useState([
    null,
    null,
    null,
    null,
  ]);

  const [game, setGame] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState("");

  const botTimer = useRef(null);

  useEffect(() => {
    if (!joined || !roomId) return;

    const playersRef = ref(
      db,
      `rooms/${roomId}/snakes_players`
    );

    const gameRef = ref(
      db,
      `rooms/${roomId}/snakes_game`
    );

    const unsubPlayers = onValue(playersRef, (snap) => {
      const val = snap.val();

      setPlayers(
        val
          ? [
              val[0] || null,
              val[1] || null,
              val[2] || null,
              val[3] || null,
            ]
          : [null, null, null, null]
      );
    });

    const unsubGame = onValue(gameRef, (snap) => {
      setGame(snap.val());
    });

    return () => {
      unsubPlayers();
      unsubGame();
    };
  }, [joined, roomId]);

  const occupiedSeats = players
    .map((p, i) => (p ? i : null))
    .filter((i) => i !== null);

  const hostSeat = occupiedSeats.length
    ? Math.min(...occupiedSeats)
    : null;

  const amIHost =
    mySeat !== null && mySeat === hostSeat;

  function enterRoom(id) {
    const clean =
      id.trim().toUpperCase() || randomRoomCode();

    setRoomId(clean);
    setRoomInput(clean);
    setJoined(true);

    const url = new URL(window.location.href);

    url.searchParams.set("game", "snakes");
    url.searchParams.set("room", clean);

    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  async function sitDown(seat) {
    if (!nameDraft.trim()) {
      setError("Isi nama dulu ya.");
      return;
    }

    const seatRef = ref(
      db,
      `rooms/${roomId}/snakes_players/${seat}`
    );

    const result = await runTransaction(
      seatRef,
      (current) => {
        if (current) return;
        return {
          name: nameDraft.trim(),
        };
      }
    );

    if (!result.committed) {
      setError(
        "Kursi itu baru saja diisi orang lain."
      );
      return;
    }

    setMySeat(seat);
    setError("");
  }

  async function makeBot(seat) {
    await set(
      ref(
        db,
        `rooms/${roomId}/snakes_players/${seat}`
      ),
      null
    );
  }

  async function startGame() {
    const g = makeInitialGame();

    g.message = `${displayName(
      players,
      0
    )} mulai dulu. Klik Lempar Dadu!`;

    await set(
      ref(db, `rooms/${roomId}/snakes_game`),
      g
    );
  }

  function nextActiveSeat(current) {
    return (current + 1) % 4;
  }

  async function rollDice() {
    if (
      !game ||
      game.phase !== "playing" ||
      game.currentPlayer !== mySeat ||
      game.rolling
    ) {
      return;
    }

    setError("");

    const gameRef = ref(
      db,
      `rooms/${roomId}/snakes_game`
    );

    await runTransaction(gameRef, (current) => {
      if (
        !current ||
        current.phase !== "playing" ||
        current.currentPlayer !== mySeat ||
        current.rolling
      ) {
        return;
      }

      const roll =
        Math.floor(Math.random() * 6) + 1;

      const oldPosition =
        current.positions[mySeat] || 1;

      let newPosition = oldPosition + roll;

      if (newPosition > 100) {
        newPosition = oldPosition;
      }

      let specialMessage = "";

      if (LADDERS[newPosition]) {
        const destination =
          LADDERS[newPosition];

        newPosition = destination;

        specialMessage =
          ` Naik tangga ke ${destination}!`;
      } else if (SNAKES[newPosition]) {
        const destination =
          SNAKES[newPosition];

        newPosition = destination;

        specialMessage =
          ` Kena ular! Turun ke ${destination}.`;
      }

      const newPositions = [
        ...(current.positions || [1, 1, 1, 1]),
      ];

      newPositions[mySeat] = newPosition;

      const log = [
        ...(current.log || []).slice(-7),
        `${displayName(
          players,
          mySeat
        )} mendapat ${roll} dan berada di ${newPosition}.`,
      ];

      if (newPosition === 100) {
        return {
          ...current,
          positions: newPositions,
          lastRoll: roll,
          rolling: false,
          phase: "gameover",
          winner: mySeat,
          message: `${displayName(
            players,
            mySeat
          )} mencapai kotak 100 dan menang! 🎉`,
          log,
        };
      }

      const nextPlayer =
        nextActiveSeat(mySeat);

      return {
        ...current,
        positions: newPositions,
        lastRoll: roll,
        rolling: false,
        currentPlayer: nextPlayer,
        message: `${displayName(
          players,
          mySeat
        )} mendapat ${roll}.${specialMessage} Giliran ${displayName(
          players,
          nextPlayer
        )}.`,
        log,
      };
    });
  }

  // Bot hanya dijalankan oleh host.
  useEffect(() => {
    if (
      !amIHost ||
      !game ||
      game.phase !== "playing" ||
      !roomId
    ) {
      return;
    }

    const actor = game.currentPlayer;

    if (players[actor]) {
      return;
    }

    botTimer.current = setTimeout(
      async () => {
        const gameRef = ref(
          db,
          `rooms/${roomId}/snakes_game`
        );

        await runTransaction(
          gameRef,
          (current) => {
            if (
              !current ||
              current.phase !== "playing" ||
              current.currentPlayer !== actor
            ) {
              return;
            }

            const roll =
              Math.floor(Math.random() * 6) + 1;

            const oldPosition =
              current.positions[actor] || 1;

            let newPosition =
              oldPosition + roll;

            if (newPosition > 100) {
              newPosition = oldPosition;
            }

            let specialMessage = "";

            if (LADDERS[newPosition]) {
              const destination =
                LADDERS[newPosition];

              newPosition = destination;

              specialMessage =
                ` Naik tangga ke ${destination}!`;
            } else if (SNAKES[newPosition]) {
              const destination =
                SNAKES[newPosition];

              newPosition = destination;

              specialMessage =
                ` Kena ular! Turun ke ${destination}.`;
            }

            const newPositions = [
              ...(current.positions || [
                1,
                1,
                1,
                1,
              ]),
            ];

            newPositions[actor] = newPosition;

            const log = [
              ...(current.log || []).slice(-7),
              `${displayName(
                players,
                actor
              )} mendapat ${roll} dan berada di ${newPosition}.`,
            ];

            if (newPosition === 100) {
              return {
                ...current,
                positions: newPositions,
                lastRoll: roll,
                rolling: false,
                phase: "gameover",
                winner: actor,
                message: `${displayName(
                  players,
                  actor
                )} mencapai kotak 100 dan menang! 🎉`,
                log,
              };
            }

            const nextPlayer =
              nextActiveSeat(actor);

            return {
              ...current,
              positions: newPositions,
              lastRoll: roll,
              rolling: false,
              currentPlayer: nextPlayer,
              message: `${displayName(
                players,
                actor
              )} mendapat ${roll}.${specialMessage} Giliran ${displayName(
                players,
                nextPlayer
              )}.`,
              log,
            };
          }
        );
      },
      1000
    );

    return () => {
      clearTimeout(botTimer.current);
    };
  }, [
    game,
    players,
    amIHost,
    roomId,
  ]);

  function backToHub() {
    const url = new URL(window.location.href);

    url.search = "";

    window.history.pushState({}, "", url);

    window.dispatchEvent(
      new PopStateEvent("popstate")
    );
  }

  const cream = "#F5EFE0";
  const gold = "#C9A227";
  const navy = "#0B2340";
  const navyDark = "#071730";

  if (!joined) {
    return (
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#1a1310",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            background:
              "rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 24,
            maxWidth: 380,
            width: "100%",
            color: cream,
          }}
        >
          <h1
            style={{
              fontFamily: "Georgia, serif",
              color: gold,
              fontSize: 22,
              marginTop: 0,
            }}
          >
            🐍 Ular Tangga
          </h1>

          <p
            style={{
              fontSize: 13,
              opacity: 0.85,
              lineHeight: 1.5,
            }}
          >
            Main Ular Tangga multiplayer
            bersama teman atau bot.
          </p>

          <input
            value={roomInput}
            onChange={(e) =>
              setRoomInput(e.target.value)
            }
            placeholder="Kode room (kosongkan untuk baru)"
            style={{
              padding: "9px 10px",
              borderRadius: 8,
              border:
                "1px solid #C9A227",
              width: "100%",
              marginBottom: 12,
              boxSizing: "border-box",
              background: "#f5efe0",
            }}
          />

          <Button
            primary
            onClick={() =>
              enterRoom(roomInput)
            }
          >
            {roomInput.trim()
              ? "Gabung Room"
              : "Buat Room Baru"}
          </Button>

          <div
            style={{
              textAlign: "center",
              marginTop: 14,
            }}
          >
            <Button
              small
              onClick={backToHub}
            >
              ← Kembali ke Game Hub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const inLobby = mySeat === null;
  const gameReady =
    game && game.phase !== "lobby";

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "#1a1310",
        minHeight: "100vh",
        padding: 14,
        color: cream,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 850,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              color: gold,
              fontFamily: "Georgia, serif",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            🐍 Ular Tangga
          </div>

          <div
            style={{
              fontSize: 11,
              opacity: 0.65,
              marginTop: 4,
            }}
          >
            Room {roomId}
          </div>
        </div>

        {inLobby && (
          <div
            style={{
              background:
                "rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              Masukkan nama kamu:
            </div>

            <input
              value={nameDraft}
              onChange={(e) =>
                setNameDraft(e.target.value)
              }
              placeholder="Nama kamu"
              style={{
                padding: "9px 10px",
                borderRadius: 8,
                border:
                  "1px solid #C9A227",
                width: 220,
                maxWidth: "100%",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 8,
              }}
            >
              {[0, 1, 2, 3].map(
                (seat) => (
                  <div
                    key={seat}
                    style={{
                      background:
                        "rgba(0,0,0,0.25)",
                      borderRadius: 10,
                      padding: 12,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.65,
                      }}
                    >
                      Pemain {seat + 1}
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        margin:
                          "5px 0 9px",
                      }}
                    >
                      {players[seat]?.name ||
                        "Bot"}
                    </div>

                    {!players[seat] && (
                      <Button
                        primary
                        small
                        onClick={() =>
                          sitDown(seat)
                        }
                      >
                        Duduk
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>

            {error && (
              <div
                style={{
                  color: "#E08080",
                  fontSize: 12,
                  marginTop: 10,
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {!inLobby && !gameReady && (
          <div
            style={{
              background:
                "rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: 16,
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              Kamu duduk sebagai{" "}
              <strong>
                {displayName(
                  players,
                  mySeat
                )}
              </strong>
              .
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {[0, 1, 2, 3].map(
                (seat) => (
                  <div
                    key={seat}
                    style={{
                      background:
                        "rgba(0,0,0,0.25)",
                      borderRadius: 10,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.6,
                      }}
                    >
                      Pemain {seat + 1}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        marginTop: 4,
                      }}
                    >
                      {players[seat]?.name ||
                        "Bot"}
                    </div>

                    {amIHost &&
                      players[seat] &&
                      seat !== mySeat && (
                        <div
                          style={{
                            marginTop: 7,
                          }}
                        >
                          <Button
                            small
                            onClick={() =>
                              makeBot(seat)
                            }
                          >
                            Jadikan Bot
                          </Button>
                        </div>
                      )}
                  </div>
                )
              )}
            </div>

            {amIHost && (
              <Button
                primary
                onClick={startGame}
              >
                🎲 Mulai Game
              </Button>
            )}

            {!amIHost && (
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                Menunggu host memulai game...
              </div>
            )}
          </div>
        )}

        {gameReady && (
          <>
            <div
              style={{
                background:
                  "linear-gradient(180deg, #6B4226, #3E2519)",
                padding: 9,
                borderRadius: 18,
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              <div
                style={{
                  background: `radial-gradient(ellipse at center, ${navy} 0%, ${navyDark} 100%)`,
                  border:
                    "2px solid #C9A227",
                  borderRadius: 14,
                  padding: 10,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(10, 1fr)",
                    gap: 3,
                    width: "100%",
                    aspectRatio: "1 / 1",
                  }}
                >
                  {Array.from(
                    { length: 100 },
                    (_, index) => {
                      const row =
                        Math.floor(
                          index / 10
                        );
                      const col =
                        index % 10;

                      const number =
                        getCellNumber(
                          row,
                          col
                        );

                      const tokens =
                        game.positions
                          ?.map(
                            (
                              pos,
                              seat
                            ) =>
                              pos ===
                              number
                                ? seat
                                : null
                          )
                          .filter(
                            (x) =>
                              x !== null
                          ) || [];

                      return (
                        <div
                          key={number}
                          style={{
                            ...getCellStyle(
                              number
                            ),
                            position:
                              "relative",
                            borderRadius: 4,
                            minWidth: 0,
                            minHeight: 0,
                            display: "flex",
                            flexDirection:
                              "column",
                            justifyContent:
                              "space-between",
                            padding: 3,
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "clamp(7px, 1.4vw, 11px)",
                              fontWeight: 700,
                              opacity: 0.85,
                            }}
                          >
                            {number}
                          </div>

                          {(SNAKES[
                            number
                          ] ||
                            LADDERS[
                              number
                            ]) && (
                            <div
                              style={{
                                position:
                                  "absolute",
                                left: "50%",
                                top: "50%",
                                transform:
                                  "translate(-50%, -50%)",
                                fontSize:
                                  "clamp(13px, 3vw, 24px)",
                              }}
                            >
                              {SNAKES[
                                number
                              ]
                                ? "🐍"
                                : "🪜"}
                            </div>
                          )}

                          <div
                            style={{
                              display:
                                "flex",
                              flexWrap:
                                "wrap",
                              gap: 2,
                              justifyContent:
                                "flex-end",
                            }}
                          >
                            {tokens.map(
                              (
                                seat
                              ) => (
                                <PlayerToken
                                  key={
                                    seat
                                  }
                                  seat={
                                    seat
                                  }
                                />
                              )
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                background:
                  "rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: 14,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  color: gold,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {game.message}
              </div>

              <div
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  opacity: 0.75,
                  marginBottom: 12,
                }}
              >
                {game.phase ===
                "gameover"
                  ? `Pemenang: ${displayName(
                      players,
                      game.winner
                    )}`
                  : `Giliran: ${displayName(
                      players,
                      game.currentPlayer
                    )}`}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "center",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 12,
                    background:
                      "#F5EFE0",
                    color: "#1a1a1a",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize: 28,
                    fontWeight: 800,
                    boxShadow:
                      "0 4px 10px rgba(0,0,0,0.35)",
                  }}
                >
                  {game.lastRoll || "?"}
                </div>

                {game.phase ===
                  "playing" &&
                  game.currentPlayer ===
                    mySeat && (
                    <Button
                      primary
                      onClick={rollDice}
                    >
                      🎲 Lempar Dadu
                    </Button>
                  )}

                {game.phase ===
                  "playing" &&
                  game.currentPlayer !==
                    mySeat && (
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.65,
                      }}
                    >
                      Tunggu giliranmu...
                    </div>
                  )}

                {game.phase ===
                  "gameover" &&
                  amIHost && (
                    <Button
                      primary
                      onClick={startGame}
                    >
                      🔄 Main Lagi
                    </Button>
                  )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 7,
                marginTop: 10,
              }}
            >
              {[0, 1, 2, 3].map(
                (seat) => (
                  <div
                    key={seat}
                    style={{
                      background:
                        "rgba(255,255,255,0.05)",
                      borderRadius: 9,
                      padding: 8,
                      border:
                        game.currentPlayer ===
                        seat &&
                        game.phase ===
                          "playing"
                          ? `1px solid ${COLORS[seat]}`
                          : "1px solid transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 6,
                      }}
                    >
                      <PlayerToken
                        seat={seat}
                      />

                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {displayName(
                            players,
                            seat
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            opacity: 0.65,
                          }}
                        >
                          Kotak{" "}
                          {game.positions?.[
                            seat
                          ] || 1}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {game.log?.length >
              0 && (
              <div
                style={{
                  marginTop: 10,
                  background:
                    "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 10,
                  opacity: 0.65,
                }}
              >
                {game.log
                  .slice()
                  .reverse()
                  .map(
                    (item, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom:
                            3,
                        }}
                      >
                        {item}
                      </div>
                    )
                  )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "center",
                marginTop: 12,
              }}
            >
              <Button
                small
                onClick={backToHub}
              >
                ← Kembali ke Ralou Game Hub
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UlarTangga;