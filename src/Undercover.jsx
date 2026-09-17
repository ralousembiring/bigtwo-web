import React, { useEffect, useMemo, useState } from "react";
import { db } from "./firebase";
import { onValue, ref, runTransaction, set } from "firebase/database";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#1a1310";
const PANEL = "rgba(255,255,255,0.06)";
const MAX_PLAYERS = 8;

const WORD_PAIRS = [
  ["Kucing", "Harimau"],
  ["Kopi", "Teh"],
  ["Pantai", "Pulau"],
  ["Pizza", "Burger"],
  ["Sepeda", "Motor"],
  ["Hujan", "Salju"],
  ["Dokter", "Perawat"],
  ["Gunung", "Bukit"],
  ["Sekolah", "Universitas"],
  ["Apel", "Jeruk"],
  ["Pesawat", "Helikopter"],
  ["Buku", "Majalah"],
];

function roomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function Button({ children, onClick, primary, disabled, danger }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        padding: "10px 15px",
        borderRadius: 10,
        border: primary ? "none" : "1px solid rgba(255,255,255,.25)",
        background: disabled ? "#4a4238" : danger ? "#7a2a2a" : primary ? GOLD : "rgba(255,255,255,.08)",
        color: primary && !disabled ? "#1a1a1a" : CREAM,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? .6 : 1,
      }}
    >{children}</button>
  );
}

