// ============================================================
// RGameHub Football Player Database
// VERSION 1.500
// TARGET: 500 UNIQUE PLAYERS
// 50 LEGENDARY + 450 OTHER REAL PLAYERS
// ============================================================

const clamp = (value, min = 1, max = 99) =>
  Math.max(min, Math.min(max, Math.round(value)));

const makeStats = ({
  pace = 70,
  shooting = 50,
  passing = 60,
  dribbling = 60,
  defending = 40,
  physical = 60,
  awareness,
  catching,
  reflexes,
  diving,
  jumping,
}) => ({
  pace: clamp(pace),
  shooting: clamp(shooting),
  passing: clamp(passing),
  dribbling: clamp(dribbling),
  defending: clamp(defending),
  physical: clamp(physical),

  ...(awareness !== undefined && { awareness: clamp(awareness) }),
  ...(catching !== undefined && { catching: clamp(catching) }),
  ...(reflexes !== undefined && { reflexes: clamp(reflexes) }),
  ...(diving !== undefined && { diving: clamp(diving) }),
  ...(jumping !== undefined && { jumping: clamp(jumping) }),
});

const makePlayer = ({
  id,
  name,
  nationality,
  position,
  overall,
  rarity,
  stats,
}) => ({
  id,
  name,
  nationality,
  position,
  overall: clamp(overall),
  rarity,
  stats,
});

// ============================================================
// 50 LEGENDARY
// ============================================================

