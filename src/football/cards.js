import { PLAYERS } from "./players";

export const CARD_RARITIES = {
  STANDARD: "Standard",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};

const RARITY_LIMITS = {
  [CARD_RARITIES.STANDARD]: [60, 69],
  [CARD_RARITIES.RARE]: [70, 84],
  [CARD_RARITIES.EPIC]: [85, 92],
  [CARD_RARITIES.LEGENDARY]: [93, 99],
};

const EXPECTED_COUNTS = {
  [CARD_RARITIES.STANDARD]: 40,
  [CARD_RARITIES.RARE]: 30,
  [CARD_RARITIES.EPIC]: 20,
  [CARD_RARITIES.LEGENDARY]: 10,
};

// =====================================================
// FIELD PLAYER ATTRIBUTES
// =====================================================

const FIELD_ATTRIBUTES = [
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
];

// =====================================================
// GOALKEEPER ATTRIBUTES
// =====================================================

const GOALKEEPER_ATTRIBUTES = [
  "awareness",
  "catching",
  "reflexes",
  "diving",
  "jumping",
  "physical",
];

// =====================================================
// VALIDATE PLAYER
// =====================================================

function validatePlayer(player) {
  const limits = RARITY_LIMITS[player.rarity];

  if (!limits) {
    throw new Error(
      `Rarity tidak valid: ${player.rarity}`
    );
  }

  const [min, max] = limits;

  if (
    player.overall < min ||
    player.overall > max
  ) {
    throw new Error(
      `${player.name}: overall ${player.overall} ` +
      `tidak sesuai dengan rarity ${player.rarity}`
    );
  }

  const attributes =
    player.position === "GK"
      ? GOALKEEPER_ATTRIBUTES
      : FIELD_ATTRIBUTES;

  for (const attribute of attributes) {
    if (
      typeof player[attribute] !== "number" ||
      player[attribute] < 1 ||
      player[attribute] > 99
    ) {
      throw new Error(
        `${player.name}: atribut ${attribute} tidak valid`
      );
    }
  }
}

// =====================================================
// CREATE CARD
// =====================================================

function createCard(player) {
  validatePlayer(player);

  const baseCard = {
    id: `${player.id}_${player.rarity.toLowerCase()}`,
    playerId: player.id,
    name: player.name,
    nationality: player.nationality,
    position: player.position,
    era: player.era,
    rarity: player.rarity,
    overall: player.overall,
    ...(player.photo ? { photo: player.photo } : {}),
  };

  // ===================================================
  // GOALKEEPER CARD
  // ===================================================

  if (player.position === "GK") {
    return {
      ...baseCard,

      awareness: player.awareness,
      catching: player.catching,
      reflexes: player.reflexes,
      diving: player.diving,
      jumping: player.jumping,
      physical: player.physical,
    };
  }

  // ===================================================
  // FIELD PLAYER CARD
  // ===================================================

  return {
    ...baseCard,

    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
  };
}

// =====================================================
// FIXED CARD DATABASE
// =====================================================

export const CARD_DATABASE = PLAYERS.map(createCard);

// =====================================================
// DATABASE VALIDATION
// =====================================================

for (const [rarity, expected] of Object.entries(
  EXPECTED_COUNTS
)) {
  const actual = CARD_DATABASE.filter(
    (card) => card.rarity === rarity
  ).length;

  if (actual !== expected) {
    throw new Error(
      `[Football] ${rarity}: expected ${expected}, got ${actual}`
    );
  }
}

// =====================================================
// HELPERS
// =====================================================

export function getCardsByRarity(rarity) {
  return CARD_DATABASE.filter(
    (card) => card.rarity === rarity
  );
}

export function getCardById(id) {
  return CARD_DATABASE.find(
    (card) => card.id === id
  );
}

export function getCardsByPlayerId(playerId) {
  return CARD_DATABASE.filter(
    (card) => card.playerId === playerId
  );
}