import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import { db } from "./firebase";
import {
  ref,
  onValue,
  runTransaction,
  set,
} from "firebase/database";

/* =========================================================
   BOARD DATA
========================================================= */

const DEF_LAD = {
  4: 25,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const DEF_SNK = {
  97: 78,
  92: 73,
  62: 19,
  54: 34,
  47: 26,
  16: 6,
};

const SC = [
  ["#7b2cbf", "#3c096c", "#e0c3fc"],
  ["#1d6fd8", "#0c3670", "#c8defa"],
  ["#0f9d8a", "#064d44", "#c7f5ee"],
  ["#d81b60", "#6b0c2f", "#ffc2d9"],
  ["#2b3a4a", "#0e161f", "#c5d1de"],
  ["#c1121f", "#5c0a10", "#ffd1d5"],
];

const COL = [
  "#ff4d6d",
  "#3a86ff",
  "#06d6a0",
  "#7209b7",
];

const OFF = [
  [-13, -9],
  [13, -9],
  [-13, 10],
  [13, 10],
];

const FACE = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const K =
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0.25
    : 1;

const row = (n) => Math.floor((n - 1) / 10);

const c = (n) => {
  if (!n) return [50, 1030];

  const r = row(n);
  const k = (n - 1) % 10;
  const cl = r % 2 ? 9 - k : k;

  return [
    cl * 100 + 50,
    (9 - r) * 100 + 50,
  ];
};

/* =========================================================
   RANDOM BOARD
========================================================= */

function gen() {
  const used = new Set([1, 100]);
  const L = {};
  const S = {};

  const r = (m) =>
    1 + Math.floor(Math.random() * m);

  let g = 0;

  while (Object.keys(L).length < 8 && g++ < 3000) {
    const a = r(88) + 1;
    const b =
      a +
      10 * r(4) +
      r(9) -
      4;

    if (
      b < 100 &&
      row(b) > row(a) &&
      !used.has(a) &&
      !used.has(b)
    ) {
      L[a] = b;
      used.add(a);
      used.add(b);
    }
  }

  g = 0;

  while (Object.keys(S).length < 6 && g++ < 3000) {
    const h = r(87) + 12;
    const t =
      h -
      (10 * r(5) + r(7) - 3);

    if (
      t >= 2 &&
      row(t) < row(h) &&
      !used.has(h) &&
      !used.has(t)
    ) {
      S[h] = t;
      used.add(h);
      used.add(t);
    }
  }

  return {
    LAD: L,
    SNK: S,
  };
}

/* =========================================================
   BUILD BOARD
========================================================= */

function buildBoard(LAD, SNK) {
  let s =
    '<rect width="1000" height="1070" rx="14" fill="#3a2a08"/>';

  const SP = {};

  for (let n = 1; n <= 100; n++) {
    const [x, y] = c(n);

    const f =
      n === 100
        ? "#ff9f1c"
        : (row(n) + Math.floor(x / 100)) % 2
        ? "#e6b93f"
        : "#f8df8e";

    s += `
      <rect
        x="${x - 46}"
        y="${y - 46}"
        width="92"
        height="92"
        rx="14"
        fill="${f}"
      />

      <text
        x="${x - 37}"
        y="${y - 22}"
        font-size="21"
        font-weight="800"
        fill="#7a5a10"
      >
        ${n}
      </text>
    `;
  }

  s += `
    <text
      x="120"
      y="1042"
      font-size="26"
      font-weight="800"
      fill="#e6b93f"
    >
      Mulai di sini
    </text>

    <polygon
      transform="translate(50 62) scale(1.1)"
      points="0,-22 6,-7 22,-6 10,4 14,20 0,11 -14,20 -10,4 -22,-6 -6,-7"
      fill="#fff3c4"
      stroke="#8a5a00"
      stroke-width="2"
    />
  `;

  for (const a in LAD) {
    const [x1, y1] = c(+a);
    const [x2, y2] = c(LAD[a]);

    const dx = x2 - x1;
    const dy = y2 - y1;

    const len = Math.hypot(dx, dy);

    const nx = (-dy / len) * 15;
    const ny = (dx / len) * 15;

    const ln = (o, w, col) => `
      <line
        x1="${x1 + o * nx}"
        y1="${y1 + o * ny}"
        x2="${x2 + o * nx}"
        y2="${y2 + o * ny}"
        stroke="${col}"
        stroke-width="${w}"
      />
    `;

    s += `
      <g stroke-linecap="round">
        ${ln(1, 13, "#3d2208")}
        ${ln(-1, 13, "#3d2208")}
    `;

    for (
      let d = 20;
      d < len - 8;
      d += 34
    ) {
      const u = d / len;

      const px = x1 + dx * u;
      const py = y1 + dy * u;

      s += `
        <line
          x1="${px + nx}"
          y1="${py + ny}"
          x2="${px - nx}"
          y2="${py - ny}"
          stroke="#6b4423"
          stroke-width="8"
        />
      `;
    }

    s += `
        ${ln(1, 6, "#c98a4b")}
        ${ln(-1, 6, "#c98a4b")}
      </g>
    `;
  }

  let si = 0;

  for (const a in SNK) {
    const [x1, y1] = c(+a);
    const [x2, y2] = c(SNK[a]);

    const dx = x2 - x1;
    const dy = y2 - y1;

    const len = Math.hypot(dx, dy);

    const nx = -dy / len;
    const ny = dx / len;

    const W = Math.max(
      1,
      Math.round(len / 220)
    );

    const pts = [];

    for (let i = 0; i <= 48; i++) {
      const t = i / 48;

      const o =
        Math.sin(
          t * Math.PI * 2 * W
        ) *
        26 *
        Math.min(1, t / 0.1);

      pts.push([
        x1 + dx * t + nx * o,
        y1 + dy * t + ny * o,
      ]);
    }

    SP[a] = pts;

    const [co, da, li] =
      SC[si++ % 6];

    const d =
      "M" +
      pts
        .map((p) =>
          p
            .map((v) =>
              v.toFixed(1)
            )
            .join(" ")
        )
        .join("L");

    const ang =
      (Math.atan2(
        pts[0][1] - pts[3][1],
        pts[0][0] - pts[3][0]
      ) *
        180) /
      Math.PI;

    s += `
      <g
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="${d}"
          stroke="${da}"
          stroke-width="30"
        />

        <path
          d="${d}"
          stroke="${co}"
          stroke-width="22"
        />

        <path
          d="${d}"
          stroke="${li}"
          stroke-width="7"
          stroke-dasharray="1 17"
          opacity=".9"
        />
      </g>

      <g
        transform="
          translate(${pts[0][0]} ${pts[0][1]})
          rotate(${ang})
        "
      >
        <path
          d="M26 0L44 0M44 0l9-6M44 0l9 6"
          stroke="#ff2b4a"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
        />

        <ellipse
          rx="27"
          ry="21"
          fill="${da}"
        />

        <ellipse
          rx="24"
          ry="18"
          fill="${co}"
        />

        <circle
          cx="8"
          cy="-10"
          r="6.5"
          fill="#fff"
        />

        <circle
          cx="8"
          cy="10"
          r="6.5"
          fill="#fff"
        />

        <circle
          cx="10"
          cy="-10"
          r="3"
          fill="#111"
        />

        <circle
          cx="10"
          cy="10"
          r="3"
          fill="#111"
        />
      </g>
    `;
  }

  return {
    html: s,
    SP,
    LAD,
    SNK,
  };
}

/* =========================================================
   CSS
========================================================= */

const CSS = `
.sl{
  --bg:#f6ecd0;
  --panel:#fffaf0;
  --ink:#3a2a08;
  --mute:#7a6537;
  --gold:#e0a100;

  background:var(--bg);
  color:var(--ink);

  font-family:'Baloo 2',system-ui,sans-serif;

  min-height:100vh;
}

@media(prefers-color-scheme:dark){
  .sl{
    --bg:#1e1606;
    --panel:#33260c;
    --ink:#fbeec4;
    --mute:#c9b374;
  }
}

.sl *{
  box-sizing:border-box;
}

.sl .wrap{
  max-width:1000px;
  margin:0 auto;
  padding:12px;

  display:grid;

  grid-template-columns:
    minmax(0,1fr)
    270px;

  gap:16px;

  align-items:start;
}

@media(max-width:760px){
  .sl .wrap{
    grid-template-columns:1fr;
  }
}

.sl h1{
  margin:0 0 6px;
  font-size:30px;
  font-weight:800;
  grid-column:1/-1;
}

.sl .board{
  position:relative;
  background:#3a2a08;
  padding:10px;
  border-radius:24px;
  box-shadow:0 12px 30px #0005;
}

.sl svg{
  display:block;
  width:100%;
  height:auto;
}

.sl svg text{
  font-family:'Baloo 2',system-ui,sans-serif;
}

.sl .side{
  background:var(--panel);
  border-radius:22px;
  padding:16px;

  display:grid;
  gap:12px;

  box-shadow:0 6px 18px #0003;
}

.sl .pl{
  display:flex;
  align-items:center;
  gap:10px;

  padding:6px 12px;

  border-radius:14px;
  border:3px solid transparent;
}

.sl .pl.on{
  border-color:var(--gold);
}

.sl .pl span:last-child{
  margin-left:auto;
  color:var(--mute);
  font-size:14px;
}

.sl .dot{
  width:22px;
  height:22px;

  border-radius:50%;

  border:3px solid #fff;

  box-shadow:
    0 0 0 1px #0004;
}

.sl .die{
  width:88px;
  height:88px;

  background:#fff;

  border-radius:20px;

  box-shadow:
    inset 0 -5px 0 #0002,
    0 8px 16px #0003;

  display:grid;

  grid-template:
    repeat(3,1fr)/
    repeat(3,1fr);

  padding:13px;

  justify-self:center;
}

.sl .die i{
  width:15px;
  height:15px;

  border-radius:50%;

  background:#3a2a08;

  place-self:center;

  visibility:hidden;
}

.sl .die i.on{
  visibility:visible;
}

.sl .die.roll{
  animation:slsh .55s;
}

@keyframes slsh{
  0%{
    transform:rotate(0) translateY(0);
  }

  25%{
    transform:rotate(-25deg) translateY(-14px);
  }

  50%{
    transform:rotate(20deg) translateY(0);
  }

  75%{
    transform:rotate(-12deg) translateY(-8px);
  }

  100%{
    transform:rotate(0);
  }
}

.sl button{
  font:inherit;
  font-weight:800;

  border-radius:14px;
  border:0;

  padding:10px 14px;

  cursor:pointer;
}

.sl button:disabled{
  opacity:.45;
  cursor:default;
}

.sl #go{
  background:var(--gold);
  color:#2e2000;

  font-size:18px;

  box-shadow:
    0 4px 0 #9a6f00;
}

.sl #go:active:not(:disabled){
  transform:translateY(3px);

  box-shadow:
    0 1px 0 #9a6f00;
}

.sl .ghost{
  background:#0001;
  color:var(--ink);
}

.sl .row{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}

.sl .row3{
  display:grid;
  grid-template-columns:
    1fr 1fr 1fr;

  gap:8px;
}

.sl .row3 button{
  padding:10px 6px;
}

.sl button:focus-visible{
  outline:
    3px solid #3a86ff;

  outline-offset:2px;
}

.sl .msg{
  min-height:48px;
  text-align:center;
  font-weight:600;
}

.sl .note{
  font-size:13px;
  color:var(--mute);
  margin:0;
}

.sl .win{
  position:absolute;

  inset:0;

  display:grid;
  place-items:center;

  background:#1e1606cc;

  border-radius:24px;

  text-align:center;

  color:#fff;

  z-index:5;
}

.sl .win div{
  display:grid;
  gap:12px;
  justify-items:center;
}

.sl .win b{
  font-size:34px;
}

.sl .cf{
  position:absolute;

  inset:0;

  width:100%;
  height:100%;

  pointer-events:none;

  z-index:6;
}

.sl .room-screen{
  min-height:100dvh;

  background:#1a1310;

  color:#F5EFE0;

  display:flex;

  align-items:center;
  justify-content:center;

  padding:20px;

  font-family:system-ui,sans-serif;
}

.sl .room-card{
  width:100%;
  max-width:520px;

  background:
    linear-gradient(
      145deg,
      #2b211b,
      #201813
    );

  border:
    1px solid
    rgba(201,162,39,.5);

  border-radius:22px;

  padding:30px 26px;

  text-align:center;

  box-shadow:
    0 18px 50px
    rgba(0,0,0,.35);
}

.sl .room-title{
  color:#C9A227;

  font-family:Georgia,serif;

  font-size:40px;
  font-weight:700;

  margin-bottom:6px;
}

.sl .room-subtitle{
  color:#F5EFE0;

  opacity:.72;

  font-size:14px;

  line-height:1.5;

  max-width:390px;

  margin:0 auto 24px;
}

.sl .room-input-box{
  background:rgba(0,0,0,.18);

  border-radius:16px;

  padding:14px;

  margin-bottom:14px;
}

.sl .room-label{
  color:#C9A227;

  font-size:11px;
  font-weight:800;

  letter-spacing:1.5px;

  margin-bottom:8px;
}

.sl .room-input{
  width:100%;
  height:54px;

  box-sizing:border-box;

  padding:0 16px;

  border-radius:11px;

  border:
    1px solid
    rgba(201,162,39,.75);

  background:#17110d;

  color:#F5EFE0;

  outline:none;

  text-align:center;

  font-size:17px;

  font-weight:700;

  letter-spacing:3px;
}

.sl .room-main-btn{
  width:100%;
  height:52px;

  border:none;

  border-radius:11px;

  background:#C9A227;

  color:#17100c;

  font-weight:800;

  font-size:15px;

  cursor:pointer;

  box-shadow:
    0 6px 18px
    rgba(201,162,39,.18);
}

.sl .room-back{
  margin-top:14px;

  width:100%;
  height:44px;

  background:transparent;

  color:#F5EFE0;

  border:
    1px solid
    rgba(245,239,224,.22);

  border-radius:11px;

  font-size:13px;

  cursor:pointer;
}

.sl .lobby{
  grid-column:1/-1;

  background:
    linear-gradient(
      145deg,
      #2a211c,
      #201813
    );

  border:
    1px solid
    rgba(201,162,39,.28);

  border-radius:18px;

  padding:18px;

  color:#F5EFE0;

  box-shadow:
    0 10px 28px
    rgba(0,0,0,.2);
}

.sl .lobby-title{
  text-align:center;
  margin-bottom:16px;
}

.sl .lobby-title b{
  color:#C9A227;
  font-size:16px;
}

.sl .lobby-title div{
  color:#F5EFE0;
  opacity:.62;
  font-size:12px;
  margin-top:4px;
}

.sl .name-input{
  width:100%;
  height:46px;

  padding:0 13px;

  border-radius:10px;

  border:
    1px solid
    rgba(201,162,39,.55);

  background:#17110d;

  color:#F5EFE0;

  outline:none;

  margin-bottom:14px;

  font-size:14px;
}

.sl .seats{
  display:grid;

  grid-template-columns:
    repeat(2,minmax(0,1fr));

  gap:10px;
}

.sl .seat{
  background:rgba(0,0,0,.22);

  border:
    1px solid
    rgba(245,239,224,.09);

  border-radius:13px;

  padding:13px;

  text-align:center;
}

.sl .seat.occupied{
  background:
    rgba(201,162,39,.08);

  border:
    1px solid
    rgba(201,162,39,.28);
}

.sl .seat-label{
  color:#C9A227;

  font-size:11px;
  font-weight:800;

  letter-spacing:1px;
}

.sl .seat-name{
  color:#F5EFE0;

  font-size:14px;
  font-weight:700;

  margin:7px 0 10px;

  min-height:20px;
}

.sl .seat-empty{
  color:#8e887f;
  font-size:11px;
}

.sl .seat-btn{
  background:#C9A227;
  color:#2e2000;

  border:0;

  padding:6px 10px;

  border-radius:10px;

  font-size:11px;
}

.sl .lobby-info{
  margin-top:14px;

  padding:10px 12px;

  border-radius:10px;

  background:
    rgba(255,255,255,.035);

  color:#aaa197;

  font-size:11px;

  line-height:1.45;

  text-align:center;
}

.sl .lobby-start{
  text-align:center;
  margin-top:15px;
}

.sl .start-btn{
  background:#C9A227;
  color:#17100c;

  border:0;

  border-radius:12px;

  padding:10px 18px;

  font-size:14px;
}

.sl .top-room{
  grid-column:1/-1;

  background:
    linear-gradient(
      145deg,
      #2b211b,
      #211812
    );

  border:
    1px solid
    rgba(201,162,39,.35);

  border-radius:18px;

  padding:16px 18px;

  text-align:center;

  box-shadow:
    0 10px 28px
    rgba(0,0,0,.22);
}

.sl .top-room-title{
  color:#C9A227;

  font-family:Georgia,serif;

  font-size:22px;
  font-weight:700;
}

.sl .top-room-code{
  margin-top:4px;

  color:#F5EFE0;

  font-size:13px;

  opacity:.75;
}

.sl .top-room-link{
  margin-top:10px;

  color:#b9b0a4;

  font-size:11px;

  line-height:1.45;

  word-break:break-all;
}

.sl .top-room-link div{
  margin-top:5px;

  color:#F5EFE0;

  opacity:.82;

  background:rgba(0,0,0,.2);

  border-radius:8px;

  padding:7px 9px;
}

.sl .hub-btn{
  margin-top:11px;

  background:transparent;

  color:#F5EFE0;

  border:
    1px solid
    rgba(245,239,224,.22);

  border-radius:9px;

  padding:8px 13px;

  font-size:12px;
}

@media(prefers-reduced-motion:reduce){
  .sl .die.roll{
    animation:none;
  }
}

@media(max-width:760px){
  .sl .top-room,
  .sl .lobby{
    grid-column:1;
  }
}

@media(max-width:520px){
  .sl .wrap{
    padding:9px;
  }

  .sl .room-title{
    font-size:34px;
  }

  .sl .room-card{
    padding:24px 18px;
  }

  .sl .seats{
    grid-template-columns:1fr 1fr;
  }
}

@media(max-width:380px){
  .sl .seats{
    grid-template-columns:1fr;
  }
}
`;

/* =========================================================
   RANDOM ROOM
========================================================= */

function randomRoomCode() {
  return Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();
}

/* =========================================================
   MAIN GAME
========================================================= */

export function UlarTangga() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const urlRoom =
    params.get("room") || "";

  const [roomId, setRoomId] =
    useState(urlRoom);

  const [roomInput, setRoomInput] =
    useState(urlRoom);

  const [joined, setJoined] =
    useState(!!urlRoom);

  const [players, setPlayers] =
    useState([
      null,
      null,
      null,
      null,
    ]);

  const [game, setGame] =
    useState(null);

  const [mySeat, setMySeat] =
    useState(null);

  const [nameDraft, setNameDraft] =
    useState("");

  const [error, setError] =
    useState("");

  const [layout, setLayout] =
    useState({
      LAD: DEF_LAD,
      SNK: DEF_SNK,
    });

  const [face, setFace] =
    useState(1);

  const [rolling, setRolling] =
    useState(false);

  const [mute, setMute] =
    useState(false);

  const [resetKey, setResetKey] =
    useState(0);

  const R = useRef({
    gid: 0,
  });

  const P = useRef([]);

  const B = useRef([]);

  const cv = useRef(null);

  const AC = useRef(null);

  const muteR = useRef(false);

  const botTimer =
    useRef(null);

  const lastMoveRef =
    useRef(null);

  const board = useMemo(
    () =>
      buildBoard(
        layout.LAD,
        layout.SNK
      ),
    [layout]
  );

  const names = useMemo(
    () =>
      players.map(
        (p, i) =>
          p?.name ||
          `Bot ${i + 1}`
      ),
    [players]
  );

  /* =====================================================
     PLAYER ID
  ===================================================== */

  const getPlayerId = useCallback(
    () => {
      let id =
        sessionStorage.getItem(
          "rgames_snakes_player_id"
        );

      if (!id) {
        id =
          "p_" +
          Math.random()
            .toString(36)
            .slice(2) +
          Date.now();

        sessionStorage.setItem(
          "rgames_snakes_player_id",
          id
        );
      }

      return id;
    },
    []
  );

  /* =====================================================
     URL
  ===================================================== */

  function enterRoom(id) {
    const clean =
      id.trim().toUpperCase() ||
      randomRoomCode();

    setRoomId(clean);
    setRoomInput(clean);
    setJoined(true);
    setError("");

    const url =
      new URL(
        window.location.href
      );

    url.searchParams.set(
      "game",
      "snakes"
    );

    url.searchParams.set(
      "room",
      clean
    );

    window.history.replaceState(
      {},
      "",
      url
    );
  }

  function backToGameHub() {
    const url =
      new URL(
        window.location.href
      );

    url.search = "";

    window.history.pushState(
      {},
      "",
      url
    );

    window.dispatchEvent(
      new PopStateEvent(
        "popstate"
      )
    );
  }

  /* =====================================================
     FIREBASE LISTENER
  ===================================================== */

  useEffect(() => {
    if (!joined || !roomId) return;

    const playersRef = ref(
      db,
      `snakesRooms/${roomId}/players`
    );

    const gameRef = ref(
      db,
      `snakesRooms/${roomId}/game`
    );

    const boardRef = ref(
      db,
      `snakesRooms/${roomId}/board`
    );

    const unsubPlayers =
      onValue(
        playersRef,
        (snap) => {
          const val =
            snap.val();

          const arr = [
            null,
            null,
            null,
            null,
          ];

          if (val) {
            for (
              let i = 0;
              i < 4;
              i++
            ) {
              arr[i] =
                val[i] || null;
            }
          }

          setPlayers(arr);

          const id =
            getPlayerId();

          const seat =
            arr.findIndex(
              (p) =>
                p &&
                p.id === id &&
                !p.isBot
            );

          if (seat >= 0) {
            setMySeat(seat);
          }
        }
      );

    const unsubGame =
      onValue(
        gameRef,
        (snap) => {
          setGame(
            snap.val()
          );
        }
      );

    const unsubBoard =
      onValue(
        boardRef,
        (snap) => {
          const val =
            snap.val();

          if (
            val &&
            val.LAD &&
            val.SNK
          ) {
            setLayout({
              LAD: val.LAD,
              SNK: val.SNK,
            });
          }
        }
      );

    return () => {
      unsubPlayers();
      unsubGame();
      unsubBoard();
    };
  }, [
    joined,
    roomId,
    getPlayerId,
  ]);

  /* =====================================================
     RESTORE MY NAME / SEAT
  ===================================================== */

  useEffect(() => {
    if (!roomId) return;

    const savedName =
      sessionStorage.getItem(
        "rgames_snakes_name"
      );

    if (savedName) {
      setNameDraft(savedName);
    }
  }, [roomId]);

  /* =====================================================
     AUDIO
  ===================================================== */

  const tone = (
    f,
    d = 0.12,
    t = "sine",
    v = 0.12,
    f2
  ) => {
    if (muteR.current) return;

    try {
      AC.current =
        AC.current ||
        new (
          window.AudioContext ||
          window.webkitAudioContext
        )();

      const a = AC.current;
      const o =
        a.createOscillator();
      const g =
        a.createGain();

      const n =
        a.currentTime;

      o.type = t;

      o.frequency.setValueAtTime(
        f,
        n
      );

      if (f2) {
        o.frequency.exponentialRampToValueAtTime(
          f2,
          n + d
        );
      }

      g.gain.setValueAtTime(
        v,
        n
      );

      g.gain.exponentialRampToValueAtTime(
        0.001,
        n + d
      );

      o.connect(g);
      g.connect(a.destination);

      o.start(n);
      o.stop(n + d);
    } catch (e) {
      /* audio unavailable */
    }
  };

  const arp = (
    fs,
    gap
  ) => {
    fs.forEach(
      (f, i) =>
        setTimeout(
          () =>
            tone(
              f,
              0.18,
              "triangle",
              0.13
            ),
          i * gap
        )
    );
  };

  /* =====================================================
     TOKEN ANIMATION
  ===================================================== */

  const place = (
    i,
    x,
    y,
    lift
  ) => {
    P.current[i]?.setAttribute(
      "transform",
      `translate(${x + OFF[i][0]} ${
        y + OFF[i][1]
      })`
    );

    B.current[i]?.setAttribute(
      "transform",
      `translate(0 ${-lift})`
    );
  };

  const tw = (
    ms,
    fn
  ) =>
    new Promise(
      (resolve) => {
        const t0 =
          performance.now();

        (function tick(t) {
          const p =
            Math.min(
              1,
              (t - t0) /
                (ms * K)
            );

          fn(p);

          if (p < 1) {
            requestAnimationFrame(
              tick
            );
          } else {
            resolve();
          }
        })(t0);
      }
    );

  const sleep = (ms) =>
    new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          ms * K
        )
    );

  const hop = async (
    i,
    a,
    b
  ) => {
    const [x1, y1] =
      c(a);

    const [x2, y2] =
      c(b);

    tone(
      480 +
        (b % 10) * 25,
      0.09,
      "triangle"
    );

    await tw(
      240,
      (p) =>
        place(
          i,
          x1 +
            (x2 - x1) *
              p,
          y1 +
            (y2 - y1) *
              p,
          Math.sin(
            p * Math.PI
          ) * 40
        )
    );
  };

  const glide = async (
    i,
    pts,
    ms
  ) => {
    await tw(
      ms,
      (p) => {
        const e =
          p < 0.5
            ? 2 * p * p
            : 1 -
              2 *
                (1 - p) **
                  2;

        const f =
          e *
          (pts.length - 1);

        const j =
          Math.min(
            pts.length - 2,
            Math.floor(f)
          );

        const u =
          f - j;

        place(
          i,
          pts[j][0] +
            (pts[j + 1][0] -
              pts[j][0]) *
              u,
          pts[j][1] +
            (pts[j + 1][1] -
              pts[j][1]) *
              u,
          0
        );
      }
    );
  };

  /* =====================================================
     CONFETTI
  ===================================================== */

  const confetti = () => {
    const el = cv.current;

    if (
      K < 1 ||
      !el
    ) {
      return;
    }

    const x =
      el.getContext("2d");

    const cs = [
      "#ffd166",
      "#ef476f",
      "#06d6a0",
      "#3a86ff",
      "#fff",
    ];

    el.width =
      el.clientWidth;

    el.height =
      el.clientHeight;

    const ps =
      Array.from(
        { length: 150 },
        () => ({
          x:
            Math.random() *
            el.width,

          y:
            -Math.random() *
            el.height *
            0.7,

          vx:
            (Math.random() -
              0.5) *
            3,

          vy:
            2 +
            Math.random() *
              4,

          r:
            4 +
            Math.random() *
              6,

          c:
            cs[
              (Math.random() *
                5) |
                0
            ],

          a:
            Math.random() *
            6,
        })
      );

    let t = 0;

    (function f() {
      x.clearRect(
        0,
        0,
        el.width,
        el.height
      );

      if (++t > 280) {
        return;
      }

      ps.forEach(
        (p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.a += 0.15;

          x.fillStyle =
            p.c;

          x.save();

          x.translate(
            p.x,
            p.y
          );

          x.rotate(
            p.a
          );

          x.fillRect(
            -p.r,
            -p.r / 2,
            p.r * 2,
            p.r
          );

          x.restore();
        }
      );

      requestAnimationFrame(
        f
      );
    })();
  };

  /* =====================================================
     ROLL ANIMATION
  ===================================================== */

  const rollVisual = async (
    finalNumber
  ) => {
    setRolling(true);

    for (
      let k = 0;
      k < 7;
      k++
    ) {
      const n =
        k === 6
          ? finalNumber
          : 1 +
            Math.floor(
              Math.random() *
                6
            );

      setFace(n);

      tone(
        200 +
          Math.random() *
            250,
        0.05,
        "square",
        0.04
      );

      await sleep(75);
    }

    setFace(finalNumber);

    setRolling(false);
  };

  /* =====================================================
     PLAY ANIMATION FROM FIREBASE
  ===================================================== */

  useEffect(() => {
    if (
      !game ||
      !game.lastMove ||
      !game.lastMove.id
    ) {
      return;
    }

    const move =
      game.lastMove;

    if (
      lastMoveRef.current ===
      move.id
    ) {
      return;
    }

    lastMoveRef.current =
      move.id;

    let cancelled = false;

    (async () => {
      await rollVisual(
        move.dice
      );

      if (cancelled) {
        return;
      }

      setFace(move.dice);

      const actor =
        move.player;

      let current =
        move.from;

      const target =
        move.land;

      for (
        let n =
          current + 1;
        n <= target;
        n++
      ) {
        if (cancelled)
          return;

        await hop(
          actor,
          current,
          n
        );

        current = n;
      }

      if (
        move.type ===
        "ladder"
      ) {
        setTimeout(() => {
          if (!cancelled) {
            setGame((g) =>
              g
                ? {
                    ...g,
                    message:
                      "Naik tangga!",
                  }
                : g
            );
          }
        }, 0);

        arp(
          [
            392,
            494,
            587,
            784,
            988,
          ],
          110
        );

        await sleep(300);

        await glide(
          actor,
          [
            c(move.land),
            c(move.final),
          ],
          900
        );
      }

      if (
        move.type ===
        "snake"
      ) {
        tone(
          700,
          1.2,
          "sawtooth",
          0.09,
          90
        );

        await sleep(300);

        await glide(
          actor,
          move.path ||
            [
              c(move.land),
              c(move.final),
            ],
          1300
        );
      }

      place(
        actor,
        ...c(move.final),
        0
      );

      if (
        game.winner ===
        actor
      ) {
        arp(
          [
            523,
            659,
            784,
            1047,
            784,
            1047,
            1319,
          ],
          140
        );

        confetti();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [game?.lastMove?.id]);

  /* =====================================================
     INITIAL TOKEN POSITIONS
  ===================================================== */

  useEffect(() => {
    for (
      let i = 0;
      i < 4;
      i++
    ) {
      const pos =
        game?.pos?.[i] || 0;

      place(
        i,
        ...c(pos),
        0
      );
    }
  }, [
    resetKey,
    roomId,
  ]);

  /* =====================================================
     ROOM PLAYER HELPERS
  ===================================================== */

  const occupiedSeats =
    players
      .map((p, i) =>
        p ? i : null
      )
      .filter(
        (i) =>
          i !== null
      );

  const hostSeat =
    occupiedSeats.length
      ? Math.min(
          ...occupiedSeats
        )
      : null;

  const amIHost =
    mySeat !== null &&
    mySeat === hostSeat;

  const inLobby =
    mySeat === null;

  const gameReady =
    game &&
    game.phase !==
      "lobby";

  /* =====================================================
     SIT DOWN
  ===================================================== */

  async function sitDown(
    seat
  ) {
    if (
      !nameDraft.trim()
    ) {
      setError(
        "Isi nama dulu ya."
      );

      return;
    }

    const cleanName =
      nameDraft
        .trim()
        .slice(0, 18);

    sessionStorage.setItem(
      "rgames_snakes_name",
      cleanName
    );

    const playerId =
      getPlayerId();

    const seatRef =
      ref(
        db,
        `snakesRooms/${roomId}/players/${seat}`
      );

    const result =
      await runTransaction(
        seatRef,
        (current) => {
          if (current) {
            return;
          }

          return {
            id: playerId,
            name: cleanName,
            isBot: false,
          };
        }
      );

    if (
      !result.committed
    ) {
      setError(
        "Kursi itu baru saja diisi orang lain, pilih kursi lain."
      );

      return;
    }

    setMySeat(seat);
    setError("");
  }

  /* =====================================================
     START GAME
  ===================================================== */

  async function startGame() {
    if (!amIHost) return;

    const playersRef =
      ref(
        db,
        `snakesRooms/${roomId}/players`
      );

    const snap =
      await new Promise(
        (resolve) => {
          onValue(
            playersRef,
            resolve,
            {
              onlyOnce: true,
            }
          );
        }
      );

    const current =
      snap.val() || {};

    const finalPlayers =
      [
        0,
        1,
        2,
        3,
      ].map((i) => {
        if (current[i]) {
          return current[i];
        }

        return {
          id:
            `bot_${roomId}_${i}`,
          name:
            `Bot ${i + 1}`,
          isBot: true,
        };
      });

    await set(
      playersRef,
      finalPlayers
    );

    const boardRef =
      ref(
        db,
        `snakesRooms/${roomId}/board`
      );

    await set(
      boardRef,
      layout
    );

    const gameRef =
      ref(
        db,
        `snakesRooms/${roomId}/game`
      );

    await set(
      gameRef,
      {
        phase: "playing",

        pos: [
          0,
          0,
          0,
          0,
        ],

        currentPlayer: 0,

        dice: 1,

        winner: null,

        message:
          "Giliran Pemain 1. Lempar dadu!",

        lastMove: null,

        startedAt:
          Date.now(),
      }
    );
  }

  /* =====================================================
     CALCULATE SNAKE PATH
  ===================================================== */

  function makeSnakePath(
    from,
    to
  ) {
    const points =
      board.SP[from];

    if (
      points &&
      points.length
    ) {
      return points;
    }

    return [
      c(from),
      c(to),
    ];
  }

  /* =====================================================
     HUMAN ROLL
  ===================================================== */

  async function play() {
    if (
      !game ||
      game.phase !==
        "playing" ||
      mySeat === null ||
      game.currentPlayer !==
        mySeat
    ) {
      return;
    }

    const gameRef =
      ref(
        db,
        `snakesRooms/${roomId}/game`
      );

    let moveId =
      `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;

    await runTransaction(
      gameRef,
      (current) => {
        if (
          !current ||
          current.phase !==
            "playing" ||
          current.currentPlayer !==
            mySeat
        ) {
          return;
        }

        const d =
          1 +
          Math.floor(
            Math.random() * 6
          );

        const from =
          current.pos[
            mySeat
          ] || 0;

        let land =
          from + d;

        if (
          land > 100
        ) {
          return {
            ...current,

            dice: d,

            message:
              `${names[mySeat]} butuh angka pas untuk sampai di 100`,

            lastMove: {
              id: moveId,
              player: mySeat,
              dice: d,
              from,
              land: from,
              final: from,
              type: "none",
            },

            currentPlayer:
              d === 6
                ? mySeat
                : (mySeat + 1) %
                  4,
          };
        }

        let final =
          land;

        let type =
          "normal";

        let path = null;

        if (
          layout.LAD[land]
        ) {
          final =
            layout.LAD[
              land
            ];

          type = "ladder";
        } else if (
          layout.SNK[land]
        ) {
          final =
            layout.SNK[
              land
            ];

          type = "snake";

          path =
            makeSnakePath(
              land,
              final
            );
        }

        const winner =
          final === 100
            ? mySeat
            : null;

        let nextPlayer =
          mySeat;

        if (
          winner !== null
        ) {
          nextPlayer =
            mySeat;
        } else if (
          d === 6
        ) {
          nextPlayer =
            mySeat;
        } else {
          nextPlayer =
            (mySeat + 1) %
            4;
        }

        return {
          ...current,

          pos: current.pos.map(
            (p, i) =>
              i === mySeat
                ? final
                : p
          ),

          dice: d,

          winner,

          phase:
            winner !== null
              ? "over"
              : "playing",

          currentPlayer:
            nextPlayer,

          message:
            winner !== null
              ? `${names[mySeat]} menang!`
              : d === 6
              ? `${names[mySeat]} mendapat 6. Lempar lagi!`
              : `${names[nextPlayer]} mendapat giliran.`,

          lastMove: {
            id: moveId,
            player: mySeat,
            dice: d,
            from,
            land,
            final,
            type,
            path,
          },
        };
      }
    );
  }

  /* =====================================================
     BOT TURN
  ===================================================== */

  useEffect(() => {
    if (
      !amIHost ||
      !game ||
      game.phase !==
        "playing"
    ) {
      return;
    }

    const actor =
      game.currentPlayer;

    if (
      !players[actor]?.isBot
    ) {
      return;
    }

    botTimer.current =
      setTimeout(
        async () => {
          const gameRef =
            ref(
              db,
              `snakesRooms/${roomId}/game`
            );

          const moveId =
            `bot_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2)}`;

          await runTransaction(
            gameRef,
            (current) => {
              if (
                !current ||
                current.phase !==
                  "playing" ||
                current.currentPlayer !==
                  actor
              ) {
                return;
              }

              const d =
                1 +
                Math.floor(
                  Math.random() *
                    6
                );

              const from =
                current.pos[
                  actor
                ] || 0;

              let land =
                from + d;

              if (
                land > 100
              ) {
                const nextPlayer =
                  d === 6
                    ? actor
                    : (actor + 1) %
                      4;

                return {
                  ...current,

                  dice: d,

                  currentPlayer:
                    nextPlayer,

                  message:
                    `${names[actor]} butuh angka pas untuk sampai di 100`,

                  lastMove: {
                    id: moveId,
                    player: actor,
                    dice: d,
                    from,
                    land: from,
                    final: from,
                    type: "none",
                  },
                };
              }

              let final =
                land;

              let type =
                "normal";

              let path = null;

              if (
                layout.LAD[
                  land
                ]
              ) {
                final =
                  layout.LAD[
                    land
                  ];

                type =
                  "ladder";
              } else if (
                layout.SNK[
                  land
                ]
              ) {
                final =
                  layout.SNK[
                    land
                  ];

                type =
                  "snake";

                path =
                  makeSnakePath(
                    land,
                    final
                  );
              }

              const winner =
                final ===
                100
                  ? actor
                  : null;

              const nextPlayer =
                winner !==
                null
                  ? actor
                  : d === 6
                  ? actor
                  : (actor + 1) %
                    4;

              return {
                ...current,

                pos:
                  current.pos.map(
                    (p, i) =>
                      i === actor
                        ? final
                        : p
                  ),

                dice: d,

                winner,

                phase:
                  winner !==
                  null
                    ? "over"
                    : "playing",

                currentPlayer:
                  nextPlayer,

                message:
                  winner !==
                  null
                    ? `${names[actor]} menang!`
                    : d === 6
                    ? `${names[actor]} mendapat 6. Lempar lagi!`
                    : `${names[nextPlayer]} mendapat giliran.`,

                lastMove: {
                  id: moveId,
                  player: actor,
                  dice: d,
                  from,
                  land,
                  final,
                  type,
                  path,
                },
              };
            }
          );
        },
        900
      );

    return () =>
      clearTimeout(
        botTimer.current
      );
  }, [
    game,
    players,
    amIHost,
    roomId,
    layout,
    names,
  ]);

  /* =====================================================
     RESET / PLAY AGAIN
  ===================================================== */

  async function playAgain() {
    if (!amIHost) return;

    const gameRef =
      ref(
        db,
        `snakesRooms/${roomId}/game`
      );

    await set(
      gameRef,
      {
        phase: "playing",

        pos: [
          0,
          0,
          0,
          0,
        ],

        currentPlayer: 0,

        dice: 1,

        winner: null,

        message:
          "Giliran Pemain 1. Lempar dadu!",

        lastMove: null,

        startedAt:
          Date.now(),
      }
    );

    lastMoveRef.current =
      null;

    setResetKey(
      (k) => k + 1
    );

    setFace(1);
  }

  /* =====================================================
     RANDOM BOARD
  ===================================================== */

  async function randomBoard() {
    if (!amIHost) return;

    const newLayout =
      gen();

    setLayout(
      newLayout
    );

    await set(
      ref(
        db,
        `snakesRooms/${roomId}/board`
      ),
      newLayout
    );
  }

  /* =====================================================
     MUTE
  ===================================================== */

  function toggleMute() {
    const next =
      !mute;

    muteR.current =
      next;

    setMute(next);
  }

  /* =====================================================
     ROOM SCREEN
  ===================================================== */

  if (!joined) {
    return (
      <div
  className="sl room-screen"
  style={{
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
        <style>
          {`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap');${CSS}`}
        </style>

        <div className="room-card">
          <div className="room-title">
            🐍 Ular Tangga
          </div>

          <div className="room-subtitle">
            Masukkan kode room untuk
            bermain dengan teman, atau
            kosongkan untuk membuat room
            baru.
          </div>

          <div className="room-input-box">
            <div className="room-label">
              KODE ROOM
            </div>

            <input
              value={roomInput}
              onChange={(e) =>
                setRoomInput(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="Contoh: A7K2P9"
              maxLength={8}
              className="room-input"
            />
          </div>

          <button
            type="button"
            className="room-main-btn"
            onClick={() =>
              enterRoom(roomInput)
            }
          >
            {roomInput.trim()
              ? "Gabung Room"
              : "Buat Room Baru"}
          </button>

          <button
            type="button"
            className="room-back"
            onClick={
              backToGameHub
            }
          >
            ← Kembali ke Game Hub
          </button>
        </div>
      </div>
    );
  }

  const over =
    game?.phase ===
    "over";

  /* =====================================================
     MAIN GAME UI
  ===================================================== */

  return (
    <div className="sl">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&display=swap');${CSS}`}
      </style>

      <div className="wrap">

        <div className="top-room">
          <div className="top-room-title">
            🐍 Ular Tangga
          </div>

          <div className="top-room-code">
            Room{" "}
            <strong
              style={{
                color: "#C9A227",
              }}
            >
              {roomId}
            </strong>
          </div>

          <div className="top-room-link">
            Bagikan link ini ke temanmu:

            <div>
              {window.location.href}
            </div>
          </div>

          <button
            type="button"
            className="hub-btn"
            onClick={
              backToGameHub
            }
          >
            ← Game Hub
          </button>
        </div>

        {inLobby && (
          <div className="lobby">

            <div className="lobby-title">
              <b>
                Pilih Kursi
              </b>

              <div>
                Masukkan nama lalu pilih
                kursi yang kosong.
              </div>
            </div>

            <input
              value={nameDraft}
              onChange={(e) =>
                setNameDraft(
                  e.target.value
                )
              }
              placeholder="Nama kamu"
              maxLength={18}
              className="name-input"
            />

            <div className="seats">
              {[0, 1, 2, 3].map(
                (seat) => {
                  const occupied =
                    !!players[seat];

                  return (
                    <div
                      key={seat}
                      className={
                        "seat" +
                        (occupied
                          ? " occupied"
                          : "")
                      }
                    >
                      <div className="seat-label">
                        KURSI{" "}
                        {seat + 1}
                      </div>

                      <div className="seat-name">
                        {players[
                          seat
                        ]?.name ||
                          "Kosong"}
                      </div>

                      {!occupied ? (
                        <button
                          className="seat-btn"
                          onClick={() =>
                            sitDown(
                              seat
                            )
                          }
                        >
                          Duduk
                        </button>
                      ) : (
                        <div className="seat-empty">
                          Sudah ditempati
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            {error && (
              <div
                style={{
                  color:
                    "#E08080",
                  background:
                    "rgba(224,128,128,0.08)",
                  border:
                    "1px solid rgba(224,128,128,0.2)",
                  borderRadius: 9,
                  padding:
                    "9px 11px",
                  fontSize: 12,
                  marginTop: 12,
                }}
              >
                {error}
              </div>
            )}

            <div className="lobby-info">
              Setelah host memulai,
              kursi kosong otomatis
              menjadi bot.
            </div>
          </div>
        )}

        {!inLobby &&
          !gameReady && (
            <div className="lobby">

              <div className="lobby-title">
                <b>
                  Lobby
                </b>

                <div>
                  Kamu duduk di Kursi{" "}
                  {mySeat + 1}.
                  {amIHost
                    ? " Kamu adalah host."
                    : " Menunggu host memulai game..."}
                </div>
              </div>

              <div className="seats">
                {[0, 1, 2, 3].map(
                  (seat) => {
                    const occupied =
                      !!players[
                        seat
                      ];

                    return (
                      <div
                        key={seat}
                        className={
                          "seat" +
                          (occupied
                            ? " occupied"
                            : "")
                        }
                      >
                        <div className="seat-label">
                          KURSI{" "}
                          {seat + 1}
                        </div>

                        <div className="seat-name">
                          {players[
                            seat
                          ]?.name ||
                            "BOT"}
                        </div>

                        {!occupied && (
                          <div className="seat-empty">
                            Akan dimainkan
                            bot
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="lobby-info">
                Kursi kosong otomatis
                diisi bot saat game
                dimulai.
              </div>

              {amIHost && (
                <div className="lobby-start">
                  <button
                    className="start-btn"
                    onClick={
                      startGame
                    }
                  >
                    Mulai Game
                  </button>
                </div>
              )}
            </div>
          )}

        {gameReady && (
          <>
            <h1>
              Ular Tangga
            </h1>

            <div className="board">

              <svg
                viewBox="0 0 1000 1070"
                role="img"
                aria-label="Papan ular tangga"
              >
                <g
                  dangerouslySetInnerHTML={{
                    __html:
                      board.html,
                  }}
                />

                {[0, 1, 2, 3].map(
                  (i) => (
                    <g
                      key={i}
                      ref={(el) =>
                        (P.current[i] =
                          el)
                      }
                      style={{
                        display:
                          i <
                          players.length
                            ? ""
                            : "none",
                      }}
                    >
                      <ellipse
                        cy="22"
                        rx="15"
                        ry="5"
                        fill="#0005"
                      />

                      <g
                        ref={(el) =>
                          (B.current[i] =
                            el)
                        }
                      >
                        <path
                          d="
                            M-14 18
                            Q-14 -2 0 -5
                            Q14 -2 14 18
                            Z
                          "
                          fill={
                            COL[i]
                          }
                          stroke="#fff"
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />

                        <circle
                          cy="-15"
                          r="10"
                          fill={
                            COL[i]
                          }
                          stroke="#fff"
                          strokeWidth="3"
                        />

                        <circle
                          cx="-4"
                          cy="-16"
                          r="1.8"
                          fill="#fff"
                        />

                        <circle
                          cx="4"
                          cy="-16"
                          r="1.8"
                          fill="#fff"
                        />
                      </g>
                    </g>
                  )
                )}
              </svg>

              {over && (
                <div className="win">
                  <div>
                    <b>
                      🎉{" "}
                      {
                        names[
                          game.winner
                        ]
                      }{" "}
                      menang!
                    </b>

                    {amIHost ? (
                      <button
                        style={{
                          background:
                            "#e0a100",
                          color:
                            "#2e2000",
                        }}
                        onClick={
                          playAgain
                        }
                      >
                        Main lagi
                      </button>
                    ) : (
                      <div
                        style={{
                          fontSize: 13,
                          opacity: 0.8,
                        }}
                      >
                        Menunggu host
                        memulai lagi...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <canvas
                ref={cv}
                className="cf"
              />
            </div>

            <div className="side">

              <div>
                {names.map(
                  (nm, i) => (
                    <div
                      key={i}
                      className={
                        "pl" +
                        (game.currentPlayer ===
                          i &&
                        !over
                          ? " on"
                          : "")
                      }
                    >
                      <span
                        className="dot"
                        style={{
                          background:
                            COL[i],
                        }}
                      />

                      <b>
                        {nm}
                      </b>

                      <span>
                        {game.pos?.[
                          i
                        ]
                          ? "Kotak " +
                            game.pos[
                              i
                            ]
                          : "Belum mulai"}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div
                className={
                  "die" +
                  (rolling
                    ? " roll"
                    : "")
                }
              >
                {Array.from(
                  {
                    length: 9,
                  },
                  (_, k) => (
                    <i
                      key={k}
                      className={
                        FACE[
                          face
                        ]?.includes(
                          k
                        )
                          ? "on"
                          : ""
                      }
                    />
                  )
                )}
              </div>

              <div
                className="msg"
                aria-live="polite"
              >
                {game.message}
              </div>

              <button
                id="go"
                onClick={
                  play
                }
                disabled={
                  game.currentPlayer !==
                    mySeat ||
                  over ||
                  rolling
                }
              >
                Lempar dadu
              </button>

              <div className="row">
                <button
                  className="ghost"
                  disabled={
                    !amIHost ||
                    over
                  }
                  onClick={
                    randomBoard
                  }
                >
                  Acak papan
                </button>

                <button
                  className="ghost"
                  onClick={
                    toggleMute
                  }
                >
                  Suara:{" "}
                  {mute
                    ? "mati"
                    : "nyala"}
                </button>
              </div>

              {amIHost && (
                <button
                  className="ghost"
                  disabled={
                    !over
                  }
                  onClick={
                    playAgain
                  }
                >
                  Main ulang
                </button>
              )}

              <p className="note">
                Tangga membawa naik,
                ular membawa turun.
                Angka 6 dapat giliran
                lagi. Kotak 100 harus
                dicapai dengan angka
                pas.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}