const LEGENDARY_PLAYERS = [

  {
    id: "player_001",
    name: "Gianluigi Buffon",
    nationality: "Italy",
    position: "GK",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      awareness: 98,
      catching: 97,
      reflexes: 97,
      diving: 97,
      jumping: 93,
      physical: 92,
    }),
  },

  {
    id: "player_002",
    name: "Iker Casillas",
    nationality: "Spain",
    position: "GK",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      awareness: 96,
      catching: 94,
      reflexes: 99,
      diving: 98,
      jumping: 91,
      physical: 86,
    }),
  },

  {
    id: "player_003",
    name: "Manuel Neuer",
    nationality: "Germany",
    position: "GK",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      awareness: 98,
      catching: 95,
      reflexes: 96,
      diving: 96,
      jumping: 91,
      physical: 94,
    }),
  },

  {
    id: "player_004",
    name: "Lev Yashin",
    nationality: "Soviet Union",
    position: "GK",
    overall: 98,
    rarity: "Legendary",
    stats: makeStats({
      awareness: 99,
      catching: 98,
      reflexes: 99,
      diving: 99,
      jumping: 95,
      physical: 91,
    }),
  },

  {
    id: "player_005",
    name: "Peter Schmeichel",
    nationality: "Denmark",
    position: "GK",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      awareness: 97,
      catching: 96,
      reflexes: 96,
      diving: 97,
      jumping: 96,
      physical: 96,
    }),
  },

  {
    id: "player_006",
    name: "Paolo Maldini",
    nationality: "Italy",
    position: "CB/LB",
    overall: 98,
    rarity: "Legendary",
    stats: makeStats({
      pace: 88,
      shooting: 62,
      passing: 91,
      dribbling: 83,
      defending: 99,
      physical: 91,
    }),
  },

  {
    id: "player_007",
    name: "Franco Baresi",
    nationality: "Italy",
    position: "CB",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 79,
      shooting: 48,
      passing: 93,
      dribbling: 75,
      defending: 99,
      physical: 86,
    }),
  },

  {
    id: "player_008",
    name: "Alessandro Nesta",
    nationality: "Italy",
    position: "CB",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 82,
      shooting: 43,
      passing: 85,
      dribbling: 68,
      defending: 99,
      physical: 87,
    }),
  },

  {
    id: "player_009",
    name: "Fabio Cannavaro",
    nationality: "Italy",
    position: "CB",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 87,
      shooting: 45,
      passing: 80,
      dribbling: 63,
      defending: 98,
      physical: 91,
    }),
  },

  {
    id: "player_010",
    name: "Franz Beckenbauer",
    nationality: "Germany",
    position: "CB/DM",
    overall: 98,
    rarity: "Legendary",
    stats: makeStats({
      pace: 84,
      shooting: 69,
      passing: 97,
      dribbling: 88,
      defending: 96,
      physical: 87,
    }),
  },

  {
    id: "player_011",
    name: "Roberto Carlos",
    nationality: "Brazil",
    position: "LB",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 97,
      shooting: 91,
      passing: 91,
      dribbling: 89,
      defending: 89,
      physical: 92,
    }),
  },

  {
    id: "player_012",
    name: "Cafu",
    nationality: "Brazil",
    position: "RB",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 95,
      shooting: 60,
      passing: 91,
      dribbling: 88,
      defending: 91,
      physical: 92,
    }),
  },

  {
    id: "player_013",
    name: "Sergio Ramos",
    nationality: "Spain",
    position: "CB/RB",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 82,
      shooting: 72,
      passing: 84,
      dribbling: 72,
      defending: 96,
      physical: 95,
    }),
  },

  {
    id: "player_014",
    name: "Carles Puyol",
    nationality: "Spain",
    position: "CB",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 78,
      shooting: 48,
      passing: 76,
      dribbling: 57,
      defending: 98,
      physical: 96,
    }),
  },

  {
    id: "player_015",
    name: "Carlos Alberto",
    nationality: "Brazil",
    position: "RB",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 91,
      shooting: 71,
      passing: 89,
      dribbling: 88,
      defending: 90,
      physical: 87,
    }),
  },

  {
    id: "player_016",
    name: "Zinedine Zidane",
    nationality: "France",
    position: "CAM",
    overall: 98,
    rarity: "Legendary",
    stats: makeStats({
      pace: 86,
      shooting: 91,
      passing: 98,
      dribbling: 97,
      defending: 55,
      physical: 88,
    }),
  },

  {
    id: "player_017",
    name: "Xavi",
    nationality: "Spain",
    position: "CM",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 70,
      shooting: 76,
      passing: 99,
      dribbling: 94,
      defending: 68,
      physical: 67,
    }),
  },

  {
    id: "player_018",
    name: "Andrés Iniesta",
    nationality: "Spain",
    position: "CM",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 78,
      shooting: 82,
      passing: 98,
      dribbling: 99,
      defending: 59,
      physical: 64,
    }),
  },

  {
    id: "player_019",
    name: "Lothar Matthäus",
    nationality: "Germany",
    position: "CM/DM",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 91,
      shooting: 88,
      passing: 94,
      dribbling: 90,
      defending: 89,
      physical: 94,
    }),
  },

  {
    id: "player_020",
    name: "Andrea Pirlo",
    nationality: "Italy",
    position: "CM/DM",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 62,
      shooting: 82,
      passing: 99,
      dribbling: 91,
      defending: 65,
      physical: 66,
    }),
  },

  {
    id: "player_021",
    name: "Ruud Gullit",
    nationality: "Netherlands",
    position: "CM/CAM",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 90,
      shooting: 91,
      passing: 90,
      dribbling: 91,
      defending: 72,
      physical: 96,
    }),
  },

  {
    id: "player_022",
    name: "Frank Rijkaard",
    nationality: "Netherlands",
    position: "DM/CB",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 78,
      shooting: 61,
      passing: 89,
      dribbling: 73,
      defending: 95,
      physical: 94,
    }),
  },

  {
    id: "player_023",
    name: "Michel Platini",
    nationality: "France",
    position: "CAM",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 82,
      shooting: 94,
      passing: 98,
      dribbling: 94,
      defending: 43,
      physical: 70,
    }),
  },

  {
    id: "player_024",
    name: "Johan Cruyff",
    nationality: "Netherlands",
    position: "CAM/CF",
    overall: 98,
    rarity: "Legendary",
    stats: makeStats({
      pace: 95,
      shooting: 95,
      passing: 97,
      dribbling: 98,
      defending: 38,
      physical: 73,
    }),
  },

  {
    id: "player_025",
    name: "George Best",
    nationality: "Northern Ireland",
    position: "RW/LW",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 94,
      shooting: 91,
      passing: 87,
      dribbling: 98,
      defending: 35,
      physical: 75,
    }),
  },

  {
    id: "player_026",
    name: "Ronaldinho",
    nationality: "Brazil",
    position: "LW/CAM",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 91,
      shooting: 91,
      passing: 94,
      dribbling: 99,
      defending: 39,
      physical: 78,
    }),
  },

  {
    id: "player_027",
    name: "Garrincha",
    nationality: "Brazil",
    position: "RW",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 96,
      shooting: 88,
      passing: 88,
      dribbling: 99,
      defending: 31,
      physical: 71,
    }),
  },

  {
    id: "player_028",
    name: "Luís Figo",
    nationality: "Portugal",
    position: "RW",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 89,
      shooting: 85,
      passing: 95,
      dribbling: 96,
      defending: 42,
      physical: 78,
    }),
  },

  {
    id: "player_029",
    name: "David Beckham",
    nationality: "England",
    position: "RM/RW",
    overall: 94,
    rarity: "Legendary",
    stats: makeStats({
      pace: 73,
      shooting: 87,
      passing: 99,
      dribbling: 86,
      defending: 52,
      physical: 77,
    }),
  },

  {
    id: "player_030",
    name: "Kaká",
    nationality: "Brazil",
    position: "CAM",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 94,
      shooting: 91,
      passing: 91,
      dribbling: 95,
      defending: 35,
      physical: 79,
    }),
  },

  {
    id: "player_031",
    name: "Lionel Messi",
    nationality: "Argentina",
    position: "RW",
    overall: 99,
    rarity: "Legendary",
    stats: makeStats({
      pace: 92,
      shooting: 98,
      passing: 99,
      dribbling: 99,
      defending: 44,
      physical: 76,
    }),
  },

  {
    id: "player_032",
    name: "Cristiano Ronaldo",
    nationality: "Portugal",
    position: "LW",
    overall: 99,
    rarity: "Legendary",
    stats: makeStats({
      pace: 96,
      shooting: 99,
      passing: 90,
      dribbling: 97,
      defending: 39,
      physical: 95,
    }),
  },

  {
    id: "player_033",
    name: "Ronaldo Nazário",
    nationality: "Brazil",
    position: "ST",
    overall: 98,
    rarity: "Legendary",
    stats: makeStats({
      pace: 97,
      shooting: 98,
      passing: 84,
      dribbling: 98,
      defending: 28,
      physical: 89,
    }),
  },

  {
    id: "player_034",
    name: "Thierry Henry",
    nationality: "France",
    position: "ST/LW",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 97,
      shooting: 96,
      passing: 90,
      dribbling: 95,
      defending: 31,
      physical: 86,
    }),
  },

  {
    id: "player_035",
    name: "Marco van Basten",
    nationality: "Netherlands",
    position: "ST",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 88,
      shooting: 99,
      passing: 88,
      dribbling: 93,
      defending: 24,
      physical: 91,
    }),
  },

  {
    id: "player_036",
    name: "Pelé",
    nationality: "Brazil",
    position: "ST/CAM",
    overall: 99,
    rarity: "Legendary",
    stats: makeStats({
      pace: 95,
      shooting: 99,
      passing: 96,
      dribbling: 99,
      defending: 42,
      physical: 88,
    }),
  },

  {
    id: "player_037",
    name: "Diego Maradona",
    nationality: "Argentina",
    position: "CAM",
    overall: 98,
    rarity: "Legendary",
    stats: makeStats({
      pace: 91,
      shooting: 95,
      passing: 98,
      dribbling: 99,
      defending: 32,
      physical: 75,
    }),
  },

  {
    id: "player_038",
    name: "Eusébio",
    nationality: "Portugal",
    position: "ST",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 96,
      shooting: 98,
      passing: 83,
      dribbling: 94,
      defending: 25,
      physical: 86,
    }),
  },

  {
    id: "player_039",
    name: "Ferenc Puskás",
    nationality: "Hungary",
    position: "ST",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 84,
      shooting: 99,
      passing: 92,
      dribbling: 94,
      defending: 21,
      physical: 79,
    }),
  },

  {
    id: "player_040",
    name: "Gerd Müller",
    nationality: "Germany",
    position: "ST",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 88,
      shooting: 99,
      passing: 76,
      dribbling: 90,
      defending: 19,
      physical: 84,
    }),
  },

  {
    id: "player_041",
    name: "George Weah",
    nationality: "Liberia",
    position: "ST",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 96,
      shooting: 94,
      passing: 79,
      dribbling: 94,
      defending: 24,
      physical: 94,
    }),
  },

  {
    id: "player_042",
    name: "Romário",
    nationality: "Brazil",
    position: "ST",
    overall: 97,
    rarity: "Legendary",
    stats: makeStats({
      pace: 91,
      shooting: 99,
      passing: 79,
      dribbling: 97,
      defending: 18,
      physical: 76,
    }),
  },

  {
    id: "player_043",
    name: "Gabriel Batistuta",
    nationality: "Argentina",
    position: "ST",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 85,
      shooting: 98,
      passing: 70,
      dribbling: 83,
      defending: 22,
      physical: 95,
    }),
  },

  {
    id: "player_044",
    name: "Dennis Bergkamp",
    nationality: "Netherlands",
    position: "CF/ST",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 78,
      shooting: 94,
      passing: 96,
      dribbling: 97,
      defending: 25,
      physical: 71,
    }),
  },

  {
    id: "player_045",
    name: "Alan Shearer",
    nationality: "England",
    position: "ST",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 79,
      shooting: 98,
      passing: 72,
      dribbling: 80,
      defending: 20,
      physical: 94,
    }),
  },

  {
    id: "player_046",
    name: "Rivaldo",
    nationality: "Brazil",
    position: "LW/CAM",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 84,
      shooting: 96,
      passing: 91,
      dribbling: 94,
      defending: 30,
      physical: 79,
    }),
  },

  {
    id: "player_047",
    name: "Roberto Baggio",
    nationality: "Italy",
    position: "CAM/CF",
    overall: 96,
    rarity: "Legendary",
    stats: makeStats({
      pace: 84,
      shooting: 94,
      passing: 94,
      dribbling: 98,
      defending: 25,
      physical: 63,
    }),
  },

  {
    id: "player_048",
    name: "Sócrates",
    nationality: "Brazil",
    position: "CAM",
    overall: 94,
    rarity: "Legendary",
    stats: makeStats({
      pace: 73,
      shooting: 86,
      passing: 96,
      dribbling: 90,
      defending: 34,
      physical: 87,
    }),
  },

  {
    id: "player_049",
    name: "Steven Gerrard",
    nationality: "England",
    position: "CM",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 82,
      shooting: 91,
      passing: 95,
      dribbling: 84,
      defending: 72,
      physical: 89,
    }),
  },

  {
    id: "player_050",
    name: "Frank Lampard",
    nationality: "England",
    position: "CM",
    overall: 95,
    rarity: "Legendary",
    stats: makeStats({
      pace: 73,
      shooting: 94,
      passing: 91,
      dribbling: 81,
      defending: 69,
      physical: 82,
    }),
  },
];

