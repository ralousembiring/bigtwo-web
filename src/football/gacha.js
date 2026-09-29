import { CARD_DATABASE, CARD_RARITIES } from "./cards";

// ========================================
// BIAYA GACHA
// ========================================

export const GACHA_COST = {
  SINGLE: 20,
  TEN: 200,
};

// ========================================
// PELUANG RARITY
// ========================================

export const RARITY_CHANCES = {
  [CARD_RARITIES.STANDARD]: 60,
  [CARD_RARITIES.RARE]: 25,
  [CARD_RARITIES.EPIC]: 12,
  [CARD_RARITIES.LEGENDARY]: 3,
};

// ========================================
// PILIH RARITY
// ========================================

export function rollRarity() {
  const random = Math.random() * 100;

  let accumulated = 0;

  for (const [rarity, chance] of Object.entries(RARITY_CHANCES)) {
    accumulated += chance;

    if (random < accumulated) {
      return rarity;
    }
  }

  return CARD_RARITIES.STANDARD;
}

// ========================================
// AMBIL KARTU BERDASARKAN RARITY
// ========================================

export function getCardsByRarity(rarity) {
  return CARD_DATABASE.filter(
    (card) => card.rarity === rarity
  );
}

// ========================================
// RANDOM CARD
// ========================================

export function drawCard() {
  const rarity = rollRarity();

  const cards = getCardsByRarity(rarity);

  if (cards.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * cards.length
  );

  return cards[randomIndex];
}

// ========================================
// GACHA 1X
// ========================================

export function singleGacha() {
  return [drawCard()];
}

// ========================================
// GACHA 10X
// ========================================

export function tenGacha() {
  const results = [];

  for (let i = 0; i < 10; i++) {
    const card = drawCard();

    if (card) {
      results.push(card);
    }
  }

  return results;
}