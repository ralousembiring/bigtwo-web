import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../firebase";
import { ref as dbRef, set as dbSet, update as dbUpdate, get, onValue, remove as dbRemove, onDisconnect } from "firebase/database";

const GOLD = "#C9A227", CREAM = "#F5EFE0", PANEL = "#24201C", SOFT = "#2A2520";
const W = 800, H = 500;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = Math.random;
const btn = (on) => ({
  padding: "9px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 900, color: CREAM,
  border: `1px solid ${on ? GOLD : "rgba(245,239,224,.2)"}`,
  background: on ? "rgba(201,162,39,.2)" : SOFT,
});
const box = { background: PANEL, borderRadius: 18, padding: 18, border: "1px solid rgba(201,162,39,.3)" };

/* ================= ENGINE (pemain = lingkaran, real-time) ================= */
// posisi default (fx, fy) untuk tim yang menyerang ke kanan
const DEF = [[.05,.5],[.2,.15],[.2,.38],[.2,.62],[.2,.85],[.4,.3],[.36,.5],[.4,.7],[.65,.18],[.7,.5],[.65,.82]];

function mkPlayers(team, base) {
  return base.map(([fx, fy], i) => {
    const x = (team ? 1 - fx : fx) * W, y = (team ? 1 - fy : fy) * H;
    return { team, i: i + team * 11, x, y, hx: x, hy: y,
      role: i === 0 ? "gk" : fx < .3 ? "def" : fx < .55 ? "mid" : "fwd" };
  });
}
// slot formasi game (x,y 0-100, menyerang ke atas) -> koordinat lapangan horizontal
const fromSlots = (slots) => slots ? slots.map((s) => [clamp((100 - s.y) / 100, .06, .85), clamp(s.x / 100, .1, .9)]) : DEF;

