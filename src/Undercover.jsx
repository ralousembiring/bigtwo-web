import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "./firebase";
import { get, onValue, ref, runTransaction, set } from "firebase/database";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#17110E";
const PANEL = "#24201C";
const PANEL_SOFT = "#2A2520";
const BORDER = "rgba(201,162,39,0.45)";
const SHADOW = "0 18px 45px rgba(0,0,0,0.28)";
const MAX_PLAYERS = 8;
const BOT_NAMES = ["Andi", "Budi", "Citra", "Dimas", "Eko", "Fajar", "Gita"];

const BOT_CLUES = {
  Kucing: ["hewan", "suka mengeong", "sering dipelihara", "punya kumis"],
  Harimau: ["hewan", "besar", "liar", "punya belang"],
  Kopi: ["minuman", "sering pagi hari", "pahit", "ada kafein"],
  Teh: ["minuman", "bisa hangat", "sering disajikan di rumah", "ada yang manis"],
  Pantai: ["tempat", "dekat air", "pasir", "sering buat liburan"],
  Pulau: ["tempat", "dikelilingi air", "bisa untuk liburan", "ada daratan"],
  Pizza: ["makanan", "berbentuk bulat", "sering pakai keju", "dipotong-potong"],
  Burger: ["makanan", "pakai roti", "bisa pakai daging", "sering ada sayur"],
  Sepeda: ["kendaraan", "pakai pedal", "dua roda", "tidak pakai bensin"],
  Motor: ["kendaraan", "dua roda", "pakai mesin", "bisa untuk perjalanan"],
  Hujan: ["cuaca", "air", "bisa bikin basah", "sering pakai payung"],
  Salju: ["cuaca", "dingin", "berwarna putih", "bisa menumpuk"],
  Dokter: ["pekerjaan", "rumah sakit", "membantu orang", "periksa pasien"],
  Perawat: ["pekerjaan", "rumah sakit", "merawat pasien", "membantu dokter"],
  Gunung: ["tempat", "tinggi", "bisa didaki", "ada puncak"],
  Bukit: ["tempat", "lebih rendah", "bisa didaki", "ada tanjakan"],
  Sekolah: ["tempat", "belajar", "ada guru", "ada murid"],
  Universitas: ["tempat", "belajar", "ada mahasiswa", "ada dosen"],
  Apel: ["buah", "bisa merah", "rasanya manis", "bisa dimakan langsung"],
  Jeruk: ["buah", "rasanya segar", "punya kulit", "bisa dibuat jus"],
  Pesawat: ["kendaraan", "terbang", "bandara", "untuk perjalanan jauh"],
  Helikopter: ["kendaraan", "terbang", "punya baling-baling", "bisa mendarat di tempat tertentu"],
  Buku: ["benda", "dibaca", "ada halaman", "bisa berisi cerita"],
  Majalah: ["benda", "dibaca", "ada gambar", "terbit berkala"],
  Mobil: ["kendaraan", "pakai roda", "bisa untuk perjalanan", "ada mesin"],
  Truk: ["kendaraan", "besar", "bisa angkkut barang", "ada bak belakang"],
  rumah: ["tempat tinggal", "ada atap", "ada pintu", "bisa punya halaman"],
  apartemen: ["tempat tinggal", "ada banyak lantai", "ada unit", "bisa sewa"],
  Kipas: ["benda", "untuk angin", "bisa listrik", "ada baling-baling"],
  AC: ["benda", "untuk dingin", "pakai listrik", "ada remote"],
  Meja: ["benda", "untuk meletakkan", "ada kaki", "bisa di ruang tamu"],
  Kursi: ["benda", "untuk duduk", "ada sandaran", "bisa di ruang makan"],
  Komputer: ["benda", "untuk bekerja", "ada layar", "bisa pakai keyboard"],
  Laptop: ["benda", "untuk bekerja", "bisa dibawa", "ada baterai"],
  Lampu: ["benda", "untuk penerangan", "ada bohlam", "bisa dinyalakan"],
  Senter: ["benda", "untuk penerangan", "bisa dibawa", "pakai baterai"],
};

const DEFAULT_CLUES = ["menarik", "sering ditemui", "cukup umum", "bisa dikenal banyak orang"];