function Panel({ children }) {
  return <div style={{ background: PANEL, borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,.06)" }}>{children}</div>;
}

export function UndercoverGame() {
  const params = new URLSearchParams(window.location.search);
  const initialRoom = params.get("room") || "";
  const [roomId, setRoomId] = useState(initialRoom);
  const [roomInput, setRoomInput] = useState(initialRoom);
  const [joined, setJoined] = useState(Boolean(initialRoom));
  const [players, setPlayers] = useState(Array(MAX_PLAYERS).fill(null));
  const [game, setGame] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState(null);
  const [clue, setClue] = useState("");
  const [vote, setVote] = useState(null);
  const [error, setError] = useState("");

  const occupied = useMemo(() => players.map((p, i) => p ? i : null).filter((x) => x !== null), [players]);
  const hostSeat = occupied.length ? Math.min(...occupied) : null;
  const amHost = mySeat !== null && mySeat === hostSeat;
  const activePlayers = game?.activePlayers || occupied;

  useEffect(() => {
    if (!joined || !roomId) return;
    const playersRef = ref(db, `undercoverRooms/${roomId}/players`);
    const gameRef = ref(db, `undercoverRooms/${roomId}/game`);
    const unsubPlayers = onValue(playersRef, (snap) => {
      const val = snap.val() || {};
      setPlayers(Array.from({ length: MAX_PLAYERS }, (_, i) => val[i] || null));
    });
    const unsubGame = onValue(gameRef, (snap) => setGame(snap.val()));
    return () => { unsubPlayers(); unsubGame(); };
  }, [joined, roomId]);

  useEffect(() => {
    if (!joined || !roomId || mySeat === null) return;
    return onValue(ref(db, `undercoverRooms/${roomId}/private/${mySeat}`), (snap) => setSecret(snap.val()));
  }, [joined, roomId, mySeat]);

  useEffect(() => {
    setClue("");
    setVote(null);
  }, [game?.phase, game?.currentSpeaker, game?.round]);

  function enterRoom(value) {
    const id = value.trim().toUpperCase() || roomCode();
    setRoomId(id); setJoined(true); setError("");
    const url = new URL(window.location.href);
    url.searchParams.set("game", "undercover");
    url.searchParams.set("room", id);
    window.history.replaceState({}, "", url);
  }

  async function sitDown(seat) {
    if (!name.trim()) return setError("Isi nama dulu ya.");
    const result = await runTransaction(ref(db, `undercoverRooms/${roomId}/players/${seat}`), (current) => current || { name: name.trim() });
    if (!result.committed) return setError("Kursi itu sudah diambil.");
    setMySeat(seat); setError("");
  }

  async function leaveSeat() {
    if (mySeat === null) return;
    await set(ref(db, `undercoverRooms/${roomId}/players/${mySeat}`), null);
    await set(ref(db, `undercoverRooms/${roomId}/private/${mySeat}`), null);
    setMySeat(null);
  }

  async function startGame() {
    if (occupied.length < 3) return setError("Minimal 3 pemain untuk memulai.");
    const undercoverSeat = occupied[Math.floor(Math.random() * occupied.length)];
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const undercoverWord = pair[1];
    const civilianWord = pair[0];
    const firstSpeaker = occupied[0];
    const privateWrites = occupied.map((seat) =>
      set(ref(db, `undercoverRooms/${roomId}/private/${seat}`), {
        role: seat === undercoverSeat ? "undercover" : "civilian",
        word: seat === undercoverSeat ? undercoverWord : civilianWord,
        round: 1,
      })
    );
    await Promise.all(privateWrites);
    await set(ref(db, `undercoverRooms/${roomId}/game`), {
      phase: "clue",
      round: 1,
      activePlayers: occupied,
      currentSpeaker: firstSpeaker,
      clues: {},
      votes: {},
      eliminated: null,
      message: "Semua pemain lihat kata rahasianya. Beri clue saat giliranmu.",
    });
    setError("");
  }

  async function submitClue() {
    if (!game || game.phase !== "clue" || game.currentSpeaker !== mySeat || !clue.trim()) return;
    const nextIndex = activePlayers.indexOf(mySeat) + 1;
    const nextSpeaker = nextIndex < activePlayers.length ? activePlayers[nextIndex] : null;
    const clues = { ...(game.clues || {}), [mySeat]: clue.trim().slice(0, 80) };
    await runTransaction(ref(db, `undercoverRooms/${roomId}/game`), (current) => {
      if (!current || current.phase !== "clue" || current.currentSpeaker !== mySeat) return;
      if (nextSpeaker === null) return { ...current, phase: "voting", currentSpeaker: null, clues, votes: {}, message: "Semua clue sudah masuk. Sekarang voting." };
      return { ...current, clues, currentSpeaker: nextSpeaker, message: `Giliran ${players[nextSpeaker]?.name || "pemain"} memberi clue.` };
    });
  }

  async function castVote(target) {
    if (!game || game.phase !== "voting" || !activePlayers.includes(mySeat) || target === mySeat) return;
    const result = await runTransaction(ref(db, `undercoverRooms/${roomId}/game`), (current) => {
      if (!current || current.phase !== "voting") return;
      const votes = { ...(current.votes || {}), [mySeat]: target };
      if (Object.keys(votes).length < activePlayers.length) return { ...current, votes, message: `${Object.keys(votes).length}/${activePlayers.length} pemain sudah voting.` };
      const counts = {};
      activePlayers.forEach((s) => { counts[s] = 0; });
      Object.values(votes).forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      const max = Math.max(...Object.values(counts));
      const top = activePlayers.filter((s) => counts[s] === max);
      const eliminated = top[Math.floor(Math.random() * top.length)];
      return { ...current, votes, phase: "result", eliminated, message: `${players[eliminated]?.name || "Pemain"} mendapat vote terbanyak.` };
    });
    if (result.committed) setVote(target);
  }

  async function finishResult() {
    if (!game || game.phase !== "result") return;
    const eliminated = game.eliminated;
    const mySecret = secret;
    if (!mySecret) return;
    // Each player can see their own role; only the host finalizes the public winner.
    if (!amHost) return;
    const snap = await new Promise((resolve) => {
      const unsub = onValue(ref(db, `undercoverRooms/${roomId}/private`), (s) => { resolve(s.val() || {}); unsub(); }, { onlyOnce: true });
    });
    const eliminatedSecret = snap[eliminated];
    const winner = eliminatedSecret?.role === "undercover" ? "civilian" : "undercover";
    const reveal = Object.fromEntries(
      Object.entries(snap).map(([seat, info]) => [seat, { role: info?.role || "civilian", word: info?.word || "" }])
    );
    await set(ref(db, `undercoverRooms/${roomId}/game`), {
      ...game,
      phase: "finished",
      winner,
      reveal,
      message: winner === "civilian" ? "🎉 Civilian menang! Undercover berhasil ditemukan." : "🕵️ Undercover menang! Tebakan warga meleset.",
    });
  }

  if (!joined) {
    return (
      <Shell>
        <Panel>
          <h1 style={{ fontFamily: "Georgia, serif", color: GOLD, marginTop: 0 }}>🕵️ Undercover</h1>
          <p style={{ fontSize: 13, opacity: .8 }}>Buat room baru atau masukkan kode room temanmu.</p>
          <input value={roomInput} onChange={(e) => setRoomInput(e.target.value)} placeholder="Kode room" style={inputStyle} />
          <Button primary onClick={() => enterRoom(roomInput)}>{roomInput.trim() ? "Gabung Room" : "Buat Room Baru"}</Button>
        </Panel>
      </Shell>
    );
  }

  if (mySeat === null) {
    return (
      <Shell roomId={roomId}>
        <Panel>
          <h2 style={{ marginTop: 0 }}>Lobby</h2>
          <div style={{ fontSize: 12, opacity: .75, marginBottom: 10 }}>Room: <b>{roomId}</b> — bagikan URL halaman ini ke teman.</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" style={inputStyle} />
          <div style={gridStyle}>
            {players.map((p, seat) => <div key={seat} style={seatStyle}>
              <div style={{ fontSize: 11, opacity: .6 }}>Kursi {seat + 1}</div>
              <div style={{ fontWeight: 700, margin: "5px 0 8px" }}>{p?.name || "Kosong"}</div>
              {!p && <Button primary onClick={() => sitDown(seat)}>Duduk</Button>}
            </div>)}
          </div>
          {error && <div style={errorStyle}>{error}</div>}
        </Panel>
      </Shell>
    );
  }

  const isActive = activePlayers.includes(mySeat);
  const myTurnToClue = game?.phase === "clue" && game.currentSpeaker === mySeat;
  const allClues = game?.clues || {};

  return (
    <Shell roomId={roomId}>
      <Panel>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11, opacity: .6 }}>ROOM</div><div style={{ fontWeight: 800, color: GOLD }}>{roomId}</div></div>
          <div style={{ fontSize: 12 }}>{occupied.length}/{MAX_PLAYERS} pemain</div>
          <Button onClick={leaveSeat}>Keluar</Button>
        </div>
      </Panel>

      <Panel>
        <h2 style={{ marginTop: 0, color: GOLD }}>{game?.phase === "finished" ? "Hasil Akhir" : game ? `Ronde ${game.round}` : "Menunggu permainan"}</h2>
        {!game && <div style={{ opacity: .8, fontSize: 13 }}>Menunggu host memulai. Minimal 3 pemain.</div>}
        {game && <div style={{ padding: 12, borderRadius: 10, background: "rgba(201,162,39,.08)", fontSize: 13, marginBottom: 14 }}>{game.message}</div>}

        {game && <div style={gridStyle}>
          {players.map((p, seat) => p && <div key={seat} style={{ ...seatStyle, opacity: isActive && !activePlayers.includes(seat) ? .35 : 1, border: game.currentSpeaker === seat ? `1px solid ${GOLD}` : seat === mySeat ? `1px solid rgba(201,162,39,.35)` : seatStyle.border }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
            <div style={{ fontSize: 11, opacity: .65 }}>{seat === mySeat ? "Kamu" : "Pemain"}{game.currentSpeaker === seat ? " • giliran clue" : ""}</div>
            {game.phase === "clue" && allClues[seat] && <div style={{ marginTop: 9, fontSize: 13, padding: 8, borderRadius: 8, background: "rgba(0,0,0,.2)" }}>“{allClues[seat]}”</div>}
            {game.phase === "voting" && allClues[seat] && <div style={{ marginTop: 9, fontSize: 13, padding: 8, borderRadius: 8, background: "rgba(0,0,0,.2)" }}>“{allClues[seat]}”</div>}
            {game.phase === "voting" && isActive && seat !== mySeat && <div style={{ marginTop: 9 }}><Button primary={vote === seat} onClick={() => castVote(seat)}>{vote === seat ? "✓ Dipilih" : "Vote"}</Button></div>}
            {game.phase === "result" && game.eliminated === seat && <div style={{ marginTop: 8, color: GOLD, fontWeight: 800 }}>☠️ Tereliminasi</div>}
          </div>)}
        </div>}

        {secret && game && game.phase !== "finished" && isActive && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(201,162,39,.12)", border: `1px solid rgba(201,162,39,.35)` }}>
            <div style={{ fontSize: 11, opacity: .65 }}>RAHASIA KAMU</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, margin: "5px 0" }}>{secret.word}</div>
            <div style={{ fontSize: 12 }}>Role: <b>{secret.role === "undercover" ? "UNDERCOVER" : "CIVILIAN"}</b></div>
          </div>
        )}

        {myTurnToClue && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Kasih clue yang membantu teman menebak kata, tapi jangan terlalu jelas.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={clue} onChange={(e) => setClue(e.target.value)} maxLength={80} placeholder="Contoh: biasanya ada di rumah" style={{ ...inputStyle, marginBottom: 0 }} />
              <Button primary onClick={submitClue} disabled={!clue.trim()}>Kirim</Button>
            </div>
          </div>
        )}

        {game?.phase === "voting" && isActive && <div style={{ marginTop: 14, fontSize: 12, opacity: .8 }}>Pilih pemain yang menurutmu Undercover. Kamu tidak bisa vote diri sendiri.</div>}
        {game?.phase === "result" && amHost && <div style={{ marginTop: 14 }}><Button primary onClick={finishResult}>Buka Hasil</Button></div>}
        {game?.phase === "finished" && <div style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{game.winner === "civilian" ? "🎉 CIVILIAN MENANG" : "🕵️ UNDERCOVER MENANG"}</div>}
        {game?.phase === "finished" && game.winner && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 7 }}>🔎 Pembukaan role</div>
            <div style={gridStyle}>
              {Object.entries(game.reveal || {}).map(([seat, info]) => (
                <div key={seat} style={seatStyle}>
                  <div style={{ fontWeight: 800 }}>{players[Number(seat)]?.name || `Pemain ${Number(seat) + 1}`}</div>
                  <div style={{ fontSize: 11, color: info.role === "undercover" ? GOLD : "#bdb7aa", marginTop: 4 }}>
                    {info.role === "undercover" ? "🕵️ UNDERCOVER" : "👤 CIVILIAN"}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 3 }}>Kata: <b>{info.word}</b></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {game?.phase === "result" && <div style={{ marginTop: 12, fontSize: 12, opacity: .7 }}>Host harus membuka hasil untuk melihat siapa yang sebenarnya Undercover.</div>}
        {error && <div style={errorStyle}>{error}</div>}
      </Panel>

      {!game && amHost && <Button primary onClick={startGame} disabled={occupied.length < 3}>Mulai Undercover</Button>}
      {game?.phase === "finished" && amHost && <Button primary onClick={startGame}>Main Lagi</Button>}
      <div style={{ textAlign: "center", fontSize: 10, opacity: .45 }}>MVP • role rahasia disimpan terpisah dari state game</div>
    </Shell>
  );
}

function Shell({ children, roomId }) {
  function goHome() {
    const url = new URL(window.location.href);
    url.search = "";
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: BG, minHeight: "100vh", padding: 16, color: CREAM }}>
      <div style={{ width: "100%", maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <button onClick={goHome} style={{ background: "transparent", color: CREAM, border: "1px solid rgba(255,255,255,.18)", borderRadius: 8, padding: "6px 9px", cursor: "pointer", fontSize: 11 }}>← Game Hub</button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontFamily: "Georgia, serif", color: GOLD, fontSize: 22, fontWeight: 800 }}>🕵️ Undercover</div>
            {roomId && <div style={{ fontSize: 11, opacity: .55, marginTop: 3 }}>Room {roomId}</div>}
          </div>
          <div style={{ width: 76 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px 11px", borderRadius: 9, border: `1px solid ${GOLD}`, background: "#f7f1e5", color: "#1a1a1a", marginBottom: 12, boxSizing: "border-box" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 };
const seatStyle = { background: "rgba(0,0,0,.22)", borderRadius: 11, padding: 12, border: "1px solid rgba(255,255,255,.08)" };
const errorStyle = { color: "#E08080", fontSize: 12, marginTop: 10 };