function initSim(slotsH, slotsA, T, gg) {
  const s = { ps: [...mkPlayers(0, fromSlots(slotsH)), ...mkPlayers(1, fromSlots(slotsA))],
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 }, owner: null, mode: "carry", poss: 0, score: [0, 0],
    min: 0, t: 0, pause: 1, decide: .6, flight: 0, trail: [], flash: null, ht: false, done: false, T, gg };
  reset(s, 0);
  return s;
}
function give(s, p) { s.owner = p.i; s.mode = "carry"; s.poss = p.team; s.decide = .5; }
function reset(s, team) {
  s.ps.forEach((p) => { p.x = p.hx; p.y = p.hy; });
  const mids = s.ps.filter((p) => p.team === team && p.role === "mid");
  const o = mids[Math.floor(rnd() * mids.length)] || s.ps[team * 11 + 5];
  o.x = W / 2; o.y = H / 2;
  s.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
  give(s, o);
}
function launch(s, team, tx, ty, spd, mode) {
  const b = s.ball, d = Math.hypot(tx - b.x, ty - b.y), ft = Math.max(.25, d / spd);
  b.vx = (tx - b.x) / ft; b.vy = (ty - b.y) / ft;
  s.flight = ft; s.mode = mode; s.poss = team; s.owner = null; s.lt = { x: tx, y: ty };
}
function passTo(s, o) {
  const dir = o.team ? -1 : 1;
  const c = s.ps.filter((p) => p.team === o.team && p.i !== o.i && p.role !== "gk")
    .map((p) => ({ p, sc: (p.x - o.x) * dir * .02 + rnd() * 1.5 - Math.hypot(p.x - o.x, p.y - o.y) * .004 }))
    .sort((a, b) => b.sc - a.sc)[0].p;
  launch(s, o.team, clamp(c.x + dir * 20, 15, W - 15), c.y, 340, "pass");
  s.target = c.i;
}
function shoot(s, o) {
  const pg = clamp(.17 + (s.T[o.team].atk - s.T[1 - o.team].def) / 220, .06, .42), r = rnd();
  s.out = r < pg ? "goal" : r < pg + .4 ? "save" : "miss";
  s.st = o.team;
  const gx = o.team ? 0 : W;
  const ty = s.out === "miss" ? (rnd() < .5 ? H * .3 : H * .7) + (rnd() - .5) * 40
    : H / 2 + (rnd() - .5) * (s.out === "goal" ? 80 : 50);
  s.ball.x = o.x; s.ball.y = o.y;
  launch(s, o.team, gx, ty, 430, "shot");
}
function land(s) {
  const ps = s.ps;
  if (s.mode === "pass") {
    const r = ps[s.target];
    const opp = ps.filter((p) => p.team !== r.team && p.role !== "gk")
      .sort((a, b) => Math.hypot(a.x - s.lt.x, a.y - s.lt.y) - Math.hypot(b.x - s.lt.x, b.y - s.lt.y))[0];
    const cut = Math.hypot(opp.x - s.lt.x, opp.y - s.lt.y) < 45 &&
      rnd() < clamp(.2 - (s.T[r.team].atk - s.T[1 - r.team].def) / 400, .05, .35);
    give(s, cut ? opp : r);
  } else if (s.mode === "gkroll") {
    give(s, ps[s.target]);
  } else if (s.out === "goal") {
    s.score[s.st]++; s.flash = { text: "⚽ GOAL!", t: 2 };
    if (s.gg) { s.done = true; return; }
    reset(s, 1 - s.st); s.pause = 1.8;
  } else {
    const gk = ps.find((p) => p.team === 1 - s.st && p.role === "gk");
    s.flash = { text: s.out === "save" ? "🧤 SAVE!" : "💨 MELESET", t: 1.2 };
    s.target = gk.i;
    launch(s, gk.team, gk.x, gk.y, 320, "gkroll");
  }
}
function step(s, dt) {
  if (s.done) return;
  if (s.flash) { s.flash.t -= dt; if (s.flash.t <= 0) s.flash = null; }
  if (s.hold) return;
  if (s.pause > 0) { s.pause -= dt; return; }
  s.min += dt * .9; s.t += dt;
  if (!s.ht && s.min >= 45) { s.ht = true; reset(s, 1); s.pause = 1.5; if (s.hb) { s.hold = true; s.flash = { text: "⏸ HALF TIME", t: 1e6 }; } else s.flash = { text: "BABAK KEDUA", t: 1.5 }; return; }
  if (s.min >= 90) { s.done = true; return; }
  const b = s.ball, ps = s.ps;
  if (s.mode === "carry") {
    const o = ps[s.owner], sv = Math.hypot(o.vx || 0, o.vy || 0), kb = Math.min(1, dt * 14);
    const hx = sv > 5 ? o.vx / sv : o.team ? -1 : 1, hy = sv > 5 ? o.vy / sv : 0;
    b.x += (o.x + hx * 9 - b.x) * kb; b.y += (o.y + hy * 9 - b.y) * kb;
    const gx = o.team ? 0 : W;
    for (const q of ps) {
      if (q.team !== o.team && Math.hypot(q.x - o.x, q.y - o.y) < 15 &&
        rnd() < dt * clamp(.6 + (s.T[q.team].def - s.T[o.team].atk) / 90, .2, 1.2)) { give(s, q); return; }
    }
    s.decide -= dt;
    if (s.decide <= 0) {
      const dg = Math.abs(o.x - gx);
      if (o.role === "gk" || (dg >= 190 && rnd() < .5)) passTo(s, o);
      else if (dg < 190 && rnd() < .62) shoot(s, o);
      else if (rnd() < .4) passTo(s, o);
      else s.decide = .4 + rnd() * .6;
    }
  } else {
    b.x += b.vx * dt; b.y += b.vy * dt; s.flight -= dt;
    if (s.flight <= 0) land(s);
  }
  s.trail.push({ x: b.x, y: b.y }); if (s.trail.length > 9) s.trail.shift();
  const nearest = [0, 1].map((t) => {
    let best = null, d = 1e9;
    for (const p of ps) if (p.team === t && p.role !== "gk") {
      const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < d) { d = dd; best = p.i; }
    }
    return best;
  });
  for (const p of ps) {
    let tx, ty, sp = 58;
    const dir = p.team ? -1 : 1, att = p.team === s.poss;
    if (p.i === s.owner) { tx = p.team ? 0 : W; ty = H / 2 + Math.sin(s.t * 1.7 + p.i) * 90; sp = 74; }
    else if (s.mode === "pass" && p.i === s.target) { tx = s.lt.x; ty = s.lt.y; sp = 115; }
    else if (p.role === "gk") {
      tx = p.hx; ty = s.mode === "shot" && p.team !== s.st ? s.lt.y : clamp(b.y, H * .38, H * .62);
      sp = s.mode === "shot" ? 95 : 40;
    } else {
      const push = att ? (p.role === "fwd" ? 110 : p.role === "mid" ? 70 : 35) : -(p.role === "fwd" ? 20 : 0);
      tx = p.hx + dir * push + (b.x - W / 2) * .22;
      ty = p.hy + (b.y - H / 2) * .18 + Math.sin(s.t * 1.3 + p.i) * 7;
      if (!att && p.i === nearest[p.team]) { tx = b.x; ty = b.y; sp = 72; }
    }
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
    const v = sp * (1 + (s.T[p.team].atk - 70) / 400) * Math.min(1, d / 30), k = Math.min(1, dt * 5);
    p.vx = (p.vx || 0) + ((dx / d) * v - (p.vx || 0)) * k;
    p.vy = (p.vy || 0) + ((dy / d) * v - (p.vy || 0)) * k;
    p.x = clamp(p.x + p.vx * dt, 12, W - 12); p.y = clamp(p.y + p.vy * dt, 12, H - 12);
  }
  for (let i = 0; i < 22; i++) for (let j = i + 1; j < 22; j++) {
    const a = ps[i], c = ps[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
    if (d > 0 && d < 24) { const f = ((24 - d) / d) * .25; a.x -= dx * f; a.y -= dy * f; c.x += dx * f; c.y += dy * f; }
  }
}
function draw(c, s, cols) {
  for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#1f5a2f" : "#246a36"; c.fillRect(i * W / 10, 0, W / 10, H); }
  c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2;
  c.strokeRect(10, 10, W - 20, H - 20);
  c.beginPath(); c.moveTo(W / 2, 10); c.lineTo(W / 2, H - 10); c.stroke();
  c.beginPath(); c.arc(W / 2, H / 2, 55, 0, 7); c.stroke();
  c.strokeRect(10, H / 2 - 110, 130, 220); c.strokeRect(W - 140, H / 2 - 110, 130, 220);
  c.strokeRect(10, H / 2 - 50, 45, 100); c.strokeRect(W - 55, H / 2 - 50, 45, 100);
  c.fillStyle = "#fff"; c.fillRect(2, H / 2 - 38, 8, 76); c.fillRect(W - 10, H / 2 - 38, 8, 76);
  s.trail.forEach((t, k) => { c.fillStyle = `rgba(255,255,255,${k / 30})`; c.beginPath(); c.arc(t.x, t.y, 4, 0, 7); c.fill(); });
  c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 10px Arial";
  for (const p of s.ps) {
    c.beginPath(); c.arc(p.x, p.y, 12, 0, 7); c.fillStyle = cols[p.team]; c.fill();
    const own = p.i === s.owner;
    c.lineWidth = own ? 3 : 1.5; c.strokeStyle = own ? GOLD : "#fff"; c.stroke();
    c.fillStyle = "#fff"; c.fillText(String((p.i % 11) + 1), p.x, p.y + .5);
  }
  const b = s.ball;
  c.beginPath(); c.arc(b.x, b.y, 6, 0, 7); c.fillStyle = "#fff"; c.fill(); c.lineWidth = 2; c.strokeStyle = "#111"; c.stroke();
  if (s.flash) {
    c.globalAlpha = Math.min(1, s.flash.t);
    c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(W / 2 - 170, H / 2 - 34, 340, 68);
    c.fillStyle = "#fff"; c.font = "bold 34px Arial"; c.fillText(s.flash.text, W / 2, H / 2);
    c.globalAlpha = 1;
  }
}

