// Aturan "Kartu 3 sampai 2" (Big Two): 3 terendah ... 2 tertinggi.
// Urutan bunga: Diamond < Club < Heart < Spade.

export const SUITS = [
  { key: "D", symbol: "♦", color: "#A6303C" },
  { key: "C", symbol: "♣", color: "#1B1B1B" },
  { key: "H", symbol: "♥", color: "#A6303C" },
  { key: "S", symbol: "♠", color: "#1B1B1B" },
];
const SUIT_ORDER = { D: 0, C: 1, H: 2, S: 3 };
const RANK_LABEL = { 11: "J", 12: "Q", 13: "K", 14: "A", 2: "2" };
export const rankLabel = (r) => RANK_LABEL[r] || String(r);

export function rankOrder(rank) {
  if (rank === 2) return 12;
  if (rank === 14) return 11;
  return rank - 3;
}
export function cardValue(card) {
  return rankOrder(card.rank) * 4 + SUIT_ORDER[card.suit];
}
export function cardKey(card) {
  return `${card.rank}${card.suit}`;
}
export function buildDeck() {
  const ranks = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 2];
  const deck = [];
  for (const s of SUITS) for (const r of ranks) deck.push({ rank: r, suit: s.key });
  return deck;
}
export function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
export function sortHand(hand) {
  return [...hand].sort((a, b) => cardValue(a) - cardValue(b));
}

const CATEGORY_LABEL = {
  straight: "Straight",
  flush: "Flush",
  fullhouse: "Full House",
  four: "Four of a Kind",
  straightflush: "Straight Flush",
};
const CATEGORY_RANK = { straight: 0, flush: 1, fullhouse: 2, four: 3, straightflush: 4 };

function classifyFive(cards) {
  const orders = cards.map((c) => rankOrder(c.rank)).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);
  const isFlush = suits.every((s) => s === suits[0]);
  const uniq = [...new Set(orders)];
  const isStraight = uniq.length === 5 && !uniq.includes(12) && uniq[4] - uniq[0] === 4;
  const counts = {};
  cards.forEach((c) => (counts[c.rank] = (counts[c.rank] || 0) + 1));
  const groups = Object.entries(counts)
    .map(([r, c]) => ({ rank: Number(r), count: c }))
    .sort((a, b) => b.count - a.count || rankOrder(b.rank) - rankOrder(a.rank));
  if (isStraight && isFlush) return { category: "straightflush", value: orders[4] };
  if (groups[0].count === 4) return { category: "four", value: rankOrder(groups[0].rank) };
  if (groups[0].count === 3 && groups[1] && groups[1].count === 2)
    return { category: "fullhouse", value: rankOrder(groups[0].rank) };
  if (isFlush) {
    const top = cards.reduce((m, c) => (cardValue(c) > cardValue(m) ? c : m), cards[0]);
    return { category: "flush", value: cardValue(top) };
  }
  if (isStraight) return { category: "straight", value: orders[4] };
  return null;
}

export function classifySelection(cards) {
  if (!cards || cards.length === 0) return null;
  if (cards.length === 1) return { size: 1, kind: "single", value: cardValue(cards[0]), label: "Kartu Tunggal" };
  if (cards.length === 2) {
    if (cards[0].rank !== cards[1].rank) return null;
    return { size: 2, kind: "pair", value: Math.max(cardValue(cards[0]), cardValue(cards[1])), label: "Pasangan" };
  }
  if (cards.length === 3) {
    if (!(cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank)) return null;
    return { size: 3, kind: "triple", value: Math.max(...cards.map(cardValue)), label: "Tiga Kembar" };
  }
  if (cards.length === 5) {
    const c = classifyFive(cards);
    if (!c) return null;
    return {
      size: 5,
      kind: "five",
      value: c.value,
      category: c.category,
      categoryRank: CATEGORY_RANK[c.category],
      label: CATEGORY_LABEL[c.category],
    };
  }
  return null;
}

export function comboBeats(newCombo, currentCombo) {
  if (!currentCombo) return true;
  if (newCombo.size !== currentCombo.size) return false;
  if (newCombo.size === 5) {
    if (newCombo.categoryRank !== currentCombo.categoryRank) return newCombo.categoryRank > currentCombo.categoryRank;
    return newCombo.value > currentCombo.value;
  }
  return newCombo.value > currentCombo.value;
}

function combinations(arr, k) {
  const results = [];
  const combo = [];
  function go(start) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      go(i + 1);
      combo.pop();
    }
  }
  go(0);
  return results;
}

export function findBeatingPlays(hand, currentCombo) {
  const size = currentCombo ? currentCombo.size : 1;
  const out = [];
  if (size === 1) {
    hand.forEach((c) => {
      const combo = classifySelection([c]);
      if (comboBeats(combo, currentCombo)) out.push({ cards: [c], combo });
    });
  } else if (size === 2 || size === 3) {
    const byRank = {};
    hand.forEach((c) => (byRank[c.rank] = byRank[c.rank] ? [...byRank[c.rank], c] : [c]));
    Object.values(byRank).forEach((group) => {
      if (group.length >= size) {
        combinations(group, size).forEach((cards) => {
          const combo = classifySelection(cards);
          if (combo && comboBeats(combo, currentCombo)) out.push({ cards, combo });
        });
      }
    });
  } else if (size === 5) {
    combinations(hand, 5).forEach((cards) => {
      const combo = classifySelection(cards);
      if (combo && comboBeats(combo, currentCombo)) out.push({ cards, combo });
    });
  }
  out.sort((a, b) =>
    a.combo.size === 5 && a.combo.categoryRank !== b.combo.categoryRank
      ? a.combo.categoryRank - b.combo.categoryRank
      : a.combo.value - b.combo.value
  );
  return out;
}

export function getMultiLeadOptions(hand) {
  const options = [];
  const byRank = {};
  hand.forEach((c) => (byRank[c.rank] = byRank[c.rank] ? [...byRank[c.rank], c] : [c]));
  Object.values(byRank).forEach((group) => {
    if (group.length >= 2) combinations(group, 2).forEach((cards) => options.push({ cards, combo: classifySelection(cards) }));
    if (group.length >= 3) combinations(group, 3).forEach((cards) => options.push({ cards, combo: classifySelection(cards) }));
  });
  combinations(hand, 5).forEach((cards) => {
    const combo = classifySelection(cards);
    if (combo) options.push({ cards, combo });
  });
  options.sort((a, b) => b.cards.length - a.cards.length || a.combo.value - b.combo.value);
  return options;
}

export function dealNewRound(prevWins) {
  let d = shuffle(buildDeck());
  const hands = [[], [], [], []];
  for (let i = 0; i < 13; i++) for (let p = 0; p < 4; p++) hands[p].push(d.pop());
  for (let p = 0; p < 4; p++) hands[p] = sortHand(hands[p]);
  let starter = 0;
  for (let p = 0; p < 4; p++) if (hands[p].some((c) => c.rank === 3 && c.suit === "D")) starter = p;
  return {
    phase: "playing",
    hands,
    currentPlayer: starter,
    currentCombo: null,
    passCount: 0,
    startingPlayer: starter,
    firstPlayDone: false,
    wins: prevWins || [0, 0, 0, 0],
    message: `starter:${starter}`,
    log: [],
  };
}