// ============================================================
// PART 2 AKAN DIMULAI DARI PLAYER #051
// ============================================================ 
// ============================================================
// REAL PLAYERS
// #051 - #100
// ============================================================

const REAL_PLAYER_DATA = [

  // #051 - #060
  ["Alisson Becker", "Brazil", "GK", 89],
  ["Ederson", "Brazil", "GK", 88],
  ["Thibaut Courtois", "Belgium", "GK", 89],
  ["Jan Oblak", "Slovenia", "GK", 88],
  ["Marc-André ter Stegen", "Germany", "GK", 87],
  ["Mike Maignan", "France", "GK", 87],
  ["Emiliano Martínez", "Argentina", "GK", 86],
  ["Gianluigi Donnarumma", "Italy", "GK", 89],
  ["David Raya", "Spain", "GK", 85],
  ["Yassine Bounou", "Morocco", "GK", 84],

  // #061 - #070
  ["Virgil van Dijk", "Netherlands", "CB", 89],
  ["Rúben Dias", "Portugal", "CB", 88],
  ["William Saliba", "France", "CB", 87],
  ["Antonio Rüdiger", "Germany", "CB", 86],
  ["Marquinhos", "Brazil", "CB", 86],
  ["Ronald Araújo", "Uruguay", "CB", 85],
  ["Éder Militão", "Brazil", "CB", 85],
  ["Alessandro Bastoni", "Italy", "CB", 87],
  ["Matthijs de Ligt", "Netherlands", "CB", 84],
  ["John Stones", "England", "CB", 85],

  // #071 - #080
  ["Trent Alexander-Arnold", "England", "RB", 86],
  ["Achraf Hakimi", "Morocco", "RB", 88],
  ["Kyle Walker", "England", "RB", 84],
  ["Reece James", "England", "RB", 84],
  ["Dani Carvajal", "Spain", "RB", 86],
  ["João Cancelo", "Portugal", "RB/LB", 86],
  ["Theo Hernández", "France", "LB", 87],
  ["Andrew Robertson", "Scotland", "LB", 85],
  ["Alphonso Davies", "Canada", "LB", 84],
  ["Luke Shaw", "England", "LB", 82],

  // #081 - #090
  ["Rodri", "Spain", "DM", 91],
  ["Joshua Kimmich", "Germany", "DM/CM", 89],
  ["Declan Rice", "England", "DM/CM", 87],
  ["Aurélien Tchouaméni", "France", "DM/CM", 84],
  ["Casemiro", "Brazil", "DM", 84],
  ["Frenkie de Jong", "Netherlands", "CM", 87],
  ["Federico Valverde", "Uruguay", "CM", 88],
  ["Toni Kroos", "Germany", "CM", 88],
  ["Luka Modrić", "Croatia", "CM", 87],
  ["Kevin De Bruyne", "Belgium", "CAM/CM", 90],

  // #091 - #100
  ["Bernardo Silva", "Portugal", "CAM/RW", 88],
  ["Bruno Fernandes", "Portugal", "CAM/CM", 88],
  ["Jude Bellingham", "England", "CM/CAM", 90],
  ["Pedri", "Spain", "CM", 87],
  ["Martin Ødegaard", "Norway", "CAM/CM", 89],
  ["Jamal Musiala", "Germany", "CAM/CM", 88],
  ["Florian Wirtz", "Germany", "CAM", 89],
  ["Phil Foden", "England", "CAM/RW", 88],
  ["Cole Palmer", "England", "CAM/RW", 87],
  ["Thomas Müller", "Germany", "CAM/CF", 84],
    // #101 - #110
  ["Victor Osimhen", "Nigeria", "ST", 87],
  ["Harry Kane", "England", "ST", 90],
  ["Erling Haaland", "Norway", "ST", 91],
  ["Kylian Mbappé", "France", "ST/LW", 92],
  ["Vinícius Júnior", "Brazil", "LW", 90],
  ["Mohamed Salah", "Egypt", "RW", 89],
  ["Son Heung-min", "South Korea", "LW", 87],
  ["Sadio Mané", "Senegal", "LW", 85],
  ["Lautaro Martínez", "Argentina", "ST", 88],
  ["Robert Lewandowski", "Poland", "ST", 90],

  // #111 - #120
  ["Antoine Griezmann", "France", "CF/CAM", 87],
  ["Ousmane Dembélé", "France", "RW", 87],
  ["Rafael Leão", "Portugal", "LW", 86],
  ["Rodrygo", "Brazil", "RW", 85],
  ["Khvicha Kvaratskhelia", "Georgia", "LW", 86],
  ["Bukayo Saka", "England", "RW", 87],
  ["Marcus Rashford", "England", "LW/ST", 83],
  ["Gabriel Martinelli", "Brazil", "LW", 82],
  ["Gabriel Jesus", "Brazil", "ST", 82],
  ["Darwin Núñez", "Uruguay", "ST", 84],

  // #121 - #130
  ["Romelu Lukaku", "Belgium", "ST", 84],
  ["Dušan Vlahović", "Serbia", "ST", 84],
  ["Victor Boniface", "Nigeria", "ST", 82],
  ["Alexander Isak", "Sweden", "ST", 86],
  ["Rasmus Højlund", "Denmark", "ST", 80],
  ["Jonathan David", "Canada", "ST", 84],
  ["Ollie Watkins", "England", "ST", 85],
  ["Julian Alvarez", "Argentina", "ST/CF", 87],
  ["Ángel Di María", "Argentina", "RW", 84],
  ["Paulo Dybala", "Argentina", "CAM/CF", 86],

  // #131 - #140
  ["Nicolò Barella", "Italy", "CM", 87],
  ["Nicolò Zaniolo", "Italy", "CAM/RW", 78],
  ["Hakan Çalhanoğlu", "Turkey", "CM/CAM", 87],
  ["Lorenzo Pellegrini", "Italy", "CAM/CM", 83],
  ["Jorginho", "Italy", "DM/CM", 84],
  ["Marco Verratti", "Italy", "CM", 86],
  ["Sergej Milinković-Savić", "Serbia", "CM", 84],
  ["Bruno Guimarães", "Brazil", "CM/DM", 85],
  ["Enzo Fernández", "Argentina", "CM", 85],
  ["Alexis Mac Allister", "Argentina", "CM", 85],

  // #141 - #150
  ["Mason Mount", "England", "CAM/CM", 79],
  ["Maximilian Mittelstädt", "Germany", "LB", 77],
  ["Christian Eriksen", "Denmark", "CM/CAM", 82],
  ["James Maddison", "England", "CAM", 84],
  ["Dominik Szoboszlai", "Hungary", "CM/CAM", 83],
  ["Xavi Simons", "Netherlands", "CAM/RW", 82],
  ["Dani Olmo", "Spain", "CAM/LW", 84],
  ["Mikel Merino", "Spain", "CM", 83],
  ["Fabian Ruiz", "Spain", "CM", 84],
  ["Isco", "Spain", "CAM", 83],
    // #151 - #160
  ["Thiago Alcântara", "Spain", "CM", 82],
  ["Thiago Silva", "Brazil", "CB", 84],
  ["Raphaël Varane", "France", "CB", 84],
  ["Kalidou Koulibaly", "Senegal", "CB", 82],
  ["Aymeric Laporte", "Spain", "CB", 83],
  ["Stefan de Vrij", "Netherlands", "CB", 82],
  ["Niklas Süle", "Germany", "CB", 80],
  ["Jonathan Tah", "Germany", "CB", 82],
  ["Antonio Silva", "Portugal", "CB", 81],
  ["Gonçalo Inácio", "Portugal", "CB", 82],

  // #161 - #170
  ["Kim Min-jae", "South Korea", "CB", 85],
  ["Cristian Romero", "Argentina", "CB", 85],
  ["Lisandro Martínez", "Argentina", "CB", 84],
  ["Gabriel Magalhães", "Brazil", "CB", 84],
  ["William Carvalho", "Portugal", "DM", 78],
  ["Pau Torres", "Spain", "CB", 82],
  ["Wesley Fofana", "France", "CB", 79],
  ["Ibrahima Konaté", "France", "CB", 83],
  ["Dayot Upamecano", "France", "CB", 82],
  ["Milan Škriniar", "Slovakia", "CB", 81],

  // #171 - #180
  ["Ben White", "England", "RB/CB", 83],
  ["Kieran Trippier", "England", "RB", 82],
  ["Benjamin Pavard", "France", "RB/CB", 82],
  ["Jeremie Frimpong", "Netherlands", "RB", 85],
  ["Diogo Dalot", "Portugal", "RB/LB", 81],
  ["Pedro Porro", "Spain", "RB", 83],
  ["Nahuel Molina", "Argentina", "RB", 82],
  ["Oleksandr Zinchenko", "Ukraine", "LB", 80],
  ["Nuno Mendes", "Portugal", "LB", 85],
  ["Ferland Mendy", "France", "LB", 80],

  // #181 - #190
  ["Andy Diouf", "France", "CM", 75],
  ["Yves Bissouma", "Mali", "DM", 79],
  ["Amadou Onana", "Belgium", "DM", 80],
  ["Moisés Caicedo", "Ecuador", "DM/CM", 84],
  ["Manuel Ugarte", "Uruguay", "DM", 81],
  ["Sandro Tonali", "Italy", "DM/CM", 83],
    ["Malik Tillman", "USA", "CAM/CM", 78],
  ["Adrien Rabiot", "France", "CM", 81],
  ["Eduardo Camavinga", "France", "CM/DM", 85],
  ["Fermín López", "Spain", "CM/CAM", 78],

  // #191 - #200
  ["Gavi", "Spain", "CM", 84],
  ["Martin Zubimendi", "Spain", "DM", 84], // pengganti Pedri González
  ["Sergio Busquets", "Spain", "DM", 84],
  ["Ilkay Gündogan", "Germany", "CM", 85],
  ["Fabinho", "Brazil", "DM", 82],
   ["João Palhinha", "Portugal", "DM", 82], // pengganti Casemiro Henrique
  ["Paul Pogba", "France", "CM", 80],
  ["N'Golo Kanté", "France", "DM/CM", 84],
  ["Anderson Talisca", "Brazil", "CAM/ST", 80],
  ["Arthur Melo", "Brazil", "CM", 76],
    // #201 - #210
  ["Warren Zaïre-Emery", "France", "CM", 82],
  ["Conor Gallagher", "England", "CM", 80],
  ["Curtis Jones", "England", "CM", 78],
  ["Kobbie Mainoo", "England", "CM", 79],
  ["Mats Wieffer", "Netherlands", "DM", 78],
  ["Teun Koopmeiners", "Netherlands", "CM/DM", 82],
  ["Ryan Gravenberch", "Netherlands", "CM", 80],
  ["Mikel Oyarzabal", "Spain", "LW", 84],
  ["Yeremy Pino", "Spain", "RW", 80],
  ["Ferran Torres", "Spain", "RW/ST", 81],

  // #211 - #220
  ["Nico Williams", "Spain", "LW", 84],
  ["Lamine Yamal", "Spain", "RW", 86],
  ["Raphinha", "Brazil", "RW", 86],
  ["Savinho", "Brazil", "RW", 80],
  ["Antony", "Brazil", "RW", 78],
  ["Gabriel Barbosa", "Brazil", "ST", 77],
  ["Richarlison", "Brazil", "ST", 80],
  ["Evanilson", "Brazil", "ST", 79],
  ["Endrick", "Brazil", "ST", 78],
  ["Pepê", "Brazil", "LW", 78],

  // #221 - #230
  ["Gonçalo Ramos", "Portugal", "ST", 81],
  ["Diogo Jota", "Portugal", "ST/LW", 84],
  ["Rafael Silva", "Portugal", "RW", 79],
  ["Pedro Gonçalves", "Portugal", "CAM", 80],
  ["Francisco Conceição", "Portugal", "RW", 79],
  ["João Félix", "Portugal", "CF/CAM", 81],
  ["André Silva", "Portugal", "ST", 78],
  ["Gonçalo Guedes", "Portugal", "LW", 77],
  ["Rúben Neves", "Portugal", "DM", 82],
  ["Vitinha", "Portugal", "CM", 85],

  // #231 - #240
  ["Federico Chiesa", "Italy", "RW/LW", 83],
  ["Giacomo Raspadori", "Italy", "ST/CAM", 78],
  ["Moise Kean", "Italy", "ST", 79],
  ["Gianluca Scamacca", "Italy", "ST", 80],
  ["Ciro Immobile", "Italy", "ST", 82],
  ["Domenico Berardi", "Italy", "RW", 81],
  ["Matteo Politano", "Italy", "RW", 80],
  ["Davide Frattesi", "Italy", "CM", 82],
  ["Lorenzo Insigne", "Italy", "LW", 80],
  ["Federico Dimarco", "Italy", "LB", 85],

  // #241 - #250
  ["Memphis Depay", "Netherlands", "ST/CF", 82],
  ["Cody Gakpo", "Netherlands", "LW/ST", 84],
  ["Steven Bergwijn", "Netherlands", "LW/RW", 78],
  ["Noa Lang", "Netherlands", "LW", 78],
  ["Donyell Malen", "Netherlands", "RW/ST", 81],
  ["Wout Weghorst", "Netherlands", "ST", 77],
  ["Georginio Wijnaldum", "Netherlands", "CM", 78],
  ["Marten de Roon", "Netherlands", "DM", 78],
  ["Denzel Dumfries", "Netherlands", "RB", 82],
  ["Daley Blind", "Netherlands", "CB/LB", 77],
    // #251 - #260
  ["Karim Benzema", "France", "ST", 88],
  ["Olivier Giroud", "France", "ST", 82],
  ["Kingsley Coman", "France", "LW/RW", 84],
  ["Christopher Nkunku", "France", "CF/CAM", 83],
  ["Randal Kolo Muani", "France", "ST", 81],
  ["Marcus Thuram", "France", "ST", 84],
  ["Moussa Diaby", "France", "RW", 82],
  ["Kingsley Ehizibue", "Netherlands", "RB", 74],
  ["Nabil Fekir", "France", "CAM", 78],
  ["Adrien Truffert", "France", "LB", 76],

  // #261 - #270
  ["Timo Werner", "Germany", "ST/LW", 79],
  ["Serge Gnabry", "Germany", "RW/LW", 82],
  ["Leroy Sané", "Germany", "RW/LW", 85],
  ["Kai Havertz", "Germany", "CAM/ST", 82],
  ["Niclas Füllkrug", "Germany", "ST", 80],
  ["Karim Adeyemi", "Germany", "ST/LW", 79],
  ["Julian Brandt", "Germany", "CAM", 82],
  ["Leon Goretzka", "Germany", "CM", 82],
  ["Florian Neuhaus", "Germany", "CM", 76],
  ["Emre Can", "Germany", "DM/CB", 79],

  // #271 - #280
  ["Christian Pulisic", "USA", "LW/RW", 85],
  ["Weston McKennie", "USA", "CM", 79],
  ["Timothy Weah", "USA", "RW", 78],
  ["Yunus Musah", "USA", "CM", 77],
  ["Folarin Balogun", "USA", "ST", 78],
  ["Giovanni Reyna", "USA", "CAM", 76],
  ["Tyler Adams", "USA", "DM", 77],
  ["Sergiño Dest", "USA", "RB/LB", 76],
  ["Ricardo Pepi", "USA", "ST", 76],
  ["Antonee Robinson", "USA", "LB", 80],

  // #281 - #290
  ["Hirving Lozano", "Mexico", "RW/LW", 81],
  ["Raúl Jiménez", "Mexico", "ST", 78],
  ["Santiago Giménez", "Mexico", "ST", 82],
  ["Edson Álvarez", "Mexico", "DM/CB", 81],
  ["Guillermo Ochoa", "Mexico", "GK", 79],
  ["Luis Chávez", "Mexico", "CM", 77],
  ["Orbelín Pineda", "Mexico", "CAM", 76],
  ["Henry Martín", "Mexico", "ST", 77],
  ["Julián Quiñones", "Mexico", "ST", 78],
  ["Jesús Gallardo", "Mexico", "LB", 75],

  // #291 - #300
  ["Luis Díaz", "Colombia", "LW", 86],
  ["Jhon Durán", "Colombia", "ST", 80],
  ["Luis Sinisterra", "Colombia", "LW", 76],
  ["James Rodríguez", "Colombia", "CAM", 79],
  ["Juan Cuadrado", "Colombia", "RW/RB", 78],
  ["Davinson Sánchez", "Colombia", "CB", 79],
  ["Yerry Mina", "Colombia", "CB", 77],
  ["Jefferson Lerma", "Colombia", "DM", 78],
  ["Jhon Arias", "Colombia", "RW", 79],
  ["Rafael Borré", "Colombia", "ST", 78],
    // #301 - #310
  ["Sergio Agüero", "Argentina", "ST", 89],
  ["Carlos Tévez", "Argentina", "ST", 88],
  ["Gonzalo Higuaín", "Argentina", "ST", 86],
  ["Javier Saviola", "Argentina", "ST", 82],
  ["Hernán Crespo", "Argentina", "ST", 88],
  ["Claudio Caniggia", "Argentina", "ST/RW", 84],
  ["Javier Zanetti", "Argentina", "RB", 89],
  ["Walter Samuel", "Argentina", "CB", 84],
  ["Esteban Cambiasso", "Argentina", "DM", 83],
  ["Juan Sebastián Verón", "Argentina", "CM", 87],

  // #311 - #320
  ["Ángel Correa", "Argentina", "SS/RW", 80],
  ["Giovani Lo Celso", "Argentina", "CM/CAM", 81],
  ["Leandro Paredes", "Argentina", "DM", 81],
  ["Exequiel Palacios", "Argentina", "CM", 80],
  ["Nicolás González", "Argentina", "LW/ST", 81],
  ["Marcos Acuña", "Argentina", "LB", 80],
  ["Germán Pezzella", "Argentina", "CB", 78],
  ["Ezequiel Lavezzi", "Argentina", "LW/RW", 83],
  ["Ever Banega", "Argentina", "CM", 82],
  ["Lucas Biglia", "Argentina", "DM", 78],

  // #321 - #330
  ["Cesc Fàbregas", "Spain", "CM", 88],
  ["David Villa", "Spain", "ST", 91],
  ["Fernando Torres", "Spain", "ST", 88],
  ["Raúl González", "Spain", "ST", 90],
  ["Fernando Morientes", "Spain", "ST", 84],
  ["David Silva", "Spain", "CAM", 91],
  ["Juan Mata", "Spain", "CAM", 85],
  ["Santi Cazorla", "Spain", "CM/CAM", 84],
  ["Xabi Alonso", "Spain", "DM/CM", 89],
  ["Jesús Navas", "Spain", "RB/RW", 80],

  // #331 - #340
  ["Jordi Alba", "Spain", "LB", 87],
  ["César Azpilicueta", "Spain", "RB/CB", 82],
  ["Gerard Piqué", "Spain", "CB", 88],
  ["Javier Mascherano", "Argentina", "CB/DM", 86],
  ["Diego Godín", "Uruguay", "CB", 87],
  ["Diego Lugano", "Uruguay", "CB", 79],
  ["Edinson Cavani", "Uruguay", "ST", 86],
  ["Diego Forlán", "Uruguay", "ST", 89],
  ["Luis Suárez", "Uruguay", "ST", 91],
  ["Álvaro Recoba", "Uruguay", "CAM/LW", 84],

  // #341 - #350
  ["Sebastián Coates", "Uruguay", "CB", 77],
  ["Martín Cáceres", "Uruguay", "CB/RB", 76],
  ["Fernando Muslera", "Uruguay", "GK", 80],
  ["Diego Pérez", "Uruguay", "DM", 76],
  ["Walter Gargano", "Uruguay", "DM", 75],
  ["Maxi Pereira", "Uruguay", "RB", 78],
  ["Cristian Rodríguez", "Uruguay", "LW", 79],
  ["Álvaro Pereira", "Uruguay", "LB", 77],
  ["Sebastián Abreu", "Uruguay", "ST", 78],
  ["Nicolás Lodeiro", "Uruguay", "CAM", 78],

    // #351 - #360
  ["Yaya Touré", "Ivory Coast", "CM/DM", 88],
  ["Didier Drogba", "Ivory Coast", "ST", 91],
  ["Samuel Eto'o", "Cameroon", "ST", 91],
  ["Jay-Jay Okocha", "Nigeria", "CAM", 86],
  ["Nwankwo Kanu", "Nigeria", "ST/CAM", 84],
  ["Michael Essien", "Ghana", "DM/CM", 87],
  ["Sulley Muntari", "Ghana", "CM/DM", 78],
  ["Asamoah Gyan", "Ghana", "ST", 83],
  ["Emmanuel Adebayor", "Togo", "ST", 82],
  ["Riyad Mahrez", "Algeria", "RW", 86],

  // #361 - #370
  ["Islam Slimani", "Algeria", "ST", 77],
  ["Sofiane Feghouli", "Algeria", "RW/CM", 76],
  ["Hakim Ziyech", "Morocco", "RW/CAM", 83],
  ["Sofyan Amrabat", "Morocco", "DM", 80],
  ["Noussair Mazraoui", "Morocco", "RB/LB", 81],
  ["Nordin Amrabat", "Morocco", "RW", 75],
  ["Victor Wanyama", "Kenya", "DM", 77],
  ["Pierre-Emerick Aubameyang", "Gabon", "ST", 84],
  ["Sébastien Haller", "Ivory Coast", "ST", 81],
  ["Wilfried Bony", "Ivory Coast", "ST", 78],

  // #371 - #380
  ["Idrissa Gueye", "Senegal", "DM", 78],
  ["Cheikhou Kouyaté", "Senegal", "DM/CB", 75],
  ["Ismaïla Sarr", "Senegal", "RW", 79],
  ["Nicolas Jackson", "Senegal", "ST", 82],
  ["Patson Daka", "Zambia", "ST", 77],
  ["Wilfried Zaha", "Ivory Coast", "LW", 81],
  ["Franck Kessié", "Ivory Coast", "CM/DM", 82],
  ["Maxwel Cornet", "Ivory Coast", "LW/LB", 75],
  ["André Ayew", "Ghana", "LW/CAM", 78],
  ["Jordan Ayew", "Ghana", "ST/RW", 77],

  // #381 - #390
  ["Adriano", "Brazil", "ST", 90],
  ["Dida", "Brazil", "GK", 88],
  ["Júlio César", "Brazil", "GK", 87],
  ["Lúcio", "Brazil", "CB", 88],
  ["Maicon", "Brazil", "RB", 88],
  ["Dani Alves", "Brazil", "RB", 89],
  ["Marcelo", "Brazil", "LB", 88],
  ["Robinho", "Brazil", "LW", 84],
  ["Alexandre Pato", "Brazil", "ST", 79],
  ["Diego Ribas", "Brazil", "CAM", 82],

  // #391 - #400
  ["Hernanes", "Brazil", "CM/CAM", 80],
  ["Ramires", "Brazil", "CM", 82],
  ["Lucas Moura", "Brazil", "RW", 80],
  ["Willian", "Brazil", "RW/LW", 82],
  ["Oscar", "Brazil", "CAM", 81],
  ["Fred", "Brazil", "ST", 80],
  ["Fernandinho", "Brazil", "DM", 84],
  ["Paulinho", "Brazil", "CM", 78],
  ["Douglas Costa", "Brazil", "LW/RW", 82],
  ["Alex Sandro", "Brazil", "LB", 82],

    // #401 - #410
  ["Gareth Bale", "Wales", "RW/LW", 88],
  ["Ryan Giggs", "Wales", "LW", 90],
  ["Ian Rush", "Wales", "ST", 86],
  ["Mark Hughes", "Wales", "ST", 82],
  ["Aaron Ramsey", "Wales", "CM", 80],
  ["Gareth Barry", "England", "DM/CM", 79],
  ["Michael Owen", "England", "ST", 88],
  ["Wayne Rooney", "England", "ST/CAM", 91],
   ["David Platt", "England", "CM", 82],
  ["Paul Gascoigne", "England", "CAM", 87],

  // #411 - #420
  ["Paul Scholes", "England", "CM", 90],
  ["Roy Keane", "Ireland", "DM/CM", 89],
  ["Patrick Vieira", "France", "DM/CM", 92],
  ["Claude Makélélé", "France", "DM", 88],
  ["Eric Cantona", "France", "ST/CAM", 92],
  ["Robert Pirès", "France", "LW", 87],
  ["Nicolas Anelka", "France", "ST", 84],
  ["David Trezeguet", "France", "ST", 88],
  ["Franck Ribéry", "France", "LW", 89],
  ["Arjen Robben", "Netherlands", "RW", 91],

  // #421 - #430
  ["Robin van Persie", "Netherlands", "ST/LW", 90],
  ["Ruud van Nistelrooy", "Netherlands", "ST", 89],
  ["Clarence Seedorf", "Netherlands", "CM", 91],
  ["Edgar Davids", "Netherlands", "CM/DM", 87],
  ["Patrick Kluivert", "Netherlands", "ST", 87],
  ["Dennis Wise", "England", "CM", 80],
  ["John Terry", "England", "CB", 89],
  ["Rio Ferdinand", "England", "CB", 90],
  ["Ashley Cole", "England", "LB", 89],
  ["Gary Neville", "England", "RB", 84],

  // #431 - #440
  ["Peter Crouch", "England", "ST", 77],
  ["Jermain Defoe", "England", "ST", 83],
  ["Emile Heskey", "England", "ST", 78],
  ["Theo Walcott", "England", "RW", 79],
  ["Jack Wilshere", "England", "CM", 78],
  ["Joe Cole", "England", "RW/CAM", 84],
  ["David Bentley", "England", "RW", 76],
  ["Michael Carrick", "England", "DM/CM", 84],
  ["Jordan Henderson", "England", "CM", 80],
  ["James Milner", "England", "CM/RB", 80],

  // #441 - #450
  ["Zlatan Ibrahimović", "Sweden", "ST", 91],
  ["Henrik Larsson", "Sweden", "ST", 87],
  ["Freddie Ljungberg", "Sweden", "RW", 83],
  ["Andriy Shevchenko", "Ukraine", "ST", 91],
  ["Serhiy Rebrov", "Ukraine", "ST", 82],
  ["Pavel Nedvěd", "Czech Republic", "LM/CM", 91],
  ["Tomáš Rosický", "Czech Republic", "CAM", 84],
  ["Milan Baroš", "Czech Republic", "ST", 79],
  ["Marek Hamšík", "Slovakia", "CM/CAM", 84],
  ["Edin Džeko", "Bosnia and Herzegovina", "ST", 85],

    // #451 - #460
  ["Miralem Pjanić", "Bosnia and Herzegovina", "CM", 82],
  ["Sergej Barbarez", "Bosnia and Herzegovina", "ST", 80],
  ["Haris Seferović", "Switzerland", "ST", 78],
  ["Xherdan Shaqiri", "Switzerland", "RW", 81],
  ["Granit Xhaka", "Switzerland", "CM/DM", 84],
  ["Ricardo Rodríguez", "Switzerland", "LB", 78],
  ["Breel Embolo", "Switzerland", "ST", 80],
  ["Yann Sommer", "Switzerland", "GK", 82],
  ["Lars Stindl", "Germany", "CAM", 76],
  ["Mario Götze", "Germany", "CAM", 80],

  // #461 - #470
  ["Mesut Özil", "Germany", "CAM", 88],
  ["Miroslav Klose", "Germany", "ST", 89],
  ["Bastian Schweinsteiger", "Germany", "CM/DM", 88],
  ["Philipp Lahm", "Germany", "RB/LB", 91],
  ["Per Mertesacker", "Germany", "CB", 82],
  ["Mats Hummels", "Germany", "CB", 85],
  ["Benedikt Höwedes", "Germany", "CB/RB", 78],
  ["Shinji Kagawa", "Japan", "CAM", 82],
  ["Keisuke Honda", "Japan", "CAM/RW", 80],
  ["Takefusa Kubo", "Japan", "RW/CAM", 83],

  // #471 - #480
  ["Hidetoshi Nakata", "Japan", "CAM", 86],
  ["Shunsuke Nakamura", "Japan", "CM/CAM", 84],
  ["Makoto Hasebe", "Japan", "DM/CB", 78],
  ["Mário Jardel", "Brazil", "ST", 82], // pengganti Sonny Anderson
  ["Juninho Pernambucano", "Brazil", "CAM", 88],
  ["Cafu Júnior", "Brazil", "RB", 76],
  ["Alex de Souza", "Brazil", "CAM", 84],
  ["Djalminha", "Brazil", "CAM", 86],
  ["Zé Roberto", "Brazil", "CM/LB", 85],
  ["Gilberto Silva", "Brazil", "DM", 85],

  // #481 - #490
  ["Juan Román Riquelme", "Argentina", "CAM", 91],
  ["Pablo Aimar", "Argentina", "CAM", 85],
  ["Javier Pastore", "Argentina", "CAM", 80],
  ["Mauro Icardi", "Argentina", "ST", 82],
  ["Carlos Valderrama", "Colombia", "CAM", 88],
  ["Faustino Asprilla", "Colombia", "ST", 84],
  ["Iván Córdoba", "Colombia", "CB", 84],
  ["René Higuita", "Colombia", "GK", 83],
  ["Claudio Bravo", "Chile", "GK", 82],
  ["Arturo Vidal", "Chile", "CM/DM", 87],

  // #491 - #500
  ["Alexis Sánchez", "Chile", "ST/LW", 86],
  ["Marcelo Salas", "Chile", "ST", 85],
  ["Iván Zamorano", "Chile", "ST", 86],
  ["Gary Medel", "Chile", "CB/DM", 80],
  ["Sol Campbell", "England", "CB", 84], // pengganti James Milner
  ["David Ospina", "Colombia", "GK", 78],
  ["Keylor Navas", "Costa Rica", "GK", 86],
  ["Hugo Sánchez", "Mexico", "ST", 90],
  ["Jorge Campos", "Mexico", "GK", 82],
  ["Rafael Márquez", "Mexico", "CB/DM", 86],
];