// Mr. White tidak punya kata sama sekali, jadi clue-nya sengaja "ngambang" biar bisa berbaur.
const MRWHITE_BLUFF_CLUES = [
  "sesuatu yang cukup umum sih",
  "aku juga mikirnya mirip yang tadi",
  "hmm, itu juga sering aku temui",
  "aku setuju sama clue sebelumnya",
  "susah dijelasin, tapi ngerti maksudnya",
  "ya... semacam itu juga menurutku",
];

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
  ["Mobil", "Truk"],
  ["Rumah", "Apartemen"],
  ["Kipas", "AC"],
  ["Meja", "Kursi"],
  ["Komputer", "Laptop"],
  ["Lampu","Senter"],
];

// Selalu ada 1 Undercover. Mulai dari 4 pemain, tambahkan 1 Mr. White juga.
function getRoleCounts(n) {
  return { undercover: 1, mrwhite: n >= 4 ? 1 : 0 };
}

function roomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function Button({ children, onClick, primary, disabled, danger }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        minHeight: 42,
        padding: "10px 18px",
        borderRadius: 10,
        border: primary
          ? "1px solid rgba(201,162,39,0.8)"
          : "1px solid rgba(255,255,255,0.16)",
        background: disabled
          ? "#4A443D"
          : danger
          ? "#702D2D"
          : primary
          ? `linear-gradient(180deg, #D6AF2F 0%, ${GOLD} 100%)`
          : "rgba(255,255,255,0.07)",
        color: primary && !disabled ? "#18130F" : CREAM,
        fontWeight: 800,
        fontSize: 13,
        letterSpacing: 0.1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        boxShadow: primary && !disabled
          ? "0 5px 14px rgba(201,162,39,0.18)"
          : "none",
        transition: "all .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function Panel({ children }) {
  return (
    <div
  style={{
    width: "100%",
    maxWidth: "505px",
    background: "#26211d",
    border: "1px solid rgba(201, 162, 39, 0.45)",
    borderRadius: "18px",
    padding: "32px 28px",
    boxSizing: "border-box",
    textAlign: "center",
    color: CREAM,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.18)",
  }}
>
      {children}
    </div>
  );
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
  const [guess, setGuess] = useState("");
  const [error, setError] = useState("");
  const botTimers = useRef([]);

  const occupied = useMemo(() => players.map((p, i) => p ? i : null).filter((x) => x !== null), [players]);
  const humanSeats = useMemo(() => occupied.filter((seat) => !players[seat]?.isBot), [occupied, players]);
  const hostSeat = humanSeats.length ? Math.min(...humanSeats) : null;
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
    setGuess("");
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
    try {
      const result = await runTransaction(
        ref(db, `undercoverRooms/${roomId}/players/${seat}`),
        (current) => current || { name: name.trim() }
      );
      if (!result.committed) return setError("Kursi itu sudah diambil.");
      setMySeat(seat);
      setError("");
    } catch (err) {
      console.error("Gagal duduk:", err);
      setError(`Gagal masuk kursi: ${err.message}`);
    }
  }

  async function leaveSeat() {
    if (mySeat === null) return;
    await set(ref(db, `undercoverRooms/${roomId}/players/${mySeat}`), null);
    await set(ref(db, `undercoverRooms/${roomId}/private/${mySeat}`), null);
    setMySeat(null);
  }

  async function addBot() {
    if (!amHost) return;
    const emptySeat = players.findIndex((p) => !p);
    if (emptySeat === -1) return setError("Semua kursi sudah penuh.");
    const usedBotNames = new Set(players.filter((p) => p?.isBot).map((p) => p.name));
    const botName = BOT_NAMES.find((n) => !usedBotNames.has(`🤖 ${n}`)) || `Bot ${occupied.length}`;
    try {
      await runTransaction(ref(db, `undercoverRooms/${roomId}/players/${emptySeat}`), (current) =>
        current || { name: `🤖 ${botName}`, isBot: true }
      );
      setError("");
    } catch (err) {
      setError(`Gagal menambah bot: ${err.message}`);
    }
  }

  async function removeBot(seat) {
    if (!amHost || !players[seat]?.isBot || game) return;
    await set(ref(db, `undercoverRooms/${roomId}/players/${seat}`), null);
  }

  async function startGame() {
    if (occupied.length < 3) return setError("Minimal 3 pemain untuk memulai.");
    const shuffled = [...occupied].sort(() => Math.random() - 0.5);
    const { undercover: ucCount, mrwhite: mwCount } = getRoleCounts(occupied.length);
    const mrwhiteSeats = shuffled.slice(0, mwCount);
    const undercoverSeats = shuffled.slice(mwCount, mwCount + ucCount);

    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const civilianWord = pair[0];
    const undercoverWord = pair[1];
    const firstSpeaker = occupied[0];

    const privateWrites = occupied.map((seat) => {
      let role = "civilian";
      let word = civilianWord;
      if (mrwhiteSeats.includes(seat)) {
        role = "mrwhite";
        word = null;
      } else if (undercoverSeats.includes(seat)) {
        role = "undercover";
        word = undercoverWord;
      }
      return set(ref(db, `undercoverRooms/${roomId}/private/${seat}`), { role, word, round: 1 });
    });
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

  async function submitBotClue(botSeat) {
    if (!amHost) return;
    const secretSnap = await get(ref(db, `undercoverRooms/${roomId}/private/${botSeat}`));
    const botSecret = secretSnap.val();
    if (!botSecret) return;
    const options =
      botSecret.role === "mrwhite"
        ? MRWHITE_BLUFF_CLUES
        : BOT_CLUES[botSecret.word] || DEFAULT_CLUES;
    const botClue = options[Math.floor(Math.random() * options.length)];
    const currentSnap = await get(ref(db, `undercoverRooms/${roomId}/game`));
    const current = currentSnap.val();
    if (!current || current.phase !== "clue" || current.currentSpeaker !== botSeat) return;
    const active = current.activePlayers || [];
    const nextIndex = active.indexOf(botSeat) + 1;
    const nextSpeaker = nextIndex < active.length ? active[nextIndex] : null;
    const clues = { ...(current.clues || {}), [botSeat]: botClue };
    await runTransaction(ref(db, `undercoverRooms/${roomId}/game`), (latest) => {
      if (!latest || latest.phase !== "clue" || latest.currentSpeaker !== botSeat) return;
      if (nextSpeaker === null) {
        return { ...latest, phase: "voting", currentSpeaker: null, clues, votes: {}, message: "Semua clue sudah masuk. Sekarang voting." };
      }
      return { ...latest, clues, currentSpeaker: nextSpeaker, message: `Giliran ${players[nextSpeaker]?.name || "pemain"} memberi clue.` };
    });
  }

  async function resolveVoting(current, votes) {
    const active = current.activePlayers || [];
    const counts = {};
    active.forEach((s) => { counts[s] = 0; });
    let skipCount = 0;
    Object.values(votes).forEach((v) => {
      if (v === "skip") skipCount += 1;
      else counts[v] = (counts[v] || 0) + 1;
    });

    const maxPlayerVotes = active.length ? Math.max(...Object.values(counts)) : 0;
    const topPlayers = active.filter((s) => counts[s] === maxPlayerVotes && maxPlayerVotes > 0);

    // Skip menang sendiri atau seri dengan suara terbanyak -> tidak ada eliminasi.
    if (skipCount >= maxPlayerVotes) {
      const nextRound = (current.round || 1) + 1;
      return {
        ...current,
        votes,
        phase: "clue",
        round: nextRound,
        currentSpeaker: active[0],
        clues: {},
        
        eliminated: null,
        message: skipCount === maxPlayerVotes && maxPlayerVotes > 0
          ? `Skip Vote seri dengan suara terbanyak (${skipCount}-${maxPlayerVotes}). Tidak ada yang tereliminasi. Ronde ${nextRound} dimulai.`
          : `Skip Vote terbanyak (${skipCount}). Tidak ada yang tereliminasi. Ronde ${nextRound} dimulai.`,
      };
    }

    const eliminated = topPlayers[Math.floor(Math.random() * topPlayers.length)];
    const eliminatedSecretSnap = await get(ref(db, `undercoverRooms/${roomId}/private/${eliminated}`));
    const eliminatedRole = eliminatedSecretSnap.val()?.role || "civilian";

    // Mr. White yang ketauan dapat satu kesempatan terakhir menebak kata Civilian.
    if (eliminatedRole === "mrwhite") {
      return {
        ...current,
        votes,
        phase: "mrwhite_guess",
        eliminated,
        eliminatedRole: "mrwhite",
        message: `${players[eliminated]?.name || "Pemain"} adalah MR. WHITE! Dia dapat satu kesempatan menebak kata Civilian.`,
      };
    }

    return {
      ...current,
      votes,
      phase: "result",
      eliminated,
      eliminatedRole,
      message: `${players[eliminated]?.name || "Pemain"} mendapat vote terbanyak${eliminatedRole === "undercover" ? " — dan ternyata UNDERCOVER!" : ", dan ternyata Civilian."}`,
    };
  }

  async function castBotVote(botSeat) {
    if (!amHost) return;
    const snap = await get(ref(db, `undercoverRooms/${roomId}/game`));
    const current = snap.val();
    if (!current || current.phase !== "voting") return;
    const active = current.activePlayers || [];
    if (!active.includes(botSeat)) return;
    const existingVotes = current.votes || {};
    if (existingVotes[botSeat] !== undefined) return;

    const candidates = active.filter((seat) => seat !== botSeat);
    if (!candidates.length) return;
    // Bot kadang memilih Skip agar voting tidak selalu langsung menunjuk pemain.
    const target = Math.random() < 0.18 ? "skip" : candidates[Math.floor(Math.random() * candidates.length)];

    await runTransaction(ref(db, `undercoverRooms/${roomId}/game`), (latest) => {
      if (!latest || latest.phase !== "voting") return;
      const votes = { ...(latest.votes || {}) };
      if (votes[botSeat] !== undefined) return;
      votes[botSeat] = target;
      if (Object.keys(votes).length < active.length) {
        return { ...latest, votes, message: `${Object.keys(votes).length}/${active.length} pemain sudah voting.` };
      }
      return { ...latest, votes, message: "Semua pemain sudah voting. Menentukan hasil..." };
    });

    const after = await get(ref(db, `undercoverRooms/${roomId}/game`));
    const latest = after.val();
    if (latest?.phase === "voting" && Object.keys(latest.votes || {}).length >= (latest.activePlayers || []).length) {
      const resolved = await resolveVoting(latest, latest.votes || {});
      await set(ref(db, `undercoverRooms/${roomId}/game`), resolved);
    }
  }

  // Menentukan pemenang setelah seseorang benar-benar tersingkir (dipakai untuk hasil normal
  // maupun setelah tebakan Mr. White yang salah).
  async function applyEliminationOutcome(currentGame, eliminatedSeat) {
    const privSnap = await get(ref(db, `undercoverRooms/${roomId}/private`));
    const priv = privSnap.val() || {};
    const active = currentGame.activePlayers || [];
    const remaining = active.filter((seat) => seat !== eliminatedSeat);

    const aliveBad = remaining.filter((seat) => priv[seat]?.role === "undercover" || priv[seat]?.role === "mrwhite").length;
    const aliveCivilian = remaining.filter((seat) => priv[seat]?.role === "civilian").length;

    let winner = null;
    if (aliveBad === 0) winner = "civilian";
    else if (aliveCivilian <= aliveBad) winner = "undercover";

    if (winner) {
      const reveal = Object.fromEntries(
        Object.entries(priv).map(([seat, info]) => [seat, { role: info?.role || "civilian", word: info?.word || "" }])
      );
      await set(ref(db, `undercoverRooms/${roomId}/game`), {
        ...currentGame,
        phase: "finished",
        activePlayers: remaining,
        winner,
        reveal,
        message: winner === "civilian"
          ? "🎉 Civilian menang! Undercover dan Mr. White berhasil ditemukan."
          : "🕵️ Undercover & Mr. White menang! Jumlah pemain sudah seimbang.",
      });
      return;
    }

    const nextRound = (currentGame.round || 1) + 1;
    await set(ref(db, `undercoverRooms/${roomId}/game`), {
      ...currentGame,
      phase: "clue",
      round: nextRound,
      activePlayers: remaining,
      currentSpeaker: remaining[0],
      clues: {},
      votes: {},
      eliminated: null,
      eliminatedRole: null,
      message: `Ronde ${nextRound} dimulai. Pemain yang tersisa lanjut memberi clue.`,
    });
  }

  // Dipanggil host untuk melanjutkan setelah hasil normal (Undercover/Civilian) tampil.
  async function finishResult() {
    if (!game || game.phase !== "result" || !amHost) return;
    await applyEliminationOutcome(game, game.eliminated);
  }

  // seatOverride dipakai saat host menjalankan tebakan atas nama bot Mr. White.
  async function submitMrWhiteGuess(guessText, seatOverride) {
    const seat = seatOverride !== undefined ? seatOverride : mySeat;
    if (!game || game.phase !== "mrwhite_guess" || game.eliminated !== seat || !guessText || !guessText.trim()) return;

    const privSnap = await get(ref(db, `undercoverRooms/${roomId}/private`));
    const priv = privSnap.val() || {};
    const civilianEntry = Object.values(priv).find((p) => p?.role === "civilian");
    const civilianWord = civilianEntry?.word || "";
    const correct = guessText.trim().toLowerCase() === civilianWord.trim().toLowerCase();

    if (correct) {
      const reveal = Object.fromEntries(
        Object.entries(priv).map(([s, info]) => [s, { role: info?.role || "civilian", word: info?.word || "" }])
      );
      await set(ref(db, `undercoverRooms/${roomId}/game`), {
        ...game,
        phase: "finished",
        winner: "mrwhite",
        reveal,
        message: `🎭 Tebakan benar! ${players[seat]?.name || "Mr. White"} menebak kata "${civilianWord}" dengan tepat dan MENANG!`,
      });
    } else {
      const afterWrongGame = {
        ...game,
        message: `Tebakan salah ("${guessText.trim()}"). ${players[seat]?.name || "Mr. White"} tetap tereliminasi.`,
      };
      await applyEliminationOutcome(afterWrongGame, seat);
    }
    if (seatOverride === undefined) setGuess("");
  }

  async function submitBotMrWhiteGuess(seat) {
    if (!amHost) return;
    const randomGuess = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)][0];
    await submitMrWhiteGuess(randomGuess, seat);
  }

  // Bot hanya dijalankan oleh host agar satu aksi bot tidak dieksekusi berkali-kali oleh semua pemain.
  useEffect(() => {
    botTimers.current.forEach(clearTimeout);
    botTimers.current = [];
    if (!amHost || !game) return;

    if (game.phase === "clue" && players[game.currentSpeaker]?.isBot) {
      const timer = setTimeout(() => submitBotClue(game.currentSpeaker), 900);
      botTimers.current.push(timer);
    }

    if (game.phase === "voting") {
      const active = game.activePlayers || [];
      const pendingBots = active.filter((seat) => players[seat]?.isBot && game.votes?.[seat] === undefined);
      pendingBots.forEach((seat, index) => {
        const timer = setTimeout(() => castBotVote(seat), 700 + index * 650);
        botTimers.current.push(timer);
      });
    }

    if (game.phase === "mrwhite_guess" && players[game.eliminated]?.isBot) {
      const timer = setTimeout(() => submitBotMrWhiteGuess(game.eliminated), 1000);
      botTimers.current.push(timer);
    }

    return () => {
      botTimers.current.forEach(clearTimeout);
      botTimers.current = [];
    };
  }, [amHost, game?.phase, game?.currentSpeaker, game?.round, game?.eliminated, JSON.stringify(game?.votes || {}), players]);

  async function castVote(target) {
    if (!game || game.phase !== "voting" || !activePlayers.includes(mySeat)) return;
    const result = await runTransaction(ref(db, `undercoverRooms/${roomId}/game`), (current) => {
      if (!current || current.phase !== "voting") return;
      const votes = { ...(current.votes || {}), [mySeat]: target };
      if (Object.keys(votes).length < activePlayers.length) {
        return { ...current, votes, message: `${Object.keys(votes).length}/${activePlayers.length} pemain sudah voting.` };
      }
      return { ...current, votes, message: "Semua pemain sudah voting. Menentukan hasil..." };
    });
    if (result.committed) {
      setVote(target);
      const latest = (await get(ref(db, `undercoverRooms/${roomId}/game`))).val();
      if (amHost && latest?.phase === "voting" && Object.keys(latest.votes || {}).length >= (latest.activePlayers || []).length) {
        const resolved = await resolveVoting(latest, latest.votes || {});
        await set(ref(db, `undercoverRooms/${roomId}/game`), resolved);
      }
    }
  }

   if (!joined) {
  return (
    <EntryShell>
      <h1
        style={{
          fontFamily: "Georgia, serif",
          color: GOLD,
          marginTop: 0,
          marginBottom: 8,
          fontSize: 26,
          textAlign: "center",
        }}
      >
        🕵️ Undercover
      </h1>

      <p
        style={{
          fontSize: 13,
          opacity: 0.8,
          marginTop: 0,
          marginBottom: 16,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Buat room baru atau masukkan kode room temanmu.
      </p>

      <input
        value={roomInput}
        onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
        placeholder="KODE ROOM"
        style={{
          ...inputStyle,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      />

      <button
  type="button"
  onClick={() => enterRoom(roomInput)}
  style={{
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: "1px solid #C9A227",
    background: "#C9A227",
    color: "#1a1310",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxSizing: "border-box",
  }}
>
  {roomInput.trim() ? "Gabung Room" : "Buat Room Baru"}
</button>
    </EntryShell>
  );
}

  if (!game) {
    return (
      <Shell roomId={roomId}>
        <Panel>

          <div
            style={{
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
              }}
            >
              Room
            </div>

            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: GOLD,
                letterSpacing: 1,
                marginTop: 3,
              }}
            >
              {roomId}
            </div>

            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
                marginTop: 5,
              }}
            >
              Bagikan URL halaman ini ke teman.
            </div>
          </div>

          {mySeat === null && (
            <>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                style={inputStyle}
              />

              <div
                style={{
                  fontSize: 11,
                  opacity: 0.65,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Pilih kursi kosong untuk masuk.
                Setelah duduk, kamu menjadi host jika belum ada host.
              </div>
            </>
          )}

          <div style={gridStyle}>
            {players.map((p, seat) => (
              <div
                key={seat}
                style={{
                  ...seatStyle,
                  border:
                    seat === mySeat
                      ? `1px solid ${GOLD}`
                      : seatStyle.border,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.6,
                  }}
                >
                  Kursi {seat + 1}
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    margin: "5px 0 8px",
                  }}
                >
                  {p?.name || "Kosong"}
                </div>

                {!p && mySeat === null && (
                  <Button
                    primary
                    onClick={() => sitDown(seat)}
                  >
                    Duduk
                  </Button>
                )}

                {p?.isBot && amHost && (
                  <Button
                    onClick={() => removeBot(seat)}
                  >
                    Hapus Bot
                  </Button>
                )}

                {seat === mySeat && (
                  <div
                    style={{
                      fontSize: 11,
                      color: GOLD,
                    }}
                  >
                    ✓ Kamu
                  </div>
                )}
              </div>
            ))}
          </div>

          {mySeat !== null && (
            <div
              style={{
                marginTop: 12,
                padding: 11,
                borderRadius: 10,
                background: "rgba(201,162,39,.08)",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Kamu duduk di <b>Kursi {mySeat + 1}</b>.{" "}
              {amHost ? "Kamu host." : "Menunggu host."}
            </div>
          )}

          {amHost && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 12,
              }}
            >
              <Button
                primary
                onClick={addBot}
                disabled={occupied.length >= MAX_PLAYERS}
              >
                + Tambah Bot
              </Button>

              {mySeat !== null && (
                <Button onClick={leaveSeat}>
                  Keluar dari Kursi
                </Button>
              )}
            </div>
          )}

          {!amHost && mySeat !== null && (
            <div
              style={{
                marginTop: 12,
                textAlign: "center",
              }}
            >
              <Button onClick={leaveSeat}>
                Keluar dari Kursi
              </Button>
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              fontSize: 11,
              opacity: 0.65,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Minimal 3 pemain untuk mulai. Role diacak otomatis:
            selalu ada 1 Undercover, dan mulai dari 4 pemain akan ada
            1 Mr. White juga. Bot bisa mengisi kursi kosong, jadi kamu
            bisa main sendirian melawan bot.
          </div>

          {amHost && (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button
                primary
                onClick={startGame}
                disabled={occupied.length < 3}
              >
                Mulai Undercover ({occupied.length}/{MAX_PLAYERS})
              </Button>
            </div>
          )}

          {error && (
            <div style={errorStyle}>
              {error}
            </div>
          )}

        </Panel>
      </Shell>
    );
  }

  const isActive = activePlayers.includes(mySeat);
  const myTurnToClue =
    game?.phase === "clue" &&
    game.currentSpeaker === mySeat;

  const allClues = game?.clues || {};

  const showEliminatedTag = [
    "result",
    "mrwhite_guess",
  ].includes(game?.phase);

  return (
    <Shell roomId={roomId}>

      <Panel>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
              }}
            >
              ROOM
            </div>

            <div
              style={{
                fontWeight: 800,
                color: GOLD,
              }}
            >
              {roomId}
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
            }}
          >
            {occupied.length}/{MAX_PLAYERS} pemain
          </div>

         
        </div>
      </Panel>

      <Panel>

        <h2
          style={{
            marginTop: 0,
            color: GOLD,
            textAlign: "center",
            fontFamily: "Georgia, serif",
          }}
        >
          {game?.phase === "finished"
            ? "Hasil Akhir"
            : `Ronde ${game.round}`}
        </h2>

        {game && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(201,162,39,.08)",
              fontSize: 13,
              marginBottom: 14,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {game.message}
          </div>
        )}

        {game && (
          <div style={gridStyle}>
            {players.map(
              (p, seat) =>
                p && (
                  <div
                    key={seat}
                    style={{
                      ...seatStyle,
                      opacity:
                        isActive &&
                        !activePlayers.includes(seat)
                          ? 0.35
                          : 1,
                      border:
                        game.currentSpeaker === seat
                          ? `1px solid ${GOLD}`
                          : seat === mySeat
                          ? "1px solid rgba(201,162,39,.35)"
                          : seatStyle.border,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                      }}
                    >
                      {p.name}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.65,
                      }}
                    >
                      {seat === mySeat
                        ? "Kamu"
                        : p.isBot
                        ? "🤖 Bot"
                        : "Pemain"}

                      {game.currentSpeaker === seat
                        ? " • giliran clue"
                        : ""}
                    </div>

                    {(game.phase === "clue" ||
                      game.phase === "voting") &&
                      allClues[seat] && (
                        <div
                          style={{
                            marginTop: 9,
                            fontSize: 13,
                            padding: 8,
                            borderRadius: 8,
                            background: "rgba(0,0,0,.2)",
                          }}
                        >
                          “{allClues[seat]}”
                        </div>
                      )}

                    {game.phase === "voting" &&
                      isActive &&
                      seat !== mySeat && (
                        <div style={{ marginTop: 9 }}>
                          <Button
                            primary={vote === seat}
                            onClick={() => castVote(seat)}
                          >
                            {vote === seat
                              ? "✓ Dipilih"
                              : "Vote"}
                          </Button>
                        </div>
                      )}

                    {showEliminatedTag &&
                      game.eliminated === seat && (
                        <div
                          style={{
                            marginTop: 8,
                            color: GOLD,
                            fontWeight: 800,
                          }}
                        >
                          ☠️ Tereliminasi
                        </div>
                      )}
                  </div>
                )
            )}
          </div>
        )}

        {secret &&
          game &&
          game.phase !== "finished" &&
          isActive && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 12,
                background: "rgba(201,162,39,.12)",
                border: "1px solid rgba(201,162,39,.35)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.65,
                }}
              >
                RAHASIA KAMU
              </div>

              {secret.role === "mrwhite" ? (
                <>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: GOLD,
                      margin: "5px 0",
                    }}
                  >
                    🎭 MR. WHITE
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    Kamu TIDAK dapat kata apa pun! Dengarkan clue
                    orang lain baik-baik, berbaur, dan jangan sampai
                    ketahuan. Kalau kamu tereliminasi, kamu masih
                    dapat satu kesempatan menebak kata Civilian.
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: GOLD,
                      margin: "5px 0",
                    }}
                  >
                    {secret.word}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                    }}
                  >
                    Role:{" "}
                    <b>
                      {secret.role === "undercover"
                        ? "UNDERCOVER"
                        : "CIVILIAN"}
                    </b>
                  </div>
                </>
              )}
            </div>
          )}

        {myTurnToClue && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              Kasih clue yang membantu teman menebak kata,
              tapi jangan terlalu jelas.
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <input
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                maxLength={80}
                placeholder="Contoh: biasanya ada di rumah"
                style={{
                  ...inputStyle,
                  marginBottom: 0,
                  flex: 1,
                  minWidth: 0,
                }}
              />

              <Button
                primary
                onClick={submitClue}
                disabled={!clue.trim()}
              >
                Kirim
              </Button>
            </div>
          </div>
        )}

        {game?.phase === "voting" && isActive && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 12,
                opacity: 0.8,
                marginBottom: 9,
              }}
            >
              Pilih pemain yang menurutmu Undercover/Mr. White,
              atau gunakan Skip Vote kalau belum yakin.
            </div>

            <Button
              primary={vote === "skip"}
              onClick={() => castVote("skip")}
            >
              {vote === "skip"
                ? "✓ Skip Dipilih"
                : "⏭️ Skip Vote"}
            </Button>
          </div>
        )}

        {game?.phase === "mrwhite_guess" && (
          <div style={{ marginTop: 14 }}>
            {mySeat === game.eliminated ? (
              <>
                <div
                  style={{
                    fontSize: 13,
                    marginBottom: 8,
                  }}
                >
                  Kamu Mr. White dan baru saja tereliminasi!
                  Ini kesempatan terakhirmu — tebak kata Civilian:
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Tebak kata civilian..."
                    style={{
                      ...inputStyle,
                      marginBottom: 0,
                      flex: 1,
                      minWidth: 0,
                    }}
                  />

                  <Button
                    primary
                    onClick={() => submitMrWhiteGuess(guess)}
                    disabled={!guess.trim()}
                  >
                    Tebak
                  </Button>
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.8,
                  textAlign: "center",
                }}
              >
                Menunggu Mr. White menebak kata civilian...
              </div>
            )}
          </div>
        )}

        {game?.phase === "result" && amHost && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              primary
              onClick={finishResult}
            >
              Lanjutkan
            </Button>
          </div>
        )}

        {game?.phase === "finished" && (
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: GOLD,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {game.winner === "civilian"
              ? "🎉 CIVILIAN MENANG"
              : game.winner === "mrwhite"
              ? "🎭 MR. WHITE MENANG"
              : "🕵️ UNDERCOVER MENANG"}
          </div>
        )}

        {game?.phase === "finished" &&
          game.winner && (
            <div style={{ marginTop: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 7,
                }}
              >
                🔎 Pembukaan role
              </div>

              <div style={gridStyle}>
                {Object.entries(game.reveal || {}).map(
                  ([seat, info]) => (
                    <div
                      key={seat}
                      style={seatStyle}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                        }}
                      >
                        {players[Number(seat)]?.name ||
                          `Pemain ${Number(seat) + 1}`}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color:
                            info.role === "undercover" ||
                            info.role === "mrwhite"
                              ? GOLD
                              : "#bdb7aa",
                          marginTop: 4,
                        }}
                      >
                        {info.role === "undercover"
                          ? "🕵️ UNDERCOVER"
                          : info.role === "mrwhite"
                          ? "🎭 MR. WHITE"
                          : "👤 CIVILIAN"}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          marginTop: 3,
                        }}
                      >
                        Kata:{" "}
                        <b>
                          {info.role === "mrwhite"
                            ? "Tidak dapat kata"
                            : info.word}
                        </b>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {game?.phase === "result" && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            Host klik <b>Lanjutkan</b> untuk mengecek eliminasi
            dan meneruskan ronde atau mengakhiri game.
          </div>
        )}

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

      </Panel>

      {game?.phase === "finished" && amHost && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 12,
          }}
        >
          <Button
            primary
            onClick={startGame}
          >
            Main Lagi
          </Button>
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          opacity: 0.45,
          marginTop: 12,
          paddingBottom: 4,
        }}
      >
        MVP • role rahasia disimpan terpisah dari state game • bot
        dikendalikan host
      </div>

    </Shell>
  );
}

