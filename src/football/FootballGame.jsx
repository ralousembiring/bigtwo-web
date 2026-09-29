import React, { useEffect, useMemo, useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { drawCard, tenGacha } from "./gacha";
import { getCardById } from "./cards";
import { db } from "../firebase";
import { onValue, ref, set } from "firebase/database";
import { LeaguePanel, PvPPanel, QuickMatchPanel } from "./FootballExtras";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#17110E";
const PANEL = "#24201C";
const PANEL_SOFT = "#2A2520";
const SINGLE_COST = 20;
const TEN_COST = 200;
const INITIAL_COINS = 0;
const FIRST_DAY_COINS = 400;
const DAILY_COINS = 200;
const MAX_SQUAD = 11;

const FORMATIONS = {
  "4-3-3": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 16, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 84, y: 70 },
    { id: "CM1", label: "CM", x: 30, y: 52 },
    { id: "CM2", label: "CM", x: 70, y: 52 },
    { id: "CDM", label: "CDM", x: 50, y: 62 },
    { id: "LW", label: "LW", x: 20, y: 28 },
    { id: "ST", label: "ST", x: 50, y: 20 },
    { id: "RW", label: "RW", x: 80, y: 28 },
  ],
  "4-4-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "LM", label: "LM", x: 15, y: 48 },
    { id: "CM1", label: "CM", x: 38, y: 53 },
    { id: "CM2", label: "CM", x: 62, y: 53 },
    { id: "RM", label: "RM", x: 85, y: 48 },
    { id: "ST1", label: "ST", x: 40, y: 22 },
    { id: "ST2", label: "ST", x: 60, y: 22 },
  ],
  "4-2-3-1": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CDM1", label: "CDM", x: 38, y: 57 },
    { id: "CDM2", label: "CDM", x: 62, y: 57 },
    { id: "LW", label: "LW", x: 20, y: 37 },
    { id: "CAM", label: "CAM", x: 50, y: 35 },
    { id: "RW", label: "RW", x: 80, y: 37 },
    { id: "ST", label: "ST", x: 50, y: 19 },
  ],
  "4-3-1-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CM1", label: "CM", x: 28, y: 53 },
    { id: "CDM", label: "CDM", x: 50, y: 59 },
    { id: "CM2", label: "CM", x: 72, y: 53 },
    { id: "CAM", label: "CAM", x: 50, y: 36 },
    { id: "ST1", label: "ST", x: 40, y: 19 },
    { id: "ST2", label: "ST", x: 60, y: 19 },
  ],
  "4-1-4-1": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CDM", label: "CDM", x: 50, y: 59 },
    { id: "LM", label: "LM", x: 15, y: 43 },
    { id: "CM1", label: "CM", x: 38, y: 46 },
    { id: "CM2", label: "CM", x: 62, y: 46 },
    { id: "RM", label: "RM", x: 85, y: 43 },
    { id: "ST", label: "ST", x: 50, y: 20 },
  ],
  "3-5-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "CB1", label: "CB", x: 27, y: 72 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 73, y: 72 },
    { id: "LM", label: "LM", x: 10, y: 50 },
    { id: "CM1", label: "CM", x: 30, y: 53 },
    { id: "CDM", label: "CDM", x: 50, y: 58 },
    { id: "CM2", label: "CM", x: 70, y: 53 },
    { id: "RM", label: "RM", x: 90, y: 50 },
    { id: "ST1", label: "ST", x: 40, y: 22 },
    { id: "ST2", label: "ST", x: 60, y: 22 },
  ],
  "3-4-3": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "CB1", label: "CB", x: 27, y: 73 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 73, y: 73 },
    { id: "LM", label: "LM", x: 15, y: 50 },
    { id: "CM1", label: "CM", x: 38, y: 53 },
    { id: "CM2", label: "CM", x: 62, y: 53 },
    { id: "RM", label: "RM", x: 85, y: 50 },
    { id: "LW", label: "LW", x: 20, y: 25 },
    { id: "ST", label: "ST", x: 50, y: 19 },
    { id: "RW", label: "RW", x: 80, y: 25 },
  ],
  "5-3-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LWB", label: "LWB", x: 8, y: 65 },
    { id: "CB1", label: "CB", x: 30, y: 73 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 70, y: 73 },
    { id: "RWB", label: "RWB", x: 92, y: 65 },
    { id: "CM1", label: "CM", x: 30, y: 50 },
    { id: "CDM", label: "CDM", x: 50, y: 56 },
    { id: "CM2", label: "CM", x: 70, y: 50 },
    { id: "ST1", label: "ST", x: 40, y: 21 },
    { id: "ST2", label: "ST", x: 60, y: 21 },
  ],
  "5-2-3": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LWB", label: "LWB", x: 8, y: 65 },
    { id: "CB1", label: "CB", x: 30, y: 73 },
    { id: "CB2", label: "CB", x: 50, y: 75 },
    { id: "CB3", label: "CB", x: 70, y: 73 },
    { id: "RWB", label: "RWB", x: 92, y: 65 },
    { id: "CM1", label: "CM", x: 38, y: 53 },
    { id: "CM2", label: "CM", x: 62, y: 53 },
    { id: "LW", label: "LW", x: 20, y: 25 },
    { id: "ST", label: "ST", x: 50, y: 19 },
    { id: "RW", label: "RW", x: 80, y: 25 },
  ],
  "4-2-2-2": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CDM1", label: "CDM", x: 38, y: 56 },
    { id: "CDM2", label: "CDM", x: 62, y: 56 },
    { id: "CAM1", label: "CAM", x: 30, y: 36 },
    { id: "CAM2", label: "CAM", x: 70, y: 36 },
    { id: "ST1", label: "ST", x: 40, y: 19 },
    { id: "ST2", label: "ST", x: 60, y: 19 },
  ],
  "4-3-2-1": [
    { id: "GK", label: "GK", x: 50, y: 88 },
    { id: "LB", label: "LB", x: 15, y: 70 },
    { id: "CB1", label: "CB", x: 38, y: 73 },
    { id: "CB2", label: "CB", x: 62, y: 73 },
    { id: "RB", label: "RB", x: 85, y: 70 },
    { id: "CM1", label: "CM", x: 28, y: 53 },
    { id: "CDM", label: "CDM", x: 50, y: 59 },
    { id: "CM2", label: "CM", x: 72, y: 53 },
    { id: "CAM1", label: "CAM", x: 37, y: 33 },
    { id: "CAM2", label: "CAM", x: 63, y: 33 },
    { id: "ST", label: "ST", x: 50, y: 19 },
  ],
};

