import React from "react";

const GOLD = "#C9A227";
const CREAM = "#F5EFE0";
const BG = "#17110E";
const PANEL = "#24201C";

export default function HomeHub() {
  function navigate(game) {
    const url = new URL(window.location.href);

    url.search = `?game=${game}`;

    window.history.pushState({}, "", url);

    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  const cardStyle = {
    width: "100%",
    minHeight: 175,
    boxSizing: "border-box",

    background: PANEL,
    border: `1px solid rgba(201,162,39,0.35)`,
    borderRadius: 18,

    padding: "24px 20px",

    color: CREAM,
    cursor: "pointer",

    textAlign: "left",

    transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",

    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",

    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",

        boxSizing: "border-box",

        background:
          "radial-gradient(circle at top, #2b2118 0%, #17110E 45%, #100c0a 100%)",

        color: CREAM,

        padding: "40px 20px 60px",

        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* =========================================
          HEADER
      ========================================= */}

      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",

          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: 4,

            color: GOLD,

            fontWeight: 700,

            marginBottom: 10,
          }}
        >
          RALOU
        </div>

        <h1
          style={{
            margin: 0,

            fontSize: "clamp(36px, 6vw, 64px)",

            fontWeight: 900,

            letterSpacing: -2,

            lineHeight: 1.05,
          }}
        >
          GAME HUB
        </h1>

        <p
          style={{
            marginTop: 14,
            marginBottom: 0,

            color: "rgba(245,239,224,0.65)",

            fontSize: 15,
          }}
        >
          Pilih game dan mulai bermain.
        </p>
      </div>

      {/* =========================================
          GAME GRID
      ========================================= */}

      <div
        style={{
          width: "100%",
          maxWidth: 1100,

          margin: "40px auto 0",

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",

          gap: 18,
        }}
      >
        {/* =========================================
            BIG TWO
        ========================================= */}

        <button
          type="button"
          style={cardStyle}
          onClick={() => navigate("big-two")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.7)";
            e.currentTarget.style.boxShadow =
              "0 16px 35px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.35)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.18)";
          }}
        >
          <div style={{ fontSize: 34 }}>🃏</div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            Big Two
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginTop: 7,
              lineHeight: 1.5,
            }}
          >
            Permainan kartu multiplayer dengan room code.
          </div>
        </button>

        {/* =========================================
            UNDERCOVER
        ========================================= */}

        <button
          type="button"
          style={cardStyle}
          onClick={() => navigate("undercover")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.7)";
            e.currentTarget.style.boxShadow =
              "0 16px 35px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.35)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.18)";
          }}
        >
          <div style={{ fontSize: 34 }}>🕵️</div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            Undercover
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginTop: 7,
              lineHeight: 1.5,
            }}
          >
            Tebak siapa yang menjadi Undercover atau Mr. White.
          </div>
        </button>

        {/* =========================================
            ULAR TANGGA
        ========================================= */}

        <button
          type="button"
          style={cardStyle}
          onClick={() => navigate("snakes")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.7)";
            e.currentTarget.style.boxShadow =
              "0 16px 35px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.35)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.18)";
          }}
        >
          <div style={{ fontSize: 34 }}>🐍</div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            Ular Tangga
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginTop: 7,
              lineHeight: 1.5,
            }}
          >
            Lempar dadu, naik tangga, dan hindari ular.
          </div>
        </button>

        {/* =========================================
            CHESS
        ========================================= */}

        <button
          type="button"
          style={cardStyle}
          onClick={() => navigate("chess")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.7)";
            e.currentTarget.style.boxShadow =
              "0 16px 35px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.35)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.18)";
          }}
        >
          <div style={{ fontSize: 34 }}>♟️</div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            Chess
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginTop: 7,
              lineHeight: 1.5,
            }}
          >
            Main catur multiplayer dengan sistem room.
          </div>
        </button>

        {/* =========================================
            BOM-BOM
        ========================================= */}

        <button
          type="button"
          style={cardStyle}
          onClick={() => navigate("bom-bom")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.7)";
            e.currentTarget.style.boxShadow =
              "0 16px 35px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.35)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.18)";
          }}
        >
          <div style={{ fontSize: 34 }}>💣</div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            Bom-Bom
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginTop: 7,
              lineHeight: 1.5,
            }}
          >
            Arena multiplayer 3D dengan karakter dan bom.
          </div>
        </button>

        {/* =========================================
            FOOTBALL MANAGER
        ========================================= */}

        <button
          type="button"
          style={cardStyle}
          onClick={() => navigate("football")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.7)";
            e.currentTarget.style.boxShadow =
              "0 16px 35px rgba(0,0,0,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor =
              "rgba(201,162,39,0.35)";
            e.currentTarget.style.boxShadow =
              "0 10px 30px rgba(0,0,0,0.18)";
          }}
        >
          <div style={{ fontSize: 34 }}>⚽</div>

          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              marginTop: 12,
            }}
          >
            Football Manager
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.65,
              marginTop: 7,
              lineHeight: 1.5,
            }}
          >
            Kumpulkan kartu pemain, susun squad, dan jalankan
            pertandingan otomatis.
          </div>
        </button>
      </div>

      {/* =========================================
          SUPPORT
      ========================================= */}

      <div
        style={{
          width: "100%",
          maxWidth: 1100,

          margin: "40px auto 0",

          textAlign: "center",
        }}
      >
        <a
          href="https://saweria.co/ralou"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",

            padding: "12px 20px",

            borderRadius: 12,

            border: `1px solid rgba(201,162,39,0.4)`,

            background: "rgba(201,162,39,0.08)",

            color: GOLD,

            textDecoration: "none",

            fontWeight: 700,

            fontSize: 14,
          }}
        >
          ☕ Support Developer
        </a>
      </div>

      {/* =========================================
          FOOTER
      ========================================= */}

      <div
        style={{
          textAlign: "center",

          marginTop: 28,

          fontSize: 12,

          opacity: 0.35,
        }}
      >
        RGameHub.App
      </div>
    </div>
  );
}