function EntryShell({ children }) {
  function goHome() {
    const url = new URL(window.location.href);
    url.search = "";
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#1a1310",
        color: CREAM,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "505px",
          background: "#26211d",
          border: "1px solid rgba(201, 162, 39, 0.45)",
          borderRadius: "18px",
          padding: "32px 28px",
          boxSizing: "border-box",
          textAlign: "center",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.18)",
        }}
      >
        {children}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            onClick={goHome}
            style={{
              background: "transparent",
              color: CREAM,
              border: `1px solid ${GOLD}`,
              borderRadius: "10px",
              padding: "11px 18px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            ← Kembali ke Game Hub
          </button>
        </div>
      </div>
    </div>
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
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: BG,
        minHeight: "100vh",
        padding: "18px 14px 24px",
        color: CREAM,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            🕵️ Undercover
          </div>

          {roomId && (
            <div
              style={{
                display: "inline-block",
                marginTop: 7,
                padding: "5px 10px",
                borderRadius: 999,
                background: "rgba(201,162,39,0.09)",
                border: "1px solid rgba(201,162,39,0.2)",
                color: CREAM,
                fontSize: 11,
                opacity: 0.85,
              }}
            >
              Room {roomId}
            </div>
          )}
        </div>

        {children}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 16,
            paddingTop: 4,
          }}
        >
          <Button onClick={goHome}>
            ← Kembali ke Game Hub
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  minHeight: 44,
  padding: "10px 13px",
  borderRadius: 18,
  border: `1px solid ${GOLD}`,
  boxShadow: "0 10px 30px rgba(0,0,0,.28)",
  background: "#F7F1E5",
  color: "#1A1612",
  fontSize: 14,
  outline: "none",
  marginBottom: 12,
  boxSizing: "border-box",
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
  gap: 10,
};

const seatStyle = {
  background: PANEL_SOFT,
  borderRadius: 13,
  padding: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  boxSizing: "border-box",
  minHeight: 92,
};

const errorStyle = {
  color: "#F08A8A",
  fontSize: 12,
  marginTop: 12,
  padding: "9px 11px",
  borderRadius: 9,
  background: "rgba(180,50,50,0.10)",
  border: "1px solid rgba(220,100,100,0.16)",
  textAlign: "center",
};