const tac = (t, o) => ({ atk: o + (t === "attack" ? 4 : t === "defense" ? -3 : 0), def: o + (t === "defense" ? 4 : t === "attack" ? -3 : 0) });

/* home/away: { name, ovr, tactic, color }  ·  onFinish({hg, ag, pen}) */
export function MatchCanvas({ home, away, slotsHome, slotsAway, goldenGoal, onFinish, publish, halftimeBreak, mySide = 0, renderHalftime }) {
  const cv = useRef(null), sim = useRef(null), spd = useRef(1), fin = useRef(onFinish);
  const [speed, setSpeed] = useState(1);
  const [ui, setUi] = useState({ a: 0, b: 0, m: 0, done: false, h: false });
  const [tacHt, setTacHt] = useState((mySide ? away : home).tactic);
  fin.current = onFinish;

  useEffect(() => {
    const s = (sim.current = initSim(slotsHome, slotsAway, [tac(home.tactic, home.ovr), tac(away.tactic, away.ovr)], !!goldenGoal));
    s.hb = !!halftimeBreak;
    const ctx = cv.current.getContext("2d"), cols = [home.color, away.color];
    let last = performance.now(), raf, key = "", lastPub = 0;
    const loop = (now) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const sd = dt * spd.current, n = Math.ceil(sd / .03) || 1;
      for (let i = 0; i < n; i++) step(s, sd / n);
      draw(ctx, s, cols);
      const k = `${s.score}|${Math.floor(s.min)}|${s.done}|${!!s.hold}`;
      if (k !== key) { key = k; setUi({ a: s.score[0], b: s.score[1], m: Math.min(90, Math.floor(s.min)), done: s.done, h: !!s.hold }); }
      if (publish && now - lastPub > 80 && !s.pubDone) { lastPub = now; publish(snap(s)); if (s.done) s.pubDone = true; }
      if (s.done && !s.rep) {
        s.rep = true;
        const pen = goldenGoal && s.score[0] === s.score[1] ? (rnd() < home.ovr / (home.ovr + away.ovr) ? 0 : 1) : null;
        setTimeout(() => fin.current({ hg: s.score[0], ag: s.score[1], pen }), 900);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const s = sim.current;
    if (!s || !s.hold || publish || mySide) return;
    s.T[0] = tac(tacHt, home.ovr);
    if (slotsHome) mkPlayers(0, fromSlots(slotsHome)).forEach((n, i) => { const q = s.ps[i]; q.hx = q.x = n.hx; q.hy = q.y = n.hy; q.role = n.role; });
    // eslint-disable-next-line
  }, [home.ovr, slotsHome]);

  const skip = () => { const s = sim.current; let g = 0; while (!s.done && g++ < 9000) step(s, .05); };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <b style={{ color: home.color === "#1e5bc6" ? "#7fb0ff" : home.color }}>{home.name} <small style={{ opacity: .6 }}>OVR {home.ovr}</small></b>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{ui.a} - {ui.b}</div>
        <b style={{ textAlign: "right" }}>{away.name} <small style={{ opacity: .6 }}>OVR {away.ovr}</small></b>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ color: GOLD, fontWeight: 900, minWidth: 80 }}>{ui.done ? "FULL TIME" : `⏱ ${ui.m}'`}</span>
        {!publish && [1, 2, 4].map((v) => (
          <button key={v} style={btn(speed === v)} onClick={() => { spd.current = v; setSpeed(v); }}>{v}x</button>
        ))}
        {!publish && !ui.done && <button style={btn(false)} onClick={skip}>⏭ Skip</button>}
      </div>
      <canvas ref={cv} width={W} height={H}
        style={{ width: "100%", display: "block", borderRadius: 16, border: "3px solid rgba(245,239,224,.25)" }} />
      {ui.h && !publish && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: SOFT, border: `1px solid ${GOLD}`, textAlign: "center" }}>
          <div style={{ color: GOLD, fontWeight: 900, marginBottom: 8 }}>⏸ HALF TIME — atur taktik babak kedua</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <Tac v={tacHt} on={(x) => { setTacHt(x); sim.current.T[mySide] = tac(x, (mySide ? away : home).ovr); }} />
          </div>
          {renderHalftime && renderHalftime()}
          <button style={btn(true)} onClick={() => { sim.current.hold = false; sim.current.flash = null; }}>▶ Mulai Babak Kedua</button>
        </div>
      )}
    </div>
  );
}

