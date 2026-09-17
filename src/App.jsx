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
      className={`player-card ${small ? "player-card-small" : ""} ${faceDown ? "player-card-back" : ""}`}
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


function SupportButton() {
  return (
    <a
      href="https://saweria.co/ralou"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "8px 13px",
        borderRadius: 10,
        border: "1px solid rgba(201,162,39,0.55)",
        background: "rgba(201,162,39,0.10)",
        color: "#F5EFE0",
        fontFamily: "system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 12,
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      ☕ Support Developer
    </a>
  );
}

function randomRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}


/* ---------- responsive layout ---------- */

const responsiveStyles = `
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; min-height: 100%; }
  button, input { -webkit-tap-highlight-color: transparent; }
  .player-card { touch-action: manipulation; }
  .board-table { overflow: hidden; }
  .board-middle { min-width: 0; }
  .opponent-left, .opponent-right { flex: 0 0 auto; }
  .center-play { min-width: 0; }

  @media (max-width: 600px) {
    .app-shell { padding: 10px !important; }
    .app-content { max-width: 100% !important; gap: 8px !important; }
    .room-title { font-size: 18px !important; }
    .room-link { font-size: 11px !important; overflow-wrap: anywhere; line-height: 1.35; }

    .board-shell { padding: 7px !important; border-radius: 17px !important; }
    .board-table {
      position: relative !important;
      min-height: 500px !important;
      height: 500px !important;
      padding: 8px !important;
      gap: 0 !important;
      display: block !important;
    }

    .opponent-top {
      position: absolute;
      top: 9px;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      display: flex;
      justify-content: center;
    }
    .opponent-top .player-card-small { width: 30px !important; height: 43px !important; }
    .opponent-top .player-card-back { margin-left: -13px !important; }
    .opponent-top > div { padding: 2px 4px !important; }

    .board-middle {
      position: absolute !important;
      top: 72px;
      left: 5px;
      right: 5px;
      width: auto !important;
      display: grid !important;
      grid-template-columns: 72px minmax(0, 1fr) 72px;
      align-items: center;
      gap: 3px;
    }
    .opponent-left, .opponent-right {
      width: 72px;
      min-width: 0;
      overflow: hidden;
    }
    .opponent-left > div, .opponent-right > div {
      width: 72px;
      padding: 2px !important;
      gap: 3px !important;
      overflow: hidden;
    }
    .opponent-left .player-card-small, .opponent-right .player-card-small {
      width: 22px !important;
      height: 32px !important;
    }
    .opponent-left .player-card-back, .opponent-right .player-card-back { margin-left: -15px !important; }
    .opponent-left .player-card-small:first-child, .opponent-right .player-card-small:first-child { margin-left: 0 !important; }
    .opponent-left button, .opponent-right button { white-space: nowrap; }
    .opponent-left > div > div:last-child, .opponent-right > div > div:last-child {
      max-width: 70px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .center-play { width: 100%; min-width: 0; min-height: 100px !important; overflow: hidden; }
    .center-play > div:first-child { font-size: 10px !important; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .center-play .player-card-small { width: 30px !important; height: 43px !important; }

    .game-message {
      position: absolute;
      top: 183px;
      left: 18px;
      right: 18px;
      max-width: none !important;
      font-size: 11px !important;
      line-height: 1.35;
      min-height: 32px !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .game-error {
      position: absolute;
      top: 218px;
      left: 12px;
      right: 12px;
      text-align: center;
      line-height: 1.3;
    }

    .my-hand {
      position: absolute !important;
      left: 7px;
      right: 7px;
      bottom: 12px;
      width: auto !important;
      gap: 5px !important;
    }
    .hand-cards {
      width: 100%;
      max-width: 320px !important;
      gap: 5px !important;
      align-content: center;
    }
    .hand-cards .player-card:not(.player-card-small) {
      width: 48px !important;
      height: 68px !important;
    }
    .hand-cards .player-card:not(.player-card-small) div { font-size: 11px !important; }
    .hand-cards .player-card:not(.player-card-small) div div { font-size: 9px !important; }
    .my-hand > div:last-child { font-size: 11px !important; }

    .scoreboard { gap: 6px 12px !important; padding: 0 8px; }
    .scoreboard > div { font-size: 11px !important; }
    .game-actions { gap: 8px !important; }
    .game-actions button { min-height: 42px; padding: 9px 13px !important; }
  }

  @media (max-width: 360px) {
    .board-table { min-height: 490px !important; height: 490px !important; }
    .board-middle { grid-template-columns: 66px minmax(0,1fr) 66px; }
    .opponent-left, .opponent-right, .opponent-left > div, .opponent-right > div { width: 66px; }
    .opponent-left .player-card-small, .opponent-right .player-card-small { width: 20px !important; height: 29px !important; }
    .hand-cards { max-width: 300px !important; gap: 4px !important; }
    .hand-cards .player-card:not(.player-card-small) { width: 44px !important; height: 63px !important; }
  }
`;

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
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <SupportButton />
            <div style={{ color: "#bdb7aa", fontSize: 10, marginTop: 7 }}>
              Suka Big Two? Dukunganmu membantu pengembangan game.
                      @Ralou 2026
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inLobby = mySeat === null;
  const gameReady = game && game.phase !== "lobby";
  const seatByRel = (rel) => (mySeat === null ? rel : (rel + mySeat) % 4);

  return (
    <div className="app-shell" style={{ fontFamily: "system-ui, sans-serif", background: "#1a1310", minHeight: "100vh", padding: 16, display: "flex", justifyContent: "center" }}>
      <style>{responsiveStyles}</style>
      <div className="app-content" style={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 10 }}>
        <h1 className="room-title" style={{ fontFamily: "Georgia, serif", color: gold, fontSize: 20, margin: 0, textAlign: "center" }}>
          Big Two — Room {roomId}
        </h1>
        <div className="room-link" style={{ textAlign: "center", color: "#cfcfcf", fontSize: 12 }}>
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
            <div className="board-shell" style={{ background: wood, borderRadius: 20, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <div
                className="board-table"
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
                <div className="opponent-top">
                  <SeatRow seat={seatByRel(2)} game={game} displayName={displayName} cream={cream} amIHost={amIHost} makeBot={makeBot} players={players} />
                </div>
                <div className="board-middle" style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="opponent-left">
                    <SeatRow seat={seatByRel(1)} game={game} displayName={displayName} cream={cream} vertical amIHost={amIHost} makeBot={makeBot} players={players} />
                  </div>
                  <div className="center-play" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 100, justifyContent: "center" }}>
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
                  <div className="opponent-right">
                    <SeatRow seat={seatByRel(3)} game={game} displayName={displayName} cream={cream} vertical amIHost={amIHost} makeBot={makeBot} players={players} />
                  </div>
                </div>

                <div className="game-message" style={{ color: cream, fontSize: 13, textAlign: "center", minHeight: 18, maxWidth: 520 }}>{game.message}</div>
                {error && <div className="game-error" style={{ color: "#E08080", fontSize: 12 }}>{error}</div>}

                <div className="my-hand" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: "100%" }}>
                  <div className="hand-cards" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, maxWidth: 600 }}>
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

            <div className="scoreboard" style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ color: "#cfcfcf", fontSize: 12 }}>
                  {displayName(i)}: {game.wins[i]} menang
                </div>
              ))}
            </div>

            <div className="game-actions" style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
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

            <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
              <SupportButton />
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