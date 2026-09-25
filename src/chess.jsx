import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "./firebase";
import { get, onValue, ref, runTransaction, set } from "firebase/database";
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
const PANEL = "rgba(255,255,255,0.05)";
const PROMOTION = [
  ["queen", "Ratu"],
  ["rook", "Benteng"],
  ["bishop", "Gajah"],
  ["knight", "Kuda"],
];

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
function playerId() {
  const key = "rgamehub_chess_player_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
function clean(v) {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === "object") {
    const out = {};
    Object.entries(v).forEach(([k, x]) => {
      if (x !== undefined) out[k] = clean(x);
    });
    return out;
  }
  return v;
}
function initial() { return clean(createInitialState()); }
function board8(board) {
  const fallback = createInitialState()?.board;
  const source = Array.isArray(board)
    ? board
    : board && typeof board === "object"
      ? Array.from({ length: 8 }, (_, r) => board[r] ?? board[String(r)] ?? null)
      : fallback;
  return Array.from({ length: 8 }, (_, r) => {
    const row = source?.[r];
    return Array.from({ length: 8 }, (_, c) => {
      if (Array.isArray(row)) return row[c] ?? null;
      if (row && typeof row === "object") return row[c] ?? row[String(c)] ?? null;
      return null;
    });
  });
}
function normalize(game) {
  if (!game) return null;
  const base = createInitialState();
  return {
    ...base,
    ...game,
    board: board8(game.board),
    turn: game.turn === "black" ? "black" : "white",
    castling: game.castling ?? base.castling,
    enPassant: game.enPassant ?? null,
    moveHistory: Array.isArray(game.moveHistory) ? game.moveHistory : [],
  };
}
function statusOf(game) {
  try { return getGameStatus(normalize(game)); }
  catch (e) {
    console.error("Chess status:", e);
    return { status: "playing", check: false, gameOver: false, winner: null };
  }
}
function Button({ children, onClick, primary, disabled, style }) {
  return <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} style={{
    minHeight: 44, padding: "10px 15px", borderRadius: 10,
    border: primary ? "none" : `1px solid rgba(201,162,39,.5)`,
    background: disabled ? "rgba(255,255,255,.07)" : primary ? GOLD : "rgba(255,255,255,.04)",
    color: primary && !disabled ? "#17100c" : CREAM, fontWeight: 800, cursor: disabled ? "not-allowed" : "pointer", ...style
  }}>{children}</button>;
}