const Tac = ({ v, on }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {[["attack", "⚔️ Serang"], ["balanced", "⚖️ Seimbang"], ["defense", "🛡️ Bertahan"]].map(([k, l]) => (
      <button key={k} onClick={() => on(k)} style={btn(v === k)}>{l}</button>
    ))}
  </div>
);

/* ================= MODE LIGA (vs AI) ================= */
const KEY = "ralouFootballLeague_v1";
const AI = ["Jakarta United", "Golden Lions", "Nusantara XI", "Royal Strikers", "Metro Stars", "Red Falcons", "Garuda City"];
const COL = ["#1e5bc6", "#b72e35", "#d4a017", "#7b3fb0", "#1f9d8a", "#e0662b", "#c43a8f", "#4a7c2f"];

function newLeague(ovr) {
  const base = ovr || 70;
  return { round: 0, played: [], teams: [{ name: "RALOU FC", ovr: base, color: COL[0] },
    ...AI.map((n, i) => ({ name: n, ovr: clamp(base + Math.round((rnd() - .5) * 22), 50, 97), color: COL[i + 1] }))] };
}
function makeFixtures(n) {
  const ids = [...Array(n).keys()], rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const m = [];
    for (let i = 0; i < n / 2; i++) { const a = ids[i], b = ids[n - 1 - i]; m.push(r % 2 ? [b, a] : [a, b]); }
    rounds.push(m); ids.splice(1, 0, ids.pop());
  }
  return [...rounds, ...rounds.map((rd) => rd.map(([a, b]) => [b, a]))];
}
const goals = (x, y) => { let n = 0; for (let i = 0; i < 9; i++) if (rnd() < clamp(.13 + (x - y) / 300, .03, .35)) n++; return n; };
function table(L) {
  const t = L.teams.map((x, i) => ({ i, name: x.name, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }));
  for (const m of L.played) {
    const h = t[m.h], a = t[m.a];
    h.P++; a.P++; h.GF += m.hg; h.GA += m.ag; a.GF += m.ag; a.GA += m.hg;
    if (m.hg > m.ag) { h.W++; a.L++; h.Pts += 3; }
    else if (m.hg < m.ag) { a.W++; h.L++; a.Pts += 3; }
    else { h.D++; a.D++; h.Pts++; a.Pts++; }
  }
  return t.sort((x, y) => y.Pts - x.Pts || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF);
}