const POSITION_PROFILES = {
  GK: {
    pace: 35,
    shooting: 15,
    passing: 55,
    dribbling: 35,
    defending: 45,
    physical: 65,
    awareness: 88,
    catching: 88,
    reflexes: 90,
    diving: 88,
    jumping: 75,
  },

  CB: {
    pace: 58,
    shooting: 30,
    passing: 55,
    dribbling: 40,
    defending: 90,
    physical: 88,
    awareness: 88,
    jumping: 82,
  },

  RB: {
    pace: 78,
    shooting: 45,
    passing: 70,
    dribbling: 65,
    defending: 78,
    physical: 76,
    awareness: 82,
    jumping: 72,
  },

  LB: {
    pace: 78,
    shooting: 45,
    passing: 70,
    dribbling: 65,
    defending: 78,
    physical: 76,
    awareness: 82,
    jumping: 72,
  },

  DM: {
    pace: 62,
    shooting: 45,
    passing: 82,
    dribbling: 60,
    defending: 84,
    physical: 82,
    awareness: 90,
  },

  CM: {
    pace: 68,
    shooting: 58,
    passing: 88,
    dribbling: 78,
    defending: 58,
    physical: 72,
    awareness: 88,
  },

  CAM: {
    pace: 72,
    shooting: 75,
    passing: 90,
    dribbling: 90,
    defending: 35,
    physical: 65,
    awareness: 90,
  },

  RW: {
    pace: 90,
    shooting: 78,
    passing: 78,
    dribbling: 92,
    defending: 30,
    physical: 65,
    awareness: 84,
  },

  LW: {
    pace: 90,
    shooting: 78,
    passing: 78,
    dribbling: 92,
    defending: 30,
    physical: 65,
    awareness: 84,
  },

  ST: {
    pace: 82,
    shooting: 94,
    passing: 58,
    dribbling: 82,
    defending: 25,
    physical: 88,
    awareness: 90,
  },

  CF: {
    pace: 78,
    shooting: 88,
    passing: 82,
    dribbling: 90,
    defending: 30,
    physical: 76,
    awareness: 92,
  },
};

