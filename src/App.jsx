import React, { useEffect, useRef, useState, useCallback } from "react";
import { db } from "./firebase";
import { ref, onValue, runTransaction, set } from "firebase/database";
import {
  SUITS,
  rankLabel,
  cardValue,
  cardKey,
  classifySelection,
  comboBeats,
  findBeatingPlays,
  getMultiLeadOptions,
  dealNewRound,
} from "./gameLogic";

/* ---------- small visual pieces ---------- */

function CardFace({ card, selected, onClick, small, faceDown }) {
  const w = small ? 34 : 54;
  const h = small ? 48 : 76;
  if (faceDown || !card) {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 6,
          background: "repeating-linear-gradient(135deg, #1B2E4A, #1B2E4A 6px, #12203A 6px, #12203A 12px)",
          border: "1.5px solid #C9A227",
          marginLeft: small ? -14 : 0,
          boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
          flexShrink: 0,
        }}
      />
    );
  }
  const suit = SUITS.find((s) => s.key === card.suit);
  return (
    <button
      onClick={onClick}
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: "#F5EFE0",
        border: selected ? "2.5px solid #C9A227" : "1px solid #8a7d5f",
        boxShadow: selected ? "0 8px 12px rgba(0,0,0,0.45)" : "0 2px 4px rgba(0,0,0,0.3)",
        transform: selected ? "translateY(-10px)" : "translateY(0)",
        transition: "transform 0.12s ease",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3px 4px",
        fontFamily: "Georgia, serif",
        color: suit.color,
        flexShrink: 0,
      }}
    >
      <div style={{ textAlign: "left", fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
        {rankLabel(card.rank)}
        <div style={{ fontSize: 10 }}>{suit.symbol}</div>
      </div>
    </button>
  );
}