export function LeaguePanel({ teamOverall, slots, ready, onReward }) {
  const [L, setL] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem(KEY)); if (r?.teams) return r; } catch {}
    return newLeague(teamOverall);
  });
  const [live, setLive] = useState(null);
  const [msg, setMsg] = useState("");
  const [tacV, setTacV] = useState("balanced");
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(L)); } catch {} }, [L]);
  const fx = useMemo(() => makeFixtures(8), []);
  const over = L.round >= fx.length;
  const round = fx[L.round] || [];
  const mine = round.find(([h, a]) => h === 0 || a === 0);
  const tb = table(L);
  const ovrOf = (i) => (i === 0 ? teamOverall || L.teams[0].ovr : L.teams[i].ovr);

  function apply(hg, ag) {
    const res = round.map(([h, a]) => (h === 0 || a === 0 ? { h, a, hg, ag }
      : { h, a, hg: goals(ovrOf(h), ovrOf(a)), ag: goals(ovrOf(a), ovrOf(h)) }));
    const next = { ...L, round: L.round + 1, played: [...L.played, ...res] };
    const my = mine[0] === 0 ? [hg, ag] : [ag, hg];
    let reward = my[0] > my[1] ? 100 : my[0] === my[1] ? 50 : 25, text = my[0] > my[1] ? "MENANG" : my[0] === my[1] ? "SERI" : "KALAH";
    if (next.round >= fx.length && table(next)[0].i === 0) { reward += 500; text += " · 🏆 JUARA LIGA! +500 bonus"; }
    setL(next); onReward?.(reward);
    setMsg(`${text} ${my[0]}-${my[1]} · +${reward} 🪙`);
  }
  function start() {
    if (!ready) return setMsg("Isi 11 pemain di My Squad dulu.");
    const [h, a] = mine, t = L.teams;
    const mk = (i) => ({ name: t[i].name, color: t[i].color, ovr: ovrOf(i), tactic: i === 0 ? tacV : "balanced" });
    setLive({ h, a, home: mk(h), away: mk(a) });
  }
  function simRound() {
    if (!ready) return setMsg("Isi 11 pemain di My Squad dulu.");
    const [h, a] = mine; apply(goals(ovrOf(h), ovrOf(a)), goals(ovrOf(a), ovrOf(h)));
  }

  if (live) {
    return (
      <div style={box}>
        <MatchCanvas key={L.round} home={live.home} away={live.away} halftimeBreak mySide={live.h === 0 ? 0 : 1}
          slotsHome={live.h === 0 ? slots : null} slotsAway={live.a === 0 ? slots : null}
          onFinish={({ hg, ag }) => { apply(hg, ag); setLive(null); }} />
      </div>
    );
  }
  const th = { padding: "6px 8px", textAlign: "center", opacity: .7, fontSize: 12 };
  return (
    <div>
      <div style={{ ...box, marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>LIGA vs AI</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{over ? "Musim selesai" : `Pekan ${L.round + 1} / ${fx.length}`}</div>
        </div>
        {!over && <Tac v={tacV} on={setTacV} />}
        <div style={{ display: "flex", gap: 8 }}>
          {!over && <button style={btn(true)} onClick={start}>▶ Main (Auto-play)</button>}
          {!over && <button style={btn(false)} onClick={simRound}>⏭ Sim Pekan</button>}
          {over && <button style={btn(true)} onClick={() => { setL(newLeague(teamOverall)); setMsg(""); }}>🔄 Musim Baru</button>}
        </div>
      </div>
      {msg && <div style={{ ...box, marginBottom: 16, fontWeight: 800 }}>{msg}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <div style={box}>
          <h3 style={{ marginTop: 0, color: GOLD }}>🏆 Klasemen</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr><th style={th}>#</th><th style={{ ...th, textAlign: "left" }}>Tim</th>
              {["P", "W", "D", "L", "GD", "Pts"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{tb.map((r, k) => (
              <tr key={r.i} style={{ background: r.i === 0 ? "rgba(201,162,39,.16)" : k % 2 ? SOFT : "transparent", fontWeight: r.i === 0 ? 900 : 500 }}>
                <td style={{ ...th, opacity: 1, color: k === 0 ? GOLD : CREAM }}>{k + 1}</td>
                <td style={{ padding: "6px 8px" }}><span style={{ color: L.teams[r.i].color }}>●</span> {r.name}</td>
                {[r.P, r.W, r.D, r.L, r.GF - r.GA, r.Pts].map((v, j) => (
                  <td key={j} style={{ ...th, opacity: 1, color: j === 5 ? GOLD : CREAM }}>{v}</td>))}
              </tr>))}</tbody>
          </table>
        </div>
        <div style={box}>
          <h3 style={{ marginTop: 0, color: GOLD }}>📅 Jadwal Pekan {Math.min(L.round + 1, fx.length)}</h3>
          {over ? <div style={{ opacity: .7 }}>Juara: <b>{L.teams[tb[0].i].name}</b></div> : round.map(([h, a], k) => (
            <div key={k} style={{ padding: 10, borderRadius: 10, marginBottom: 8, background: h === 0 || a === 0 ? "rgba(201,162,39,.16)" : SOFT, display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
              <span>{L.teams[h].name}</span><span style={{ opacity: .5 }}>vs</span><span>{L.teams[a].name}</span>
            </div>))}
        </div>
      </div>
    </div>
  );
}

/* ================= PvP KICK-OFF (2 mode) ================= */
function LocalPvP({ myOvr, slots }) {
  const [mode, setMode] = useState("friendly");
  const [p1, setP1] = useState({ name: "Pemain 1", ovr: myOvr || 75, tactic: "balanced", color: "#1e5bc6" });
  const [p2, setP2] = useState({ name: "Pemain 2", ovr: 75, tactic: "balanced", color: "#b72e35" });
  const [live, setLive] = useState(0);
  const [res, setRes] = useState(null);

  const card = (p, set) => (
    <div style={box}>
      <input value={p.name} onChange={(e) => set({ ...p, name: e.target.value })}
        style={{ width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 10, background: SOFT, color: CREAM, border: `1px solid ${p.color}`, fontWeight: 900, marginBottom: 12 }} />
      <div style={{ marginBottom: 6, fontWeight: 800 }}>OVR: <span style={{ color: GOLD }}>{p.ovr}</span></div>
      <input type="range" min={55} max={99} value={p.ovr} onChange={(e) => set({ ...p, ovr: +e.target.value })} style={{ width: "100%", marginBottom: 12 }} />
      <Tac v={p.tactic} on={(t) => set({ ...p, tactic: t })} />
    </div>
  );
  let verdict = "";
  if (res) {
    verdict = res.hg > res.ag ? `${p1.name} menang!` : res.hg < res.ag ? `${p2.name} menang!`
      : res.pen != null ? `Seri — adu penalti dimenangkan ${res.pen ? p2.name : p1.name}` : "Pertandingan seri";
  }
  if (live) {
    return (
      <div style={box}>
        <MatchCanvas key={live} home={p1} away={p2} slotsHome={slots} goldenGoal={mode === "golden"} onFinish={setRes} />
        {res && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>🏆 {verdict}</div>
            <button style={{ ...btn(true), marginTop: 12 }} onClick={() => { setLive(0); setRes(null); }}>🔄 Main Lagi</button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div>
      <div style={{ ...box, marginBottom: 16 }}>
        <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>PvP KICK-OFF</div>
        <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
          <button style={btn(mode === "friendly")} onClick={() => setMode("friendly")}>⚽ Friendly 90 Menit</button>
          <button style={btn(mode === "golden")} onClick={() => setMode("golden")}>🥇 Golden Goal (gol pertama menang)</button>
        </div>
        <button style={btn(true)} onClick={() => { setRes(null); setLive((n) => n + 1); }}>▶ Kick-off!</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {card(p1, setP1)}{card(p2, setP2)}
      </div>
    </div>
  );
}

/* ================= PvP ONLINE (Firebase, host-authoritative) ================= */
// Host menjalankan simulasi; snapshot dikirim ~12x/detik, guest menginterpolasi supaya tetap mulus.
const snap = (s) => ({
  p: s.ps.flatMap((p) => [Math.round(p.x), Math.round(p.y)]), b: [Math.round(s.ball.x), Math.round(s.ball.y)],
  o: s.owner ?? -1, sc: s.score, m: Math.round(s.min * 10) / 10, f: s.flash ? s.flash.text : 0, d: s.done ? 1 : 0,
});
const uid = (() => {
  try {
    let v = sessionStorage.getItem("ralouRoomUid");
    if (!v) { v = "u_" + Date.now() + rnd().toString(36).slice(2, 8); sessionStorage.setItem("ralouRoomUid", v); }
    return v;
  } catch { return "u_" + rnd().toString(36).slice(2, 10); }
})();
const roomRef = (c) => dbRef(db, `footballRooms/${c}`);
const genCode = () => Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(rnd() * 32)]).join("");

function GuestView({ code, home, away }) {
  const cv = useRef(null), buf = useRef([]);
  const [ui, setUi] = useState({ a: 0, b: 0, m: 0, done: false });
  useEffect(() => {
    const un = onValue(dbRef(db, `footballRooms/${code}/snap`), (sn) => {
      const v = sn.val(); if (!v || !v.p) return;
      buf.current.push({ at: performance.now(), v }); if (buf.current.length > 14) buf.current.shift();
    });
    const ctx = cv.current.getContext("2d"), cols = [home.color, away.color];
    let raf, key = "", trail = [];
    const loop = (now) => {
      const B = buf.current;
      if (B.length) {
        const rt = now - 170, last = B[B.length - 1];
        let a = B[0], c = B[0];
        if (rt >= last.at) a = c = last;
        else if (rt > B[0].at) for (let k = 0; k < B.length - 1; k++) if (B[k].at <= rt && B[k + 1].at >= rt) { a = B[k]; c = B[k + 1]; }
        const f = a === c ? 0 : clamp((rt - a.at) / (c.at - a.at), 0, 1), L = (x, y) => x + (y - x) * f;
        const ps = Array.from({ length: 22 }, (_, n) => ({
          team: n < 11 ? 0 : 1, i: n, x: L(a.v.p[2 * n], c.v.p[2 * n]), y: L(a.v.p[2 * n + 1], c.v.p[2 * n + 1]) }));
        const ball = { x: L(a.v.b[0], c.v.b[0]), y: L(a.v.b[1], c.v.b[1]) };
        trail.push({ x: ball.x, y: ball.y }); if (trail.length > 9) trail.shift();
        draw(ctx, { ps, ball, owner: c.v.o, trail, flash: c.v.f ? { text: c.v.f, t: 1 } : null }, cols);
        const k = `${last.v.sc}|${Math.floor(last.v.m)}|${last.v.d}`;
        if (k !== key) { key = k; setUi({ a: last.v.sc[0], b: last.v.sc[1], m: Math.min(90, Math.floor(last.v.m)), done: !!last.v.d }); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); un(); };
    // eslint-disable-next-line
  }, []);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <b style={{ color: "#7fb0ff" }}>{home.name} <small style={{ opacity: .6 }}>OVR {home.ovr}</small></b>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{ui.a} - {ui.b}</div>
        <b style={{ textAlign: "right" }}>{away.name} <small style={{ opacity: .6 }}>OVR {away.ovr}</small></b>
      </div>
      <div style={{ color: GOLD, fontWeight: 900, marginBottom: 10 }}>{ui.done ? "FULL TIME" : `⏱ ${ui.m}'`} · 🌐 LIVE</div>
      <canvas ref={cv} width={W} height={H}
        style={{ width: "100%", display: "block", borderRadius: 16, border: "3px solid rgba(245,239,224,.25)" }} />
    </div>
  );
}

function OnlinePvP({ myOvr, slots }) {
  const [name, setName] = useState("Pemain");
  const [tacV, setTacV] = useState("balanced");
  const [code, setCode] = useState(""), [input, setInput] = useState("");
  const [room, setRoom] = useState(null), [err, setErr] = useState("");
  const leaving = useRef(false);
  const ovr = myOvr || 70;
  const role = room ? (room.host?.uid === uid ? "host" : "guest") : null;

  useEffect(() => {
    if (!code) return undefined;
    let seen = false;
    const un = onValue(roomRef(code), (sn) => {
      const v = sn.val();
      if (v) { seen = true; setRoom(v); }
      else if (seen && !leaving.current) { setRoom(null); setCode(""); setErr("Room ditutup oleh host."); }
    }, () => setErr("Gagal terhubung ke Firebase. Cek Rules untuk footballRooms."));
    return un;
  }, [code]);

  async function create(mode) {
    const c = genCode();
    try {
      await dbSet(roomRef(c), { mode, status: "waiting", round: 0, host: { uid, name, ovr, tactic: tacV } });
      onDisconnect(roomRef(c)).remove();
      leaving.current = false; setErr(""); setCode(c);
    } catch { setErr("Gagal membuat room. Cek Firebase Rules."); }
  }
  async function join() {
    const c = input.trim().toUpperCase();
    try {
      const v = (await get(roomRef(c))).val();
      if (!v) return setErr("Room tidak ditemukan.");
      if (v.guest || v.status !== "waiting") return setErr("Room sudah penuh atau sedang berjalan.");
      await dbUpdate(roomRef(c), { guest: { uid, name, ovr, tactic: tacV, slots: (slots || []).map((s) => [s.x, s.y]) } });
      onDisconnect(dbRef(db, `footballRooms/${c}/guest`)).remove();
      leaving.current = false; setErr(""); setCode(c);
    } catch { setErr("Gagal bergabung. Cek kode / Firebase Rules."); }
    return undefined;
  }
  async function leave() {
    leaving.current = true;
    const c = code;
    try { if (role === "host") await dbRemove(roomRef(c)); else await dbRemove(dbRef(db, `footballRooms/${c}/guest`)); } catch {}
    setCode(""); setRoom(null);
  }
  const setTac = (t) => { setTacV(t); if (code && role) dbUpdate(dbRef(db, `footballRooms/${code}/${role}`), { tactic: t }).catch(() => {}); };
  const publish = (sn) => dbSet(dbRef(db, `footballRooms/${code}/snap`), sn).catch(() => {});

  if (!room) {
    return (
      <div style={box}>
        <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>PvP ONLINE</div>
        <div style={{ display: "flex", gap: 10, margin: "12px 0", flexWrap: "wrap", alignItems: "center" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama"
            style={{ padding: 10, borderRadius: 10, background: SOFT, color: CREAM, border: `1px solid ${GOLD}`, fontWeight: 900 }} />
          <span style={{ fontWeight: 800 }}>OVR squad: <span style={{ color: GOLD }}>{ovr}</span></span>
        </div>
        <Tac v={tacV} on={setTacV} />
        <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap" }}>
          <button style={btn(true)} onClick={() => create("friendly")}>➕ Buat Room · Friendly 90'</button>
          <button style={btn(true)} onClick={() => create("golden")}>➕ Buat Room · Golden Goal</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="KODE ROOM" maxLength={4}
            style={{ width: 120, padding: 10, borderRadius: 10, background: SOFT, color: CREAM, border: "1px solid rgba(245,239,224,.3)", fontWeight: 900, letterSpacing: 4, textAlign: "center" }} />
          <button style={btn(false)} onClick={join}>🚪 Gabung</button>
        </div>
        {err && <div style={{ marginTop: 12, color: "#ff8f8f", fontWeight: 800 }}>{err}</div>}
      </div>
    );
  }

  const g = room.guest;
  if (room.status !== "waiting") {
    if (!g) return <div style={box}>Lawan keluar dari room. <button style={btn(true)} onClick={leave}>Keluar</button></div>;
    const R = room.result;
    const verdict = R && (R.hg > R.ag ? `${room.host.name} menang!` : R.hg < R.ag ? `${g.name} menang!`
      : R.pen >= 0 ? `Seri — penalti untuk ${R.pen ? g.name : room.host.name}` : "Pertandingan seri");
    const home = { ...room.host, color: "#1e5bc6" }, away = { ...g, color: "#b72e35" };
    return (
      <div style={box}>
        {role === "host"
          ? <MatchCanvas key={room.round || 0} home={home} away={away} slotsHome={slots} slotsAway={g.slots ? g.slots.map(([x, y]) => ({ x, y })) : null} goldenGoal={room.mode === "golden"} publish={publish}
              onFinish={(r) => dbUpdate(roomRef(code), { status: "finished", result: { hg: r.hg, ag: r.ag, pen: r.pen ?? -1 } }).catch(() => {})} />
          : <GuestView key={room.round || 0} code={code} home={home} away={away} />}
        {room.status === "finished" && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>🏆 {verdict}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
              {role === "host" && <button style={btn(true)} onClick={() => dbUpdate(roomRef(code), { status: "waiting", result: null, snap: null, round: (room.round || 0) + 1 })}>🔄 Main Lagi</button>}
              <button style={btn(false)} onClick={leave}>Keluar</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={box}>
      <div style={{ color: GOLD, fontSize: 12, fontWeight: 900, letterSpacing: 3 }}>LOBBY · {room.mode === "golden" ? "GOLDEN GOAL" : "FRIENDLY 90'"}</div>
      <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 8, margin: "8px 0" }}>{code}</div>
      <div style={{ opacity: .7, marginBottom: 14 }}>Bagikan kode ini ke temanmu.</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
        {[["🔵 Host", room.host], ["🔴 Guest", g]].map(([l, p]) => (
          <div key={l} style={{ background: SOFT, borderRadius: 12, padding: 12 }}>
            <div style={{ opacity: .6, fontSize: 12 }}>{l}</div>
            {p ? <><b>{p.name}</b> · OVR {p.ovr}<div style={{ fontSize: 12, opacity: .7 }}>Taktik: {p.tactic}</div></> : <i style={{ opacity: .6 }}>Menunggu lawan…</i>}
          </div>))}
      </div>
      <Tac v={(role === "host" ? room.host : g)?.tactic || tacV} on={setTac} />
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {role === "host" && <button disabled={!g} style={{ ...btn(true), opacity: g ? 1 : .45 }} onClick={() => dbUpdate(roomRef(code), { status: "playing" })}>▶ Kick-off!</button>}
        {role === "guest" && <span style={{ alignSelf: "center", opacity: .7 }}>Menunggu host memulai…</span>}
        <button style={btn(false)} onClick={leave}>Keluar</button>
      </div>
    </div>
  );
}

export function PvPPanel(props) {
  const [t, setT] = useState("online");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={btn(t === "online")} onClick={() => setT("online")}>🌐 Online</button>
        <button style={btn(t === "local")} onClick={() => setT("local")}>👥 Lokal</button>
      </div>
      {t === "online" ? <OnlinePvP {...props} /> : <LocalPvP {...props} />}
    </div>
  );
}

/* ================= TAB MATCH BARU (menggantikan MatchPanel lama) ================= */
export function QuickMatchPanel({ teamOverall, slots, ready, onRecord, formations = [], formation, onFormation, squad = {}, collection = [], counts = {}, getCard, canPlay, onSub }) {
  const [opp, setOpp] = useState(null), [n, setN] = useState(0), [tacV, setTacV] = useState("balanced"), [res, setRes] = useState(null);
  const start = () => {
    setOpp({ name: AI[Math.floor(rnd() * AI.length)], ovr: clamp(teamOverall + Math.floor(rnd() * 19) - 9, 55, 98), tactic: "balanced", color: "#b72e35" });
    setRes(null); setN((k) => k + 1);
  };
  function finish({ hg, ag }) {
    const r = hg > ag ? "WIN" : hg < ag ? "LOSS" : "DRAW", reward = r === "WIN" ? 80 : r === "DRAW" ? 45 : 25;
    setRes({ r, reward });
    onRecord({ opponent: opp.name, opponentOverall: opp.ovr, userOverall: teamOverall, userGoals: hg, oppGoals: ag, result: r, reward });
  }
  if (!opp) {
    return (
      <div style={{ ...box, textAlign: "center" }}>
        <div style={{ color: GOLD, fontSize: 13, fontWeight: 900, letterSpacing: 3 }}>AUTO MATCH</div>
        <h2>Pertandingan Cepat</h2>
        <p style={{ opacity: .7 }}>{ready ? "Pilih taktik lalu mulai. Pertandingan berjalan otomatis." : "Isi 11 pemain (termasuk GK) di My Squad dulu."}</p>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Tac v={tacV} on={setTacV} /></div>
        <button disabled={!ready} style={{ ...btn(true), opacity: ready ? 1 : .45 }} onClick={start}>🏟️ Mulai Match</button>
      </div>
    );
  }
  return (
    <div style={box}>
      <MatchCanvas key={n} home={{ name: "RALOU FC", ovr: teamOverall, tactic: tacV, color: "#1e5bc6" }} away={opp}
        slotsHome={slots} halftimeBreak onFinish={finish}
        renderHalftime={() => <HalftimeTools {...{ slots, formations, formation, onFormation, squad, collection, counts, getCard, canPlay, onSub }} />} />
      {res && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: res.r === "WIN" ? "#69d27c" : res.r === "LOSS" ? "#ff7777" : GOLD }}>
            {res.r === "WIN" ? "🏆 MENANG" : res.r === "LOSS" ? "💥 KALAH" : "🤝 SERI"} · +{res.reward} 🪙
          </div>
          <button style={{ ...btn(true), marginTop: 12 }} onClick={start}>🔄 Main Lagi</button>
        </div>
      )}
    </div>
  );
}

function HalftimeTools({ slots, formations, formation, onFormation, squad, collection, counts, getCard, canPlay, onSub }) {
  const [sel, setSel] = useState(null);
  if (!getCard || !slots) return null;
  const slot = slots.find((s) => s.id === sel);
  const cands = slot ? [...new Set(collection)].map(getCard).filter((c) => c && canPlay(c, slot.label) &&
    Object.entries(squad).filter(([id, cid]) => id !== sel && cid === c.id).length < (counts[c.id] || 0)) : [];
  return (
    <div style={{ textAlign: "left", marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
        {formations.map((f) => <button key={f} style={btn(f === formation)} onClick={() => { onFormation(f); setSel(null); }}>{f}</button>)}
      </div>
      <div style={{ color: GOLD, fontSize: 11, fontWeight: 900, marginBottom: 6 }}>PILIH POSISI YANG MAU DIGANTI</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
        {slots.map((s) => {
          const c = squad[s.id] ? getCard(squad[s.id]) : null;
          return (
            <button key={s.id} style={{ ...btn(sel === s.id), textAlign: "left" }} onClick={() => setSel(s.id)}>
              <div style={{ fontSize: 10, color: GOLD }}>{s.label}</div>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c?.name || "Kosong"}</div>
              {c && <small style={{ opacity: .65 }}>OVR {c.overall}</small>}
            </button>
          );
        })}
      </div>
      {slot && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {cands.length ? cands.map((c) => (
            <button key={c.id} style={btn(false)} onClick={() => { onSub(sel, c.id); setSel(null); }}>{c.name} · {c.position} · {c.overall}</button>
          )) : <i style={{ opacity: .65 }}>Tidak ada pengganti yang cocok.</i>}
        </div>
      )}
    </div>
  );
}