const DEFAULT_PROFILE = {
  pace: 70,
  shooting: 60,
  passing: 70,
  dribbling: 70,
  defending: 50,
  physical: 65,
  awareness: 70,
};

const getRarityFromOverall = (overall) => {
  if (overall >= 90) return "Epic";
  if (overall >= 85) return "Rare";
  return "Standard";
};

// Ambil profile berdasarkan posisi.
// Kalau posisi kombinasi seperti CB/DM atau ST/LW,
// profile akan dirata-ratakan dari posisi yang tersedia.
const getPositionProfile = (position) => {
  if (POSITION_PROFILES[position]) {
    return POSITION_PROFILES[position];
  }

  const parts = position
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  const profiles = parts
    .map((part) => POSITION_PROFILES[part])
    .filter(Boolean);

  if (profiles.length === 0) {
    return DEFAULT_PROFILE;
  }

  const keys = Object.keys(DEFAULT_PROFILE);

  const blended = {};

  keys.forEach((key) => {
    const values = profiles
      .map((profile) => profile[key])
      .filter((value) => typeof value === "number");

    blended[key] =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : DEFAULT_PROFILE[key];
  });

  return blended;
};

const generateStats = (position, overall, rarity) => {
  const profile = getPositionProfile(position);

  const ovrAdjustment = overall - 80;

  const rarityBonus = {
    Standard: 0,
    Rare: 1,
    Epic: 2,
    Legendary: 3,
  }[rarity] ?? 0;

  const buildStat = (base) => {
    const value =
      base +
      ovrAdjustment * 0.65 +
      rarityBonus;

    return clamp(value, 1, 99);
  };

  const stats = {
    pace: buildStat(profile.pace),
    shooting: buildStat(profile.shooting),
    passing: buildStat(profile.passing),
    dribbling: buildStat(profile.dribbling),
    defending: buildStat(profile.defending),
    physical: buildStat(profile.physical),
  };

  if (position === "GK") {
    stats.awareness = buildStat(
      POSITION_PROFILES.GK.awareness
    );

    stats.catching = buildStat(
      POSITION_PROFILES.GK.catching
    );

    stats.reflexes = buildStat(
      POSITION_PROFILES.GK.reflexes
    );

    stats.diving = buildStat(
      POSITION_PROFILES.GK.diving
    );

    stats.jumping = buildStat(
      POSITION_PROFILES.GK.jumping
    );
  } else {
    if (profile.awareness !== undefined) {
      stats.awareness = buildStat(profile.awareness);
    }

    if (profile.jumping !== undefined) {
      stats.jumping = buildStat(profile.jumping);
    }
  }

  return stats;
};