export function Chess() {
  const [screen, setScreen] = useState("menu");
  const [mode, setMode] = useState(null);
  const [roomInput, setRoomInput] = useState("");
  const [room, setRoom] = useState("");
  const [meId] = useState(() => playerId());
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState("");
  const [game, setGame] = useState(null);
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [botColor, setBotColor] = useState("black");
  const [botLevel, setBotLevel] = useState("normal");
  const botTimer = useRef(null);

  useEffect(() => {
    if (mode !== "pvp" || !room) return;
    const unsubscribe = onValue(ref(db, `chessRooms/${room}`), snap => {
      const value = snap.val();
      if (!value) { setRoomData(null); setError("Room tidak ditemukan."); return; }
      setError(""); setRoomData(value);
      if (value.gameStarted && value.game) { setGame(normalize(value.game)); setScreen("game"); }
      else { setGame(null); setScreen("lobby"); }
    }, e => { console.error(e); setError("Gagal membaca room."); });
    return () => unsubscribe();
  }, [mode, room]);

  async function createRoom() {
    try {
      setError(""); const code = roomCode();
      await set(ref(db, `chessRooms/${code}`), clean({
        hostId: meId, createdAt: Date.now(), gameStarted: false, game: null,
        players: { [meId]: { id: meId, name: "Player 1", number: 1, color: null } }
      }));
      setMode("pvp"); setRoom(code); setScreen("lobby");
    } catch (e) { console.error(e); setError("Gagal membuat room."); }
  }

  async function joinRoom() {
    const code = roomInput.trim().toUpperCase();
    if (!code) { setError("Masukkan kode room."); return; }
    try {
      setError(""); const roomRef = ref(db, `chessRooms/${code}`);
      const snap = await get(roomRef);
      if (!snap.exists()) { setError("Room tidak ditemukan."); return; }
      const result = await runTransaction(roomRef, current => {
        if (!current) return;
        const players = current.players || {};
        if (players[meId]) return current;
        if (Object.keys(players).length >= 2) return;
        return { ...current, players: { ...players, [meId]: { id: meId, name: "Player 2", number: 2, color: null } } };
      });
      if (!result.committed || !result.snapshot.val()?.players?.[meId]) { setError("Room penuh atau gagal bergabung."); return; }
      setMode("pvp"); setRoom(code); setRoomInput(""); setScreen("lobby");
    } catch (e) { console.error(e); setError("Gagal bergabung ke room."); }
  }

  async function chooseColor(color) {
    if (!room || !roomData?.players?.[meId]) return;
    try {
      const result = await runTransaction(ref(db, `chessRooms/${room}/players`), players => {
        if (!players?.[meId]) return;
        const next = { ...players };
        const taken = Object.values(next).some(p => p?.id !== meId && p?.color === color);
        if (taken) return;
        next[meId] = { ...next[meId], color };
        return next;
      });
      if (!result.committed) setError("Warna baru saja dipilih pemain lain.");
    } catch (e) { console.error(e); setError("Gagal memilih warna."); }
  }

  async function startPvP() {
    if (!room || !roomData) return;
    try {
      setError("");
      const result = await runTransaction(ref(db, `chessRooms/${room}`), current => {
        if (!current || current.hostId !== meId) return;
        const list = Object.values(current.players || {});
        if (list.length !== 2) return;
        if (!list.some(p => p?.color === "white") || !list.some(p => p?.color === "black")) return;
        return { ...current, gameStarted: true, game: initial() };
      });
      if (!result.committed) { setError("Belum bisa mulai. Pastikan 2 pemain dan kedua warna sudah dipilih."); return; }
    } catch (e) { console.error(e); setError("Gagal memulai game."); }
  }

  function startBot() {
    setMode("bot"); setGame(initial()); setSelected(null); setPromotion(null); setScreen("game");
  }

  const players = roomData?.players || {};
  const me = players[meId] || null;
  const white = Object.values(players).find(p => p?.color === "white") || null;
  const black = Object.values(players).find(p => p?.color === "black") || null;
  const myColor = mode === "pvp" ? me?.color || null : null;
  const host = mode === "pvp" && roomData?.hostId === meId;
  const state = useMemo(() => normalize(game), [game]);
  const status = useMemo(() => state ? statusOf(state) : null, [state]);
  const moves = useMemo(() => {
    if (!state || !selected) return [];
    try { return getLegalMoves(state, selected.row, selected.col) || []; }
    catch (e) { console.error(e); return []; }
  }, [state, selected]);
  const checkedKing = useMemo(() => {
    if (!state || !status?.check) return null;
    try { return findKing(state.board, state.turn); } catch { return null; }
  }, [state, status]);

  function statusText() {
    if (!state || !status) return "";
    if (status.status === "checkmate") return `SKAKMAT! ${status.winner === "white" ? "Putih" : "Hitam"} menang`;
    if (status.status === "stalemate") return "STALEMATE — REMIS";
    if (status.status === "check") return `SKAK! Giliran ${state.turn === "white" ? "Putih" : "Hitam"}`;
    return `Giliran ${state.turn === "white" ? "Putih" : "Hitam"}`;
  }

  function canMove() {
    if (!state || status?.gameOver) return false;
    if (mode === "bot") return state.turn !== botColor;
    return mode === "pvp" && !!myColor && state.turn === myColor;
  }

  function doLocalMove(move, piece = "queen") {
    if (!selected || !state) return;
    try {
      setGame(normalize(applyMove(state, selected.row, selected.col, move, piece)));
      setSelected(null); setPromotion(null);
    } catch (e) { console.error("Apply move:", e); }
  }

  async function doPvPMove(move, piece = "queen") {
    if (!selected || !myColor || !room) return;
    try {
      const result = await runTransaction(ref(db, `chessRooms/${room}/game`), current => {
        if (!current) return;
        const latest = normalize(current);
        if (latest.turn !== myColor || statusOf(latest).gameOver) return;
        return clean(applyMove(latest, selected.row, selected.col, move, piece));
      });
      if (!result.committed) setError("Langkah gagal atau giliran sudah berubah.");
      else { setSelected(null); setPromotion(null); setError(""); }
    } catch (e) { console.error(e); setError("Gagal memainkan langkah."); }
  }

  function clickSquare(row, col) {
    if (!state || !canMove() || promotion) return;
    const piece = state.board?.[row]?.[col];
    if (!selected) {
      if (!piece || piece.color !== state.turn) return;
      if ((getLegalMoves(state, row, col) || []).length === 0) return;
      setSelected({ row, col }); return;
    }
    if (piece?.color === state.turn) {
      if ((getLegalMoves(state, row, col) || []).length) setSelected({ row, col });
      return;
    }
    const move = moves.find(m => m.row === row && m.col === col);
    if (!move) return;
    if (move.promotion) { setPromotion({ move, from: selected }); return; }
    mode === "pvp" ? doPvPMove(move) : doLocalMove(move);
  }

  useEffect(() => {
    if (mode !== "bot" || !state || status?.gameOver || state.turn !== botColor) return;
    if (botTimer.current) clearTimeout(botTimer.current);
    botTimer.current = setTimeout(() => {
      const all = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = state.board[r]?.[c];
        if (!p || p.color !== state.turn) continue;
        let legal = [];
        try { legal = getLegalMoves(state, r, c) || []; } catch {}
        legal.forEach(move => all.push({ from: { row: r, col: c }, move }));
      }
      if (!all.length) return;
      const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
      all.sort((a, b) => (values[state.board[b.move.row]?.[b.move.col]?.type] || 0) - (values[state.board[a.move.row]?.[a.move.col]?.type] || 0));
      const pick = botLevel === "easy" ? all[Math.floor(Math.random() * all.length)] : botLevel === "normal" ? all[Math.floor(Math.random() * Math.min(5, all.length))] : all[0];
      try {
        setGame(normalize(applyMove(state, pick.from.row, pick.from.col, pick.move, "queen")));
        setSelected(null); setPromotion(null);
      } catch (e) { console.error("Bot move:", e); }
    }, 650);
    return () => clearTimeout(botTimer.current);
  }, [mode, state, status?.gameOver, botColor, botLevel]);

  function backMenu() {
    if (botTimer.current) clearTimeout(botTimer.current);
    setScreen("menu"); setMode(null); setRoom(""); setRoomData(null); setGame(null); setSelected(null); setPromotion(null); setError("");
  }

  const shell = { minHeight: "100dvh", width: "100%", background: BG, color: CREAM, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, boxSizing: "border-box", fontFamily: "system-ui, sans-serif", overflowX: "hidden" };
  const card = { width: "100%", maxWidth: 650, padding: 24, boxSizing: "border-box", borderRadius: 18, border: `1px solid rgba(201,162,39,.42)`, background: PANEL };

  if (screen === "menu") return <div style={shell}><div style={{ ...card, maxWidth: 560, textAlign: "center" }}>
    <div style={{ fontSize: 56 }}>♟</div><h1 style={{ margin: 0, color: GOLD, fontFamily: "Georgia,serif", fontSize: 40 }}>Chess</h1><p style={{ opacity: .7 }}>Multiplayer Chess</p>
    <Button primary onClick={createRoom} style={{ width: "100%" }}>🎮 Buat Room Baru</Button>
    <div style={{ margin: "12px 0", opacity: .55, fontSize: 11 }}>ATAU</div>
    <input value={roomInput} maxLength={8} onChange={e => setRoomInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && joinRoom()} placeholder="KODE ROOM" style={{ width: "100%", boxSizing: "border-box", minHeight: 50, borderRadius: 10, border: `1px solid ${GOLD}`, background: "#14110F", color: CREAM, textAlign: "center", fontSize: 20, fontWeight: 900, letterSpacing: 5 }} />
    <Button onClick={joinRoom} style={{ width: "100%", marginTop: 10 }}>🔑 Gabung Room</Button>
    <Button onClick={() => setScreen("botSetup")} style={{ width: "100%", marginTop: 10 }}>🤖 Main vs Bot</Button>
    {error && <div style={{ marginTop: 12, padding: 10, borderRadius: 9, background: "rgba(180,60,60,.14)", color: "#ffb0b0", fontSize: 13 }}>{error}</div>}
    <button type="button" onClick={backMenu} style={{ marginTop: 18, border: 0, background: "transparent", color: CREAM, opacity: .6, cursor: "pointer" }}>← Kembali ke Game Hub</button>
  </div></div>;

  if (screen === "botSetup") return <div style={shell}><div style={{ ...card, maxWidth: 520 }}>
    <h1 style={{ color: GOLD, fontFamily: "Georgia,serif", textAlign: "center", marginTop: 0 }}>🤖 Main vs Bot</h1>
    <p style={{ textAlign: "center", opacity: .7 }}>Pilih warna kamu dan level bot.</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "18px 0" }}>
      {["white", "black"].map(c => <button key={c} type="button" onClick={() => setBotColor(c === "white" ? "black" : "white")} style={{ minHeight: 52, borderRadius: 10, border: botColor === (c === "white" ? "black" : "white") ? `2px solid ${GOLD}` : "1px solid rgba(201,162,39,.35)", background: botColor === (c === "white" ? "black" : "white") ? "rgba(201,162,39,.14)" : "rgba(255,255,255,.04)", color: CREAM, fontWeight: 800 }}>Aku {c === "white" ? "Putih" : "Hitam"}</button>)}
    </div>
    <div style={{ fontWeight: 800, marginBottom: 8 }}>Level Bot</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
      {["easy", "normal", "hard"].map(l => <button key={l} type="button" onClick={() => setBotLevel(l)} style={{ minHeight: 46, borderRadius: 10, border: botLevel === l ? `2px solid ${GOLD}` : "1px solid rgba(201,162,39,.35)", background: botLevel === l ? "rgba(201,162,39,.14)" : "rgba(255,255,255,.04)", color: CREAM, fontWeight: 800 }}>{l[0].toUpperCase() + l.slice(1)}</button>)}
    </div>
    <Button primary onClick={startBot} style={{ width: "100%" }}>Mulai Game</Button><Button onClick={backMenu} style={{ width: "100%", marginTop: 9 }}>← Kembali</Button>
  </div></div>;

  if (screen === "lobby") return <div style={shell}><div style={card}>
    <div style={{ fontSize: 11, opacity: .6 }}>CHESS ROOM</div><div style={{ color: GOLD, fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>{room}</div>
    <div style={{ margin: "15px 0", padding: 12, borderRadius: 10, background: "rgba(201,162,39,.07)", textAlign: "center" }}>{Object.keys(players).length}/2 pemain<br /><small style={{ opacity: .6 }}>{host ? "Kamu adalah Host." : "Menunggu Host memulai game."}</small></div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {["white", "black"].map(c => { const p = c === "white" ? white : black; return <div key={c} style={{ flex: "1 1 220px", padding: 15, borderRadius: 12, border: `1px solid ${p ? GOLD : "rgba(201,162,39,.25)"}`, background: "rgba(0,0,0,.16)", textAlign: "center" }}><div style={{ opacity: .6, fontSize: 11 }}>{c === "white" ? "PUTIH" : "HITAM"}</div><div style={{ fontWeight: 900, margin: "8px 0 10px" }}>{p ? `${p.name}${p.id === meId ? " • Kamu" : ""}` : "Belum dipilih"}</div>{!p && me && Object.keys(players).length === 2 && <Button primary onClick={() => chooseColor(c)} style={{ width: "100%" }}>Pilih {c === "white" ? "Putih" : "Hitam"}</Button>}</div>; })}
    </div>
    {Object.keys(players).length < 2 && <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(255,255,255,.04)", textAlign: "center", fontSize: 13 }}>Bagikan kode <b>{room}</b> ke temanmu.</div>}
    {host && <Button primary onClick={startPvP} disabled={Object.keys(players).length !== 2 || !white || !black} style={{ width: "100%", marginTop: 14 }}>♟ Mulai Game</Button>}
    {!host && Object.keys(players).length === 2 && <div style={{ textAlign: "center", opacity: .65, paddingTop: 12 }}>⏳ Menunggu Host memulai game...</div>}
    {error && <div style={{ marginTop: 12, padding: 10, borderRadius: 9, background: "rgba(180,60,60,.14)", color: "#ffb0b0", textAlign: "center", fontSize: 13 }}>{error}</div>}
    <Button onClick={backMenu} style={{ width: "100%", marginTop: 12 }}>← Keluar</Button>
  </div></div>;

  const board = board8(state?.board);
  return <div style={{ minHeight: "100dvh", width: "100%", background: BG, color: CREAM, padding: "clamp(12px,3vw,26px) 12px 28px", boxSizing: "border-box", overflowX: "hidden", fontFamily: "system-ui,sans-serif" }}>
    <div style={{ width: "100%", maxWidth: 620, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}><div style={{ color: GOLD, fontFamily: "Georgia,serif", fontSize: "clamp(28px,6vw,38px)", fontWeight: 900 }}>♟ Chess</div>{mode === "pvp" && <div style={{ fontSize: 11, opacity: .55 }}>ROOM {room} • Kamu: {myColor ? (myColor === "white" ? "Putih" : "Hitam") : "Belum pilih"}</div>}{mode === "bot" && <div style={{ fontSize: 11, opacity: .55 }}>VS BOT • {botLevel.toUpperCase()}</div>}</div>
      <div style={{ width: "100%", maxWidth: 580, minHeight: 48, borderRadius: 12, border: status?.status === "checkmate" ? "1px solid #b84b4b" : `1px solid rgba(201,162,39,.34)`, background: status?.status === "checkmate" ? "rgba(180,60,60,.12)" : "rgba(255,255,255,.035)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "8px 12px", boxSizing: "border-box", marginBottom: 14, fontWeight: 900 }}>{statusText()}</div>
      <div style={{ width: "min(92vw,580px)", maxWidth: "100%", aspectRatio: "1/1", flexShrink: 0 }}><div style={{ width: "100%", height: "100%", display: "grid", gridTemplateColumns: "repeat(8,minmax(0,1fr))", gridTemplateRows: "repeat(8,minmax(0,1fr))", border: `3px solid ${GOLD}`, borderRadius: 6, overflow: "hidden", boxSizing: "border-box", boxShadow: "0 10px 30px rgba(0,0,0,.42)" }}>
        {board.map((row, r) => row.map((piece, c) => { const dark = (r+c)%2===1; const selectedHere = selected?.row===r && selected?.col===c; const legal = moves.some(m => m.row===r && m.col===c); const checkKing = checkedKing?.row===r && checkedKing?.col===c; return <button key={`${r}-${c}`} type="button" onClick={() => clickSquare(r,c)} style={{ position: "relative", width: "100%", height: "100%", minWidth: 0, minHeight: 0, padding: 0, border: "none", outline: selectedHere ? `3px solid ${GOLD}` : "none", outlineOffset: -3, background: dark ? "#734726" : "#DFC17C", display: "flex", alignItems: "center", justifyContent: "center", cursor: canMove() ? "pointer" : "default" }}>
          {checkKing && <span style={{ position:"absolute", inset:0, background:"rgba(210,45,45,.42)" }} />}{legal && <span style={{ position:"absolute", zIndex:2, width: piece ? "70%":"24%", height: piece ? "70%":"24%", borderRadius:"50%", border: piece ? `4px solid rgba(201,162,39,.85)` : "none", background: piece ? "transparent":"rgba(30,20,15,.42)", boxSizing:"border-box" }} />}{piece && <span style={{ position:"relative", zIndex:3, fontSize:"clamp(27px,7vw,58px)", lineHeight:1, userSelect:"none", filter:"drop-shadow(0 2px 1px rgba(0,0,0,.72))", color:piece.color==="white"?"#F9F5E8":"#17110D", WebkitTextStroke:piece.color==="white"?"1px #77705f":"1px #3b2b22" }}>{getPieceSymbol(piece)}</span>}
          {r===7 && <span style={{ position:"absolute", right:3, bottom:2, fontSize:8, opacity:.45 }}>{String.fromCharCode(97+c)}</span>}{c===0 && <span style={{ position:"absolute", left:3, top:2, fontSize:8, opacity:.45 }}>{8-r}</span>}
        </button>; }))}
      </div></div>
      {promotion && <div style={{ width:"min(92vw,580px)", boxSizing:"border-box", marginTop:14, padding:14, borderRadius:12, border:`1px solid rgba(201,162,39,.5)`, background:PANEL, textAlign:"center" }}><div style={{ fontWeight:900, marginBottom:10 }}>Pilih promosi pion</div><div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:8 }}>{PROMOTION.map(([type,label]) => { const p=board[promotion.from.row]?.[promotion.from.col]; if(!p) return null; return <button key={type} type="button" onClick={() => mode === "pvp" ? doPvPMove(promotion.move,type) : doLocalMove(promotion.move,type)} style={{ minHeight:70, borderRadius:9, border:`1px solid ${GOLD}`, background:"rgba(255,255,255,.06)", color:CREAM, cursor:"pointer" }}><div style={{ fontSize:"clamp(25px,7vw,34px)" }}>{getPieceSymbol({type,color:p.color})}</div><div style={{ fontSize:10 }}>{label}</div></button>; })}</div></div>}
      {(status?.status === "checkmate" || status?.status === "stalemate") && <div style={{ width:"min(92vw,580px)", marginTop:14, padding:14, borderRadius:12, boxSizing:"border-box", background:"rgba(201,162,39,.08)", border:`1px solid rgba(201,162,39,.35)`, textAlign:"center", fontWeight:900 }}>{statusText()}</div>}
      <div style={{ width:"min(92vw,580px)", marginTop:16, display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>{mode === "bot" && <Button primary onClick={() => { setGame(initial()); setSelected(null); setPromotion(null); }}>Reset Chess</Button>}{mode === "pvp" && <Button onClick={() => { setSelected(null); setPromotion(null); setScreen("lobby"); }}>← Kembali ke Lobby</Button>}<Button onClick={backMenu}>← Game Hub</Button></div>
      {error && <div style={{ width:"min(92vw,580px)", marginTop:10, padding:10, borderRadius:9, background:"rgba(180,60,60,.14)", color:"#ffb0b0", textAlign:"center", fontSize:12, boxSizing:"border-box" }}>{error}</div>}
    </div>
  </div>;
}

export default Chess;