function getPlayerKey() {
  const saved = localStorage.getItem("ralouFootballPlayerId");
  if (saved) return saved;

  const newId =
    "football_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 9);

  localStorage.setItem("ralouFootballPlayerId", newId);
  return newId;
}

function getLocalKey(playerKey) {
  return `ralouFootballSave_${playerKey}`;
}

function readLocalSave(playerKey) {
  try {
    const raw = localStorage.getItem(getLocalKey(playerKey));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeSquad(rawSquad) {
  if (!rawSquad) return {};

  if (typeof rawSquad === "object" && !Array.isArray(rawSquad)) {
    return rawSquad;
  }

  if (Array.isArray(rawSquad)) {
    const slots = FORMATIONS["4-3-3"];
    const result = {};
    rawSquad.forEach((cardId, index) => {
      if (slots[index]) result[slots[index].id] = cardId;
    });
    return result;
  }

  return {};
}

function normalizeHistory(raw) {
  return Array.isArray(raw) ? raw.slice(0, 20) : [];
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function getPositionGroup(position) {
  const groups = {
    GK: ["GK"],
    LB: ["LB", "LWB"],
    LWB: ["LB", "LWB", "LM"],
    RB: ["RB", "RWB"],
    RWB: ["RB", "RWB", "RM"],
    CB: ["CB"],
    CDM: ["CDM", "CM", "CAM"],
    CM: ["CM", "CDM", "CAM", "LM", "RM"],
    CAM: ["CAM", "CM", "CDM", "CF", "ST"],
    LM: ["LM", "LWB", "CM", "LW"],
    RM: ["RM", "RWB", "CM", "RW"],
    LW: ["LW", "LM", "RW", "CAM", "CF", "ST"],
    RW: ["RW", "RM", "LW", "CAM", "CF", "ST"],
    CF: ["CF", "CAM", "ST", "LW", "RW"],
    ST: ["ST", "CF", "CAM", "LW", "RW"],
  };

  return groups[position] || [position];
}

function isCompatiblePosition(card, slotPosition) {
  if (!card) return false;

  if (slotPosition === "GK") {
    return card.position === "GK";
  }

  if (card.position === "GK") return false;

  const cardPositions = getPositionGroup(card.position);
  const slotPositions = getPositionGroup(slotPosition);

  return (
    cardPositions.some((position) => slotPositions.includes(position)) ||
    card.position === slotPosition
  );
}

function getSquadPlayers(squad) {
  return Object.entries(squad)
    .map(([slotId, cardId]) => {
      const card = getCardById(cardId);
      return card ? { slotId, card } : null;
    })
    .filter(Boolean);
}

function getTeamOverall(squad) {
  const players = getSquadPlayers(squad);
  if (players.length === 0) return 0;

  const total = players.reduce((sum, item) => sum + item.card.overall, 0);
  return Math.round(total / players.length);
}

function getSquadStrength(squad) {
  const players = getSquadPlayers(squad);
  if (players.length === 0) return 0;

  const total = players.reduce((sum, item) => {
    const c = item.card;
    const main =
      c.position === "GK"
        ? (c.awareness + c.catching + c.reflexes + c.diving + c.jumping + c.physical) / 6
        : (c.pace + c.shooting + c.passing + c.dribbling + c.defending + c.physical) / 6;

    return sum + main;
  }, 0);

  return Math.round(total / players.length);
}

export default function FootballGame({ backToGameHub }) {
  const [playerKey] = useState(getPlayerKey);
  const localInitial = useMemo(() => readLocalSave(playerKey), [playerKey]);

  const [coins, setCoins] = useState(
    typeof localInitial?.coins === "number" ? localInitial.coins : INITIAL_COINS
  );
  const [results, setResults] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [collection, setCollection] = useState(
    Array.isArray(localInitial?.collection) ? localInitial.collection : []
  );
  const [squad, setSquad] = useState(normalizeSquad(localInitial?.squad));
  const [selectedTab, setSelectedTab] = useState("gacha");
  const [loading, setLoading] = useState(true);
  const [formation, setFormation] = useState(
    localInitial?.formation && FORMATIONS[localInitial.formation]
      ? localInitial.formation
      : "4-3-3"
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dailyClaimDate, setDailyClaimDate] = useState(
    localInitial?.dailyClaimDate || null
  );
  const [history, setHistory] = useState(
    normalizeHistory(localInitial?.history)
  );

  const squadCardIds = Object.values(squad);

  const activeSquadCardIds = useMemo(() => {
    const activeSlotIds = new Set(
      (FORMATIONS[formation] || []).map((slot) => slot.id)
    );

    return Object.entries(squad)
      .filter(([slotId]) => activeSlotIds.has(slotId))
      .map(([, cardId]) => cardId);
  }, [squad, formation]);

  const collectionCounts = useMemo(() => {
    const counts = {};
    for (const id of collection) {
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [collection]);

  function getSquadUsageCount(cardId) {
    return squadCardIds.filter((id) => id === cardId).length;
  }

  const activeSquad = useMemo(() => {
    const activeSlotIds = new Set(
      (FORMATIONS[formation] || []).map((slot) => slot.id)
    );

    return Object.fromEntries(
      Object.entries(squad).filter(([slotId]) => activeSlotIds.has(slotId))
    );
  }, [squad, formation]);

  const teamOverall = useMemo(() => getTeamOverall(activeSquad), [activeSquad]);
  const teamStrength = useMemo(() => getSquadStrength(activeSquad), [activeSquad]);

  const selectedSlotData = useMemo(() => {
    if (!selectedSlot) return null;
    return FORMATIONS[formation]?.find((slot) => slot.id === selectedSlot) || null;
  }, [selectedSlot, formation]);

  const selectableCards = useMemo(() => {
    if (!selectedSlotData) return [];

    const slotPosition = selectedSlotData.label;
    const cards = [];

    for (const cardId of Object.keys(collectionCounts)) {
      const card = getCardById(cardId);
      if (!card) continue;

      if (!isCompatiblePosition(card, slotPosition)) continue;

      const owned = collectionCounts[cardId] || 0;
      const used = getSquadUsageCount(cardId);

      if (used >= owned) continue;
      cards.push(card);
    }

    return cards.sort((a, b) => b.overall - a.overall);
  }, [selectedSlotData, collectionCounts, squadCardIds]);

  useEffect(() => {
    const local = readLocalSave(playerKey);
    if (local) {
      setCoins(typeof local.coins === "number" ? local.coins : INITIAL_COINS);
      setCollection(Array.isArray(local.collection) ? local.collection : []);
      setSquad(normalizeSquad(local.squad));
      setFormation(
        local.formation && FORMATIONS[local.formation]
          ? local.formation
          : "4-3-3"
      );
      setDailyClaimDate(local.dailyClaimDate || null);
      setHistory(normalizeHistory(local.history));
    }

    const playerRef = ref(db, `footballPlayers/${playerKey}`);

    const unsubscribe = onValue(
      playerRef,
      (snapshot) => {
        const data = snapshot.val();

        if (data) {
          setCoins(typeof data.coins === "number" ? data.coins : INITIAL_COINS);
          setCollection(Array.isArray(data.collection) ? data.collection : []);
          setSquad(normalizeSquad(data.squad));
          setFormation(
            data.formation && FORMATIONS[data.formation]
              ? data.formation
              : "4-3-3"
          );
          setDailyClaimDate(data.dailyClaimDate || null);
          setHistory(normalizeHistory(data.history));
        }

        setLoading(false);
      },
      (error) => {
        console.error("Football Firebase error:", error);
        setMessage(
          "Mode offline aktif. Data tetap disimpan di browser. Firebase Rules bisa dibetulkan nanti."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [playerKey]);

  function saveData(
    nextCoins,
    nextCollection,
    nextSquad,
    nextFormation = formation,
    nextDailyClaimDate = dailyClaimDate,
    nextHistory = history
  ) {
    const payload = {
      coins: nextCoins,
      collection: nextCollection,
      squad: nextSquad,
      formation: nextFormation,
      dailyClaimDate: nextDailyClaimDate,
      history: nextHistory.slice(0, 20),
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(getLocalKey(playerKey), JSON.stringify(payload));
    } catch (error) {
      console.error("Football local save error:", error);
    }

    set(ref(db, `footballPlayers/${playerKey}`), payload).catch((error) => {
      console.error("Football Firebase save error:", error);
    });
  }

  function claimDailyCoins() {
    const today = getTodayKey();

    if (dailyClaimDate === today) {
      setMessage("Bonus harian sudah diambil hari ini.");
      return;
    }

    const isFirstDay = !dailyClaimDate;
    const reward = isFirstDay ? FIRST_DAY_COINS : DAILY_COINS;
    const nextCoins = coins + reward;

    setCoins(nextCoins);
    setDailyClaimDate(today);
    saveData(nextCoins, collection, squad, formation, today, history);

    setMessage(
      isFirstDay
        ? "+400 🪙 First Day Bonus berhasil diambil!"
        : "+200 🪙 bonus harian berhasil diambil!"
    );
  }

  function doSingleGacha() {
    if (coins < SINGLE_COST) {
      setMessage("Coin lu nggak cukup.");
      return;
    }

    const card = drawCard();

    if (!card) {
      setMessage("Belum ada kartu untuk rarity tersebut.");
      return;
    }

    const nextCoins = coins - SINGLE_COST;
    const nextCollection = [...collection, card.id];

    setCoins(nextCoins);
    setCollection(nextCollection);
    setResults([card]);
    setRevealed(false);

    saveData(nextCoins, nextCollection, squad);

    setMessage(`${card.name} berhasil masuk Collection!`);
  }

  function doTenGacha() {
    if (coins < TEN_COST) {
      setMessage("Coin lu nggak cukup.");
      return;
    }

    const cards = tenGacha();
    const cardIds = cards.map((card) => card.id);
    const nextCoins = coins - TEN_COST;
    const nextCollection = [...collection, ...cardIds];

    setCoins(nextCoins);
    setCollection(nextCollection);
    setResults(cards);
    setRevealed(false);

    saveData(nextCoins, nextCollection, squad);

    setMessage(`${cards.length} kartu berhasil masuk Collection!`);
  }

  function revealCards() {
    setRevealed(true);
  }

  function putPlayerIntoSlot(cardId) {
    if (!selectedSlot) return;

    const card = getCardById(cardId);
    if (!card) return;

    const slot = FORMATIONS[formation]?.find((item) => item.id === selectedSlot);
    if (!slot) return;

    if (!isCompatiblePosition(card, slot.label)) {
      setMessage(`${card.name} tidak cocok untuk posisi ${slot.label}.`);
      return;
    }

    const oldCardId = squad[selectedSlot];

    if (oldCardId === cardId) {
      setMessage(`${card.name} sudah berada di posisi ini.`);
      setSelectedSlot(null);
      return;
    }

    const usedElsewhere = Object.entries(squad).filter(
      ([slotId, id]) => id === cardId && slotId !== selectedSlot
    ).length;

    const owned = collectionCounts[cardId] || 0;

    if (usedElsewhere >= owned) {
      setMessage("Jumlah kartu yang lu punya tidak cukup untuk memakai copy ini lagi.");
      return;
    }

    const nextSquad = {
      ...squad,
      [selectedSlot]: cardId,
    };

    setSquad(nextSquad);
    saveData(coins, collection, nextSquad);

    setSelectedSlot(null);

    if (oldCardId) {
      const oldCard = getCardById(oldCardId);
      setMessage(
        `${card.name} menggantikan ${oldCard?.name || "pemain lama"} di ${slot.label}.`
      );
    } else {
      setMessage(`${card.name} masuk ke posisi ${slot.label}!`);
    }
  }

  function removeFromSlot(slotId) {
    if (!slotId || !squad[slotId]) return;

    const removed = getCardById(squad[slotId]);
    const nextSquad = { ...squad };
    delete nextSquad[slotId];

    setSquad(nextSquad);
    saveData(coins, collection, nextSquad);
    setSelectedSlot(null);

    setMessage(
      `${removed?.name || "Pemain"} dikeluarkan dari squad.`
    );
  }

  function changeFormation(nextFormation) {
    if (!FORMATIONS[nextFormation]) return;

    const nextSlots = FORMATIONS[nextFormation];
    const currentPlayers = Object.values(squad)
      .map((cardId) => getCardById(cardId))
      .filter(Boolean);

    // Jangan buang 11 pemain ketika formasi berubah.
    // Kita susun ulang pemain ke slot formasi baru: utamakan posisi yang cocok,
    // lalu gunakan slot tersisa sebagai fallback supaya jumlah pemain tetap 11.
    const nextSquad = {};
    const usedCardIndexes = new Set();

    // 1. GK selalu dicari ke slot GK.
    const gkSlot = nextSlots.find((slot) => slot.label === "GK");
    const gkIndex = currentPlayers.findIndex((card) => card.position === "GK");
    if (gkSlot && gkIndex >= 0) {
      nextSquad[gkSlot.id] = currentPlayers[gkIndex].id;
      usedCardIndexes.add(gkIndex);
    }

    // 2. Isi slot lain dengan pemain yang posisi aslinya paling cocok.
    for (const slot of nextSlots) {
      if (nextSquad[slot.id]) continue;

      let bestIndex = -1;

      for (let i = 0; i < currentPlayers.length; i++) {
        if (usedCardIndexes.has(i)) continue;
        const card = currentPlayers[i];

        if (isCompatiblePosition(card, slot.label)) {
          bestIndex = i;
          break;
        }
      }

      if (bestIndex >= 0) {
        nextSquad[slot.id] = currentPlayers[bestIndex].id;
        usedCardIndexes.add(bestIndex);
      }
    }

    // 3. Kalau formasi membutuhkan bentuk yang berbeda (mis. 5-3-2),
    // pemain yang tersisa tetap dipasang ke slot kosong daripada menghilang.
    // Ini memang bisa membuat beberapa pemain berada di luar posisi aslinya,
    // tetapi user tetap memiliki 11 pemain dan bisa melakukan pergantian saat halftime.
    for (let i = 0; i < currentPlayers.length; i++) {
      if (usedCardIndexes.has(i)) continue;

      const emptySlot = nextSlots.find((slot) => !nextSquad[slot.id]);
      if (!emptySlot) break;

      nextSquad[emptySlot.id] = currentPlayers[i].id;
      usedCardIndexes.add(i);
    }

    setFormation(nextFormation);
    setSquad(nextSquad);
    setSelectedSlot(null);
    saveData(coins, collection, nextSquad, nextFormation);

    const assigned = Object.keys(nextSquad).length;
    setMessage(
      assigned === MAX_SQUAD
        ? `Formasi diganti ke ${nextFormation}. 11 pemain tetap dipertahankan.`
        : `Formasi diganti ke ${nextFormation}. ${assigned}/${MAX_SQUAD} pemain terpasang.`
    );
  }

  function clearSquad() {
    setSquad({});
    setSelectedSlot(null);
    saveData(coins, collection, {}, formation);
    setMessage("Semua pemain dikeluarkan dari squad.");
  }

  function addFromCollection(cardId) {
    const card = getCardById(cardId);
    if (!card) return;

    const availableSlot = FORMATIONS[formation].find(
      (slot) =>
        !squad[slot.id] &&
        isCompatiblePosition(card, slot.label)
    );

    if (!availableSlot) {
      setSelectedTab("squad");
      setMessage(
        `Tidak ada slot kosong yang cocok untuk ${card.name} di formasi ${formation}.`
      );
      return;
    }

    setSelectedTab("squad");
    setSelectedSlot(availableSlot.id);
    setMessage(
      `Pilih ${card.name} untuk dipasang di ${availableSlot.label}.`
    );
  }

  function addCoins(n) {
    const next = coins + n;
    setCoins(next);
    saveData(next, collection, squad, formation, dailyClaimDate, history);
  }

  function recordMatch(r) {
    const nextCoins = coins + r.reward;
    const rec = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toLocaleString("id-ID"),
      ...r,
    };
    const nextHistory = [rec, ...history].slice(0, 20);
    setCoins(nextCoins);
    setHistory(nextHistory);
    saveData(nextCoins, collection, squad, formation, dailyClaimDate, nextHistory);
    setMessage(
      r.result === "WIN" ? `MENANG! +${r.reward} 🪙`
        : r.result === "DRAW" ? `SERI! +${r.reward} 🪙`
        : `KALAH. Tetap dapat +${r.reward} 🪙`
    );
  }

  function substituteSlot(slotId, cardId) {
    const slot = FORMATIONS[formation]?.find((i) => i.id === slotId);
    const card = getCardById(cardId);
    if (!slot || !card) return;
    if (!isCompatiblePosition(card, slot.label)) {
      setMessage(`${card.name} tidak cocok untuk posisi ${slot.label}.`);
      return;
    }
    const used = Object.entries(squad).filter(([sid, id]) => sid !== slotId && id === cardId).length;
    if (used >= (collectionCounts[cardId] || 0)) {
      setMessage("Jumlah kartu yang lu punya tidak cukup untuk memakai copy ini lagi.");
      return;
    }
    const nextSquad = { ...squad, [slotId]: cardId };
    setSquad(nextSquad);
    saveData(coins, collection, nextSquad, formation, dailyClaimDate, history);
    setMessage(`${card.name} masuk menggantikan pemain di ${slot.label}.`);
  }

  function playMatch() {
    if (activeSquadCardIds.length !== MAX_SQUAD) {
      setSelectedTab("squad");
      setMessage(`Isi 11 pemain di formasi ${formation} dulu sebelum pertandingan.`);
      return;
    }
    if (!activeSquad.GK) {
      setSelectedTab("squad");
      setMessage("Squad wajib punya goalkeeper.");
      return;
    }
    setSelectedTab("match");
  }

    const matchPlayerNames = useMemo(() => {
    return (FORMATIONS[formation] || []).map((slot) => {
      const cardId = activeSquad[slot.id];
      const card = cardId ? getCardById(cardId) : null;

      return {
        id: slot.id,
        position: slot.label,
        name: card?.name || "Belum diisi",
        overall: card?.overall || "-",
      };
    });
  }, [activeSquad, formation]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          color: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 800,
        }}
      >
        Memuat Football...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: CREAM,
        padding: 24,
        boxSizing: "border-box",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: GOLD,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: 3,
              }}
            >
              RALOU GAME HUB
            </div>
            <h1 style={{ margin: "5px 0 0", fontSize: 32 }}>
              Football
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: PANEL,
                border: `1px solid ${GOLD}`,
                borderRadius: 12,
                padding: "10px 16px",
                fontWeight: 900,
              }}
            >
              🪙 {coins}
            </div>

            <button
              onClick={claimDailyCoins}
              style={buttonStyle()}
              disabled={dailyClaimDate === getTodayKey()}
            >
              {dailyClaimDate === getTodayKey()
                ? "✓ Claimed Today"
                : dailyClaimDate
                ? "🎁 +200 Daily"
                : "🎁 +400 First Day"}
            </button>

            <button onClick={backToGameHub} style={buttonStyle()}>
              ← Game Hub
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <TabButton
            active={selectedTab === "gacha"}
            onClick={() => setSelectedTab("gacha")}
          >
            🎴 Gacha
          </TabButton>

          <TabButton
            active={selectedTab === "collection"}
            onClick={() => setSelectedTab("collection")}
          >
            📚 Collection ({collection.length})
          </TabButton>

          <TabButton
            active={selectedTab === "squad"}
            onClick={() => setSelectedTab("squad")}
          >
            ⚽ My Squad ({activeSquadCardIds.length}/11)
          </TabButton>

          <TabButton
            active={selectedTab === "match"}
            onClick={() => setSelectedTab("match")}
          >
            🏟️ Match
          </TabButton>

          <TabButton
            active={selectedTab === "history"}
            onClick={() => setSelectedTab("history")}
          >
            📜 History ({history.length})
          </TabButton>

          <TabButton
            active={selectedTab === "league"}
            onClick={() => setSelectedTab("league")}
          >
            🏆 Liga
          </TabButton>

          <TabButton
            active={selectedTab === "pvp"}
            onClick={() => setSelectedTab("pvp")}
          >
            ⚔️ PvP
          </TabButton>
        </div>

        {message && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 15px",
              background: PANEL,
              border: "1px solid rgba(201,162,39,0.35)",
              borderRadius: 12,
              color: CREAM,
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}

        {selectedTab === "gacha" && (
          <GachaPanel
            results={results}
            revealed={revealed}
            revealCards={revealCards}
            doSingleGacha={doSingleGacha}
            doTenGacha={doTenGacha}
          />
        )}

        {selectedTab === "collection" && (
          <CollectionPanel
            collection={collection}
            collectionCounts={collectionCounts}
            onAddToSquad={addFromCollection}
          />
        )}

        {selectedTab === "squad" && (
          <SquadBuilder
            formation={formation}
            setFormation={changeFormation}
            squad={squad}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            removeFromSlot={removeFromSlot}
            clearSquad={clearSquad}
            selectableCards={selectableCards}
            putPlayerIntoSlot={putPlayerIntoSlot}
            teamOverall={teamOverall}
            teamStrength={teamStrength}
            playMatch={playMatch}
          />
        )}

        {selectedTab === "match" && (
          <QuickMatchPanel
            teamOverall={teamOverall}
            slots={FORMATIONS[formation]}
            ready={activeSquadCardIds.length === 11 && !!activeSquad.GK}
            onRecord={recordMatch}
            formations={Object.keys(FORMATIONS)}
            formation={formation}
            onFormation={changeFormation}
            squad={activeSquad}
            collection={collection}
            counts={collectionCounts}
            getCard={getCardById}
            canPlay={isCompatiblePosition}
            onSub={substituteSlot}
          />
        )}

        {selectedTab === "league" && (
          <LeaguePanel
            teamOverall={teamOverall}
            slots={FORMATIONS[formation]}
            ready={activeSquadCardIds.length === 11 && !!activeSquad.GK}
            onReward={addCoins}
          />
        )}

        {selectedTab === "pvp" && (
          <PvPPanel myOvr={teamOverall} slots={FORMATIONS[formation]} />
        )}

        {selectedTab === "history" && (
          <HistoryPanel history={history} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "11px 17px",
        borderRadius: 11,
        border: active
          ? `1px solid ${GOLD}`
          : "1px solid rgba(245,239,224,0.12)",
        background: active
          ? "rgba(201,162,39,0.15)"
          : PANEL,
        color: active ? GOLD : CREAM,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function GachaPanel({
  results,
  revealed,
  revealCards,
  doSingleGacha,
  doTenGacha,
}) {
  return (
    <div
      style={{
        background: PANEL,
        borderRadius: 20,
        border: "1px solid rgba(201,162,39,0.3)",
        padding: 24,
      }}
    >
      <h2 style={{ marginTop: 0, color: GOLD }}>Player Gacha</h2>

      <p style={{ opacity: 0.75 }}>
        Kumpulkan pemain, susun squad, lalu bawa mereka ke pertandingan otomatis.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 12,
          marginBottom: 25,
        }}
      >
        <button onClick={doSingleGacha} style={buttonStyle()}>
          🎴 1x Gacha — 20 🪙
        </button>

        <button
          onClick={doTenGacha}
          style={{
            ...buttonStyle(),
            background: "rgba(201,162,39,0.16)",
          }}
        >
          🎴 10x Gacha — 200 🪙
        </button>
      </div>

      <div
        style={{
          background: PANEL_SOFT,
          borderRadius: 14,
          padding: 14,
          marginBottom: 20,
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: GOLD }}>Gacha odds:</strong>{" "}
        Standard 60% · Rare 25% · Epic 12% · Legendary 3%
      </div>

      {results.length > 0 && (
        <>
          <button
            onClick={revealCards}
            style={{ ...buttonStyle(), marginBottom: 20 }}
          >
            {revealed ? "Cards Revealed" : "Reveal Cards"}
          </button>

          <div
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {results.map((card, index) => (
              <PlayerCard
                key={`${card.id}-${index}`}
                card={card}
                revealed={revealed}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CollectionPanel({
  collection,
  collectionCounts,
  onAddToSquad,
}) {
  const uniqueCards = Object.keys(collectionCounts);

  if (uniqueCards.length === 0) {
    return (
      <div style={emptyStyle()}>
        Belum ada pemain.
        <br />
        Buka Gacha dulu.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 18, opacity: 0.75 }}>
        Total kartu: <strong>{collection.length}</strong>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 18,
        }}
      >
        {uniqueCards.map((cardId) => {
          const card = getCardById(cardId);
          if (!card) return null;

          return (
            <CollectionCard
              key={cardId}
              card={card}
              count={collectionCounts[cardId]}
              onAdd={() => onAddToSquad(cardId)}
            />
          );
        })}
      </div>
    </div>
  );
}

function CollectionCard({ card, count, onAdd }) {
  return (
    <div
      style={{
        background: PANEL,
        borderRadius: 18,
        padding: 12,
        border: "1px solid rgba(245,239,224,0.1)",
      }}
    >
      <PlayerCard card={card} />

      <button
        onClick={onAdd}
        style={{
          width: "100%",
          marginTop: 12,
          padding: 11,
          borderRadius: 10,
          border: `1px solid ${GOLD}`,
          background: "rgba(201,162,39,0.12)",
          color: CREAM,
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        + Masukkan ke Squad
      </button>

      <div
        style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        Owned ×{count}
      </div>
    </div>
  );
}

function SquadBuilder({
  formation,
  setFormation,
  squad,
  selectedSlot,
  setSelectedSlot,
  removeFromSlot,
  clearSquad,
  selectableCards,
  putPlayerIntoSlot,
  teamOverall,
  teamStrength,
  playMatch,
}) {
  const slots = FORMATIONS[formation] || FORMATIONS["4-3-3"];

  return (
    <div>
      <div
        style={{
          background: PANEL,
          borderRadius: 18,
          padding: 18,
          marginBottom: 18,
          border: "1px solid rgba(201,162,39,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 15,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: GOLD,
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 2,
            }}
          >
            MY SQUAD
          </div>

          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 4 }}>
            {slots.filter((slot) => squad[slot.id]).length}/11
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <StatBox label="OVR" value={teamOverall || "-"} />
          <StatBox label="POWER" value={teamStrength || "-"} />

          <span style={{ fontWeight: 800, opacity: 0.75 }}>
            Formation
          </span>

          <select
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            style={{
              background: PANEL_SOFT,
              color: CREAM,
              border: `1px solid ${GOLD}`,
              borderRadius: 10,
              padding: "10px 14px",
              fontWeight: 900,
            }}
          >
            {Object.keys(FORMATIONS).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            onClick={playMatch}
            style={{
              ...buttonStyle(),
              background: "rgba(201,162,39,0.2)",
            }}
          >
            🏟️ Play Match
          </button>

          <button
            onClick={clearSquad}
            style={{
              ...buttonStyle(),
              borderColor: "rgba(255,100,100,0.4)",
            }}
          >
            Clear Squad
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            position: "relative",
            width: "min(900px, 100%)",
            aspectRatio: "16 / 10",
            borderRadius: 25,
            overflow: "hidden",
            border: "3px solid rgba(245,239,224,0.25)",
            background:
              "linear-gradient(90deg, #17351f, #20552e, #17351f)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 55px, transparent 55px, transparent 110px)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              borderTop: "2px solid rgba(255,255,255,0.45)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 105,
              height: 105,
              border: "2px solid rgba(255,255,255,0.45)",
              borderRadius: "50%",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: 7,
              height: 7,
              background: "rgba(255,255,255,0.7)",
              borderRadius: "50%",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "35%",
              height: "18%",
              left: "32.5%",
              top: 0,
              border: "2px solid rgba(255,255,255,0.4)",
              borderTop: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "35%",
              height: "18%",
              left: "32.5%",
              bottom: 0,
              border: "2px solid rgba(255,255,255,0.4)",
              borderBottom: "none",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "18%",
              height: 5,
              left: "41%",
              top: 0,
              background: "rgba(255,255,255,0.65)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "18%",
              height: 5,
              left: "41%",
              bottom: 0,
              background: "rgba(255,255,255,0.65)",
            }}
          />

          {slots.map((slot) => {
            const cardId = squad[slot.id];
            const card = cardId ? getCardById(cardId) : null;
            const active = selectedSlot === slot.id;

            return (
              <div
                key={slot.id}
                style={{
                  position: "absolute",
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: active ? 10 : 5,
                }}
              >
                <PitchPlayer
                  card={card}
                  label={slot.label}
                  active={active}
                  onClick={() => setSelectedSlot(slot.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {selectedSlot && (
        <div
          style={{
            marginTop: 18,
            background: PANEL,
            borderRadius: 18,
            padding: 20,
            border: "1px solid rgba(201,162,39,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color: GOLD,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                }}
              >
                SELECT PLAYER
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: 4,
                }}
              >
                Posisi:{" "}
                {FORMATIONS[formation]?.find(
                  (slot) => slot.id === selectedSlot
                )?.label || selectedSlot}
              </div>
            </div>

            <button
              onClick={() => setSelectedSlot(null)}
              style={buttonStyle()}
            >
              Tutup
            </button>
          </div>

          {squad[selectedSlot] && (
            <button
              onClick={() => removeFromSlot(selectedSlot)}
              style={{
                width: "100%",
                marginBottom: 16,
                padding: 11,
                borderRadius: 10,
                border: "1px solid rgba(255,100,100,0.4)",
                background: "rgba(120,30,30,0.18)",
                color: CREAM,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              🗑️ Keluarkan Pemain
            </button>
          )}

          {selectableCards.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 30,
                opacity: 0.7,
              }}
            >
              Belum ada kartu yang cocok untuk posisi ini.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(230px, 1fr))",
                gap: 15,
              }}
            >
              {selectableCards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: PANEL_SOFT,
                    borderRadius: 16,
                    padding: 10,
                    border: "1px solid rgba(245,239,224,0.1)",
                  }}
                >
                  <PlayerCard card={card} />

                  <button
                    onClick={() => putPlayerIntoSlot(card.id)}
                    style={{
                      width: "100%",
                      marginTop: 10,
                      padding: 11,
                      borderRadius: 10,
                      border: `1px solid ${GOLD}`,
                      background: "rgba(201,162,39,0.13)",
                      color: CREAM,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Pasang di{" "}
                    {FORMATIONS[formation]?.find(
                      (slot) => slot.id === selectedSlot
                    )?.label || selectedSlot}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ history }) {
  if (history.length === 0) {
    return (
      <div style={emptyStyle()}>
        Belum ada riwayat pertandingan.
        <br />
        Mainkan match pertama lu.
      </div>
    );
  }

  return (
    <div
      style={{
        background: PANEL,
        borderRadius: 20,
        padding: 22,
        border: "1px solid rgba(201,162,39,0.3)",
      }}
    >
      <h2 style={{ color: GOLD, marginTop: 0 }}>Match History</h2>

      <div
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {history.map((item) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr auto",
              gap: 12,
              alignItems: "center",
              background: PANEL_SOFT,
              borderRadius: 12,
              padding: 13,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                color:
                  item.result === "WIN"
                    ? "#69d27c"
                    : item.result === "LOSS"
                    ? "#ff7777"
                    : GOLD,
              }}
            >
              {item.result}
            </div>

            <div>
              <div style={{ fontWeight: 900 }}>
                RALOU FC {item.userGoals} - {item.oppGoals} {item.opponent}
              </div>
              <div style={{ fontSize: 12, opacity: 0.55, marginTop: 3 }}>
                {item.date} · OVR {item.userOverall} vs {item.opponentOverall}
              </div>
            </div>

            <div style={{ fontWeight: 900, color: GOLD }}>
              +{item.reward} 🪙
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div
      style={{
        minWidth: 70,
        textAlign: "center",
        background: PANEL_SOFT,
        borderRadius: 10,
        padding: "7px 9px",
        border: "1px solid rgba(201,162,39,0.2)",
      }}
    >
      <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ color: GOLD, fontSize: 18, fontWeight: 900 }}>
        {value}
      </div>
    </div>
  );
}

function PitchPlayer({ card, label, active, onClick }) {
  if (!card) {
    return (
      <button
        onClick={onClick}
        style={{
          width: 78,
          height: 78,
          borderRadius: "50%",
          border: active
            ? `3px solid ${GOLD}`
            : "2px dashed rgba(245,239,224,0.55)",
          background: "rgba(20,40,25,0.85)",
          color: CREAM,
          cursor: "pointer",
          boxShadow: active
            ? "0 0 25px rgba(201,162,39,0.65)"
            : "0 5px 15px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 25, fontWeight: 900 }}>+</div>
        <div style={{ fontSize: 10, fontWeight: 900 }}>{label}</div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: 112,
        minHeight: 110,
        borderRadius: 14,
        border: active
          ? `3px solid ${GOLD}`
          : "2px solid rgba(245,239,224,0.35)",
        background: "linear-gradient(145deg, #2c2618, #12110e)",
        color: CREAM,
        cursor: "pointer",
        padding: 7,
        boxShadow: active
          ? "0 0 28px rgba(201,162,39,0.7)"
          : "0 7px 20px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 10,
          fontWeight: 900,
          color: GOLD,
        }}
      >
        <span>{label}</span>
        <span>{card.overall}</span>
      </div>

      <div
        style={{
          height: 54,
          marginTop: 4,
          borderRadius: 8,
          background: "linear-gradient(180deg, #403823, #211d16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 27,
        }}
      >
        ⚽
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 11,
          fontWeight: 900,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {card.name}
      </div>

      <div
        style={{
          fontSize: 9,
          opacity: 0.65,
          marginTop: 2,
        }}
      >
        {card.position}
      </div>
    </button>
  );
}

function buttonStyle() {
  return {
    padding: "10px 15px",
    borderRadius: 10,
    border: `1px solid ${GOLD}`,
    background: PANEL_SOFT,
    color: CREAM,
    fontWeight: 900,
    cursor: "pointer",
  };
}

function emptyStyle() {
  return {
    background: PANEL,
    borderRadius: 18,
    padding: 50,
    textAlign: "center",
    border: "1px solid rgba(201,162,39,0.25)",
    opacity: 0.8,
    lineHeight: 1.7,
  };
}