const GENERATED_PLAYERS = REAL_PLAYER_DATA.map(
  ([name, nationality, position, overall], index) => {
    const rarity = getRarityFromOverall(overall);

    return makePlayer({
      id: `player_${String(index + 51).padStart(3, "0")}`,
      name,
      nationality,
      position,
      overall,
      rarity,
      stats: generateStats(
        position,
        overall,
        rarity
      ),
    });
  }
);

const PLAYERS = [
  ...LEGENDARY_PLAYERS,
  ...GENERATED_PLAYERS,
];


// ========================================
// DATABASE VALIDATOR
// ========================================

const normalizePlayerName = (name) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const validatePlayersDatabase = () => {
  const errors = [];

  // 1. Total player
  if (PLAYERS.length !== 500) {
    errors.push(
      `Total player salah: ${PLAYERS.length}/500`
    );
  }

  // 2. Legendary
  if (LEGENDARY_PLAYERS.length !== 50) {
    errors.push(
      `Legendary salah: ${LEGENDARY_PLAYERS.length}/50`
    );
  }

  // 3. Non legendary
  if (REAL_PLAYER_DATA.length !== 450) {
    errors.push(
      `Real player data salah: ${REAL_PLAYER_DATA.length}/450`
    );
  }

  // 4. Duplicate ID
  const idMap = new Map();

  PLAYERS.forEach((player) => {
    if (idMap.has(player.id)) {
      errors.push(
        `Duplicate ID: ${player.id}`
      );
    }

    idMap.set(player.id, true);
  });

  // 5. ID harus berurutan player_001 sampai player_500
  PLAYERS.forEach((player, index) => {
    const expectedId =
      `player_${String(index + 1).padStart(3, "0")}`;

    if (player.id !== expectedId) {
      errors.push(
        `ID salah: ${player.id}, seharusnya ${expectedId}`
      );
    }
  });

  // 6. Duplicate nama
  const nameMap = new Map();

  PLAYERS.forEach((player) => {
    const normalizedName =
      normalizePlayerName(player.name);

    if (nameMap.has(normalizedName)) {
      const previous =
        nameMap.get(normalizedName);

      errors.push(
        `Duplicate nama: ${player.name} (#${player.id}) ` +
        `sama dengan ${previous.name} (#${previous.id})`
      );
    }

    nameMap.set(normalizedName, player);
  });

  // 7. OVR valid
  PLAYERS.forEach((player) => {
    if (
      typeof player.overall !== "number" ||
      player.overall < 1 ||
      player.overall > 99
    ) {
      errors.push(
        `OVR invalid: ${player.name} = ${player.overall}`
      );
    }
  });

  // 8. Data dasar wajib ada
  PLAYERS.forEach((player) => {
    if (!player.name) {
      errors.push(
        `Nama kosong: ${player.id}`
      );
    }

    if (!player.nationality) {
      errors.push(
        `Nationality kosong: ${player.name}`
      );
    }

    if (!player.position) {
      errors.push(
        `Position kosong: ${player.name}`
      );
    }
  });

  if (errors.length > 0) {
    console.error(
      "❌ PLAYER DATABASE ERROR"
    );

    errors.forEach((error) => {
      console.error("•", error);
    });

    return false;
  }

  console.log(
    "✅ PLAYER DATABASE VALID"
  );

  console.log(
    `Total players: ${PLAYERS.length}`
  );

  console.log(
    `Legendary: ${LEGENDARY_PLAYERS.length}`
  );

  console.log(
    `Generated: ${GENERATED_PLAYERS.length}`
  );

  return true;
};

validatePlayersDatabase();

export { PLAYERS };
export default PLAYERS;