function Button({ children, onClick, primary, danger, disabled, small }) {
  const bg = disabled ? "#4a4238" : danger ? "#7a2a2a" : primary ? "#C9A227" : "rgba(255,255,255,0.08)";
  const color = primary && !disabled ? "#1a1a1a" : "#F5EFE0";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 10px" : "9px 16px",
        borderRadius: 10,
        border: primary ? "none" : "1px solid rgba(255,255,255,0.25)",
        background: bg,
        color,
        fontFamily: "system-ui, sans-serif",
        fontWeight: 600,
        fontSize: small ? 11 : 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/* ---------- main app ---------- */

export default function App() {
  const [roomId, setRoomId] = useState(() => new URLSearchParams(window.location.search).get("room") || "");
  const [roomInput, setRoomInput] = useState(roomId);
  const [joined, setJoined] = useState(false);

  const [players, setPlayers] = useState([null, null, null, null]);
  const [game, setGame] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState("");
  const botTimer = useRef(null);

  const displayName = useCallback(
    (idx, ps) => {
      const list = ps || players;
      return list[idx]?.name || `Bot ${idx + 1}`;
    },
    [players]
  );

  function enterRoom(id) {
    const clean = id.trim().toUpperCase() || randomRoomCode();
    setRoomId(clean);
    setJoined(true);
    const url = new URL(window.location.href);
    url.searchParams.set("room", clean);
    window.history.replaceState({}, "", url);
  }

  // subscribe to players & game once a room is chosen
  useEffect(() => {
    if (!joined || !roomId) return;
    const playersRef = ref(db, `rooms/${roomId}/players`);
    const gameRef = ref(db, `rooms/${roomId}/game`);
    const unsub1 = onValue(playersRef, (snap) => {
      const val = snap.val();
      setPlayers(val ? [val[0] || null, val[1] || null, val[2] || null, val[3] || null] : [null, null, null, null]);
    });
    const unsub2 = onValue(gameRef, (snap) => {
      setGame(snap.val());
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [joined, roomId]);

  const occupiedSeats = players.map((p, i) => (p ? i : null)).filter((i) => i !== null);
  const hostSeat = occupiedSeats.length ? Math.min(...occupiedSeats) : null;
  const amIHost = mySeat !== null && mySeat === hostSeat;

  async function sitDown(seat) {
    if (!nameDraft.trim()) {
      setError("Isi nama dulu ya.");
      return;
    }
    const seatRef = ref(db, `rooms/${roomId}/players/${seat}`);
    const result = await runTransaction(seatRef, (current) => {
      if (current) return; // abort: seat already taken
      return { name: nameDraft.trim() };
    });
    if (!result.committed) {
      setError("Kursi itu baru saja diisi orang lain, pilih kursi lain.");
      return;
    }
    setMySeat(seat);
    setError("");
  }

  function makeBot(seat) {
    set(ref(db, `rooms/${roomId}/players/${seat}`), null);
  }

  async function startGame() {
    const g = dealNewRound([0, 0, 0, 0]);
    g.message = `${displayName(g.startingPlayer)} memegang 3♦ dan memulai.`;
    await set(ref(db, `rooms/${roomId}/game`), g);
  }
  async function nextRound() {
    const g = dealNewRound(game?.wins);
    g.message = `${displayName(g.startingPlayer)} memegang 3♦ dan memulai.`;
    await set(ref(db, `rooms/${roomId}/game`), g);
  }

  async function playCards(cards) {
    setError("");
    const gameRef = ref(db, `rooms/${roomId}/game`);
    let failReason = null;
    await runTransaction(gameRef, (current) => {
      if (!current || current.phase !== "playing" || current.currentPlayer !== mySeat) return; // abort silently (stale click)
      const combo = classifySelection(cards);
      if (!combo) {
        failReason = "Kombinasi tidak valid.";
        return; // abort
      }
      if (!current.firstPlayDone && current.startingPlayer === mySeat && !cards.some((c) => c.rank === 3 && c.suit === "D")) {
        failReason = "Kombinasi pertamamu wajib menyertakan 3♦.";
        return;
      }
      if (current.currentCombo) {
        if (current.currentCombo.size !== combo.size) {
          failReason = `Harus memainkan ${current.currentCombo.size} kartu.`;
          return;
        }
        if (!comboBeats(combo, current.currentCombo)) {
          failReason = `Kombinasi tidak lebih tinggi dari ${current.currentCombo.label} di meja.`;
          return;
        }
      }
      const keys = new Set(cards.map(cardKey));
      const newHands = [...current.hands];
      newHands[mySeat] = current.hands[mySeat].filter((c) => !keys.has(cardKey(c)));
      let next = {
        ...current,
        hands: newHands,
        currentCombo: { ...combo, ownerIdx: mySeat, cards },
        firstPlayDone: true,
        passCount: 0,
        message: `${displayName(mySeat)} memainkan ${combo.label}.`,
        log: [...(current.log || []).slice(-8), `${displayName(mySeat)}: ${combo.label}`],
      };
      if (newHands[mySeat].length === 0) {
        const wins = [...current.wins];
        wins[mySeat] += 1;
        next = { ...next, phase: "roundover", wins, message: `${displayName(mySeat)} menghabiskan kartu dan menang ronde ini!` };
      } else {
        next.currentPlayer = (mySeat + 1) % 4;
      }
      return next;
    });
    if (failReason) setError(failReason);
    else setSelected(new Set());
  }

  async function passTurn() {
    setError("");
    const gameRef = ref(db, `rooms/${roomId}/game`);
    await runTransaction(gameRef, (current) => {
      if (!current || current.phase !== "playing" || current.currentPlayer !== mySeat || !current.currentCombo) return;
      const nextPass = current.passCount + 1;
      if (nextPass >= 3) {
        return {
          ...current,
          currentCombo: null,
          passCount: 0,
          currentPlayer: current.currentCombo.ownerIdx,
          message: `${displayName(mySeat)} pass. Meja bersih — giliran ${displayName(current.currentCombo.ownerIdx)}.`,
          log: [...(current.log || []).slice(-8), `${displayName(mySeat)}: pass (meja bersih)`],
        };
      }
      return {
        ...current,
        passCount: nextPass,
        currentPlayer: (mySeat + 1) % 4,
        message: `${displayName(mySeat)} pass.`,
        log: [...(current.log || []).slice(-8), `${displayName(mySeat)}: pass`],
      };
    });
  }

  // host runs bot turns for empty seats
  useEffect(() => {
    if (!amIHost || !game || game.phase !== "playing") return;
    const actor = game.currentPlayer;
    if (players[actor]) return; // seat is human, wait for them
    botTimer.current = setTimeout(async () => {
      const gameRef = ref(db, `rooms/${roomId}/game`);
      await runTransaction(gameRef, (current) => {
        if (!current || current.phase !== "playing" || current.currentPlayer !== actor) return;
        const hand = current.hands[actor];
        const mustLead = !current.currentCombo;
        let chosen = null;
        if (mustLead) {
          if (!current.firstPlayDone && current.startingPlayer === actor) {
            chosen = { cards: [hand.reduce((m, c) => (cardValue(c) < cardValue(m) ? c : m), hand[0])] };
          } else {
            const multi = getMultiLeadOptions(hand);
            chosen =
              multi.length > 0 && Math.random() < 0.55
                ? multi[0]
                : { cards: [hand.reduce((m, c) => (cardValue(c) < cardValue(m) ? c : m), hand[0])] };
          }
        } else {
          const plays = findBeatingPlays(hand, current.currentCombo);
          chosen = plays.length > 0 ? plays[0] : null;
        }
        if (!chosen) {
          const nextPass = current.passCount + 1;
          if (nextPass >= 3) {
            return {
              ...current,
              currentCombo: null,
              passCount: 0,
              currentPlayer: current.currentCombo.ownerIdx,
              message: `${displayName(actor)} pass. Meja bersih — giliran ${displayName(current.currentCombo.ownerIdx)}.`,
              log: [...(current.log || []).slice(-8), `${displayName(actor)}: pass (meja bersih)`],
            };
          }
          return {
            ...current,
            passCount: nextPass,
            currentPlayer: (actor + 1) % 4,
            message: `${displayName(actor)} pass.`,
            log: [...(current.log || []).slice(-8), `${displayName(actor)}: pass`],
          };
        }
        const combo = classifySelection(chosen.cards);
        const keys = new Set(chosen.cards.map(cardKey));
        const newHands = [...current.hands];
        newHands[actor] = hand.filter((c) => !keys.has(cardKey(c)));
        let next = {
          ...current,
          hands: newHands,
          currentCombo: { ...combo, ownerIdx: actor, cards: chosen.cards },
          firstPlayDone: true,
          passCount: 0,
          message: `${displayName(actor)} memainkan ${combo.label}.`,
          log: [...(current.log || []).slice(-8), `${displayName(actor)}: ${combo.label}`],
        };
        if (newHands[actor].length === 0) {
          const wins = [...current.wins];
          wins[actor] += 1;
          next = { ...next, phase: "roundover", wins, message: `${displayName(actor)} menghabiskan kartu dan menang ronde ini!` };
        } else {
          next.currentPlayer = (actor + 1) % 4;
        }
        return next;
      });
    }, 900);
    return () => clearTimeout(botTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, players, amIHost]);

  const toggleCard = (card) => {
    if (!game || game.phase !== "playing" || game.currentPlayer !== mySeat) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const k = cardKey(card);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  function handlePlay() {
    if (!game) return;
    const cards = game.hands[mySeat].filter((c) => selected.has(cardKey(c)));
    if (cards.length === 0) {
      setError("Pilih kartu dulu.");
      return;
    }
    playCards(cards);
  }

  const cream = "#F5EFE0";
  const gold = "#C9A227";
  const navy = "#0B2340";
  const navyDark = "#071730";
  const wood = "linear-gradient(180deg, #6B4226, #3E2519)";

  /* ---------- room join screen ---------- */

  if (!joined) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", background: "#1a1310", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, maxWidth: 380, width: "100%", color: cream }}>
          <h1 style={{ fontFamily: "Georgia, serif", color: gold, fontSize: 22, marginTop: 0 }}>Big Two</h1>
          <p style={{ fontSize: 13, opacity: 0.85 }}>
            Masukkan kode room untuk gabung dengan temanmu, atau kosongkan untuk membuat room baru.
          </p>
          <input
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Kode room (kosongkan untuk buat baru)"
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #C9A227", width: "100%", marginBottom: 12, boxSizing: "border-box" }}
          />
          <Button primary onClick={() => enterRoom(roomInput)}>
            {roomInput.trim() ? "Gabung Room" : "Buat Room Baru"}
          </Button>
        </div>
      </div>
    );
  }

  const inLobby = mySeat === null;
  const gameReady = game && game.phase !== "lobby";
  const seatByRel = (rel) => (mySeat === null ? rel : (rel + mySeat) % 4);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#1a1310", minHeight: "100vh", padding: 16, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 10 }}>
        <h1 style={{ fontFamily: "Georgia, serif", color: gold, fontSize: 20, margin: 0, textAlign: "center" }}>
          Big Two — Room {roomId}
        </h1>
        <div style={{ textAlign: "center", color: "#cfcfcf", fontSize: 12 }}>
          Bagikan link ini ke temanmu: <code>{window.location.href}</code>
        </div>

        {inLobby && (
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, color: cream }}>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Nama kamu"
              style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #C9A227", marginBottom: 12, width: 200 }}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[0, 1, 2, 3].map((seat) => (
                <div key={seat} style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: 12, minWidth: 130, textAlign: "center" }}>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Kursi {seat + 1}</div>
                  <div style={{ fontSize: 14, marginBottom: 8, fontWeight: 600 }}>{players[seat]?.name || "Kosong (bot)"}</div>
                  {!players[seat] && (
                    <Button primary small onClick={() => sitDown(seat)}>
                     Duduk
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {error && <div style={{ color: "#E08080", fontSize: 12, marginTop: 10 }}>{error}</div>}
          </div>
        )}

        {!inLobby && !gameReady && (
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, color: cream, textAlign: "center" }}>
            <div style={{ marginBottom: 10 }}>
              Kamu duduk di Kursi {mySeat + 1} ({displayName(mySeat)}). {amIHost ? "Kamu host." : "Menunggu host memulai game..."}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
              {[0, 1, 2, 3].map((seat) => (
                <div key={seat} style={{ background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "8px 12px", minWidth: 110 }}>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>Kursi {seat + 1}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: players[seat] ? 6 : 0 }}>
                    {players[seat]?.name || "Kosong (bot)"}
                  </div>
                  {amIHost && players[seat] && seat !== mySeat && (
                    <Button small onClick={() => makeBot(seat)}>
                      Jadikan Bot
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {amIHost && (
              <Button primary onClick={startGame} disabled={occupiedSeats.length < 1}>
                Mulai Game
              </Button>
            )}
          </div>
        )}

        {gameReady && (
          <>
            <div style={{ background: wood, borderRadius: 20, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <div
                style={{
                  background: `radial-gradient(ellipse at center, ${navy} 0%, ${navyDark} 100%)`,
                  borderRadius: 16,
                  border: `2px solid ${gold}`,
                  padding: "16px 14px",
                  minHeight: 420,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <SeatRow seat={seatByRel(2)} game={game} displayName={displayName} cream={cream} amIHost={amIHost} makeBot={makeBot} players={players} />
                <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                  <SeatRow seat={seatByRel(1)} game={game} displayName={displayName} cream={cream} vertical amIHost={amIHost} makeBot={makeBot} players={players} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 100, justifyContent: "center" }}>
                    {game.currentCombo ? (
                      <>
                        <div style={{ color: gold, fontSize: 11 }}>{displayName(game.currentCombo.ownerIdx)} — {game.currentCombo.label}</div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {game.currentCombo.cards.map((c) => (
                            <CardFace key={cardKey(c)} card={c} small />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: "rgba(245,239,224,0.5)", fontSize: 12 }}>Meja kosong</div>
                    )}
                  </div>
                  <SeatRow seat={seatByRel(3)} game={game} displayName={displayName} cream={cream} vertical amIHost={amIHost} makeBot={makeBot} players={players} />
                </div>

                <div style={{ color: cream, fontSize: 13, textAlign: "center", minHeight: 18, maxWidth: 520 }}>{game.message}</div>
                {error && <div style={{ color: "#E08080", fontSize: 12 }}>{error}</div>}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, maxWidth: 600 }}>
                    {(game.hands[mySeat] || []).map((c) => (
                      <CardFace key={cardKey(c)} card={c} selected={selected.has(cardKey(c))} onClick={() => toggleCard(c)} />
                    ))}
                  </div>
                  <div style={{ color: cream, fontSize: 12 }}>
                    {displayName(mySeat)} {game.currentPlayer === mySeat && game.phase === "playing" ? "(giliranmu)" : ""}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ color: "#cfcfcf", fontSize: 12 }}>
                  {displayName(i)}: {game.wins[i]} menang
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
              {game.phase === "playing" && game.currentPlayer === mySeat && (
                <>
                  <Button primary onClick={handlePlay}>
                    Mainkan Kartu ({selected.size})
                  </Button>
                  <Button disabled={!game.currentCombo} onClick={passTurn}>
                    Pass
                  </Button>
                </>
              )}
              {game.phase === "roundover" && amIHost && (
                <Button primary onClick={nextRound}>
                  Ronde Berikutnya
                </Button>
              )}
              {game.phase === "roundover" && !amIHost && <div style={{ color: cream, fontSize: 12 }}>Menunggu host memulai ronde berikutnya...</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SeatRow({ seat, game, displayName, cream, vertical, amIHost, makeBot, players }) {
  const isTurn = game.phase === "playing" && game.currentPlayer === seat;
  const count = game.hands[seat] ? game.hands[seat].length : 13;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        borderRadius: 10,
        background: isTurn ? "rgba(201,162,39,0.18)" : "transparent",
        border: isTurn ? "1px solid #C9A227" : "1px solid transparent",
      }}
    >
      <div style={{ display: "flex", gap: 0 }}>
        {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
          <CardFace key={i} faceDown small />
        ))}
      </div>
      <div style={{ color: cream, fontSize: 11, textAlign: "center" }}>
        {displayName(seat)} ({count})
      </div>
      {amIHost && players[seat] && (
        <Button small onClick={() => makeBot(seat)}>
          Jadikan Bot
        </Button>
      )}
    </div>
  );
}