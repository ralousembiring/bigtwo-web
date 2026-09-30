import React from "react";

const RARITY_STYLE = {
  Standard: {
    border: "#8d8d8d",
    glow: "rgba(180,180,180,0.25)",
    label: "STANDARD",
  },

  Rare: {
    border: "#4da6ff",
    glow: "rgba(77,166,255,0.35)",
    label: "RARE",
  },

  Epic: {
    border: "#a855f7",
    glow: "rgba(168,85,247,0.45)",
    label: "EPIC",
  },

  Legendary: {
    border: "#C9A227",
    glow: "rgba(201,162,39,0.55)",
    label: "LEGENDARY",
  },
};

export function PlayerCard({ card, revealed = true }) {
  if (!card) return null;

  const style =
    RARITY_STYLE[card.rarity] ||
    RARITY_STYLE.Standard;

  const isGoalkeeper = card.position === "GK";

  return (
    <div
      style={{
        width: 250,
        height: 360,
        perspective: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.7s ease",
          transform: revealed
            ? "rotateY(0deg)"
            : "rotateY(180deg)",
        }}
      >
        {/* ========================= */}
        {/* DEPAN KARTU */}
        {/* ========================= */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            borderRadius: 22,
            border: `3px solid ${style.border}`,
            background:
              "linear-gradient(145deg, #2a2417, #11100d)",
            boxShadow: `
              0 0 25px ${style.glow},
              0 18px 45px rgba(0,0,0,0.45)
            `,
            color: "#F5EFE0",
            padding: 18,
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* RARITY */}

          <div
            style={{
              textAlign: "center",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 2,
              color: style.border,
              marginBottom: 5,
            }}
          >
            {style.label}
          </div>

          {/* OVERALL */}

          <div
            style={{
              position: "absolute",
              left: 18,
              top: 40,
              textAlign: "center",
              zIndex: 2,
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {card.overall}
            </div>

            <div
              style={{
                fontSize: 12,
                opacity: 0.75,
                fontWeight: 700,
              }}
            >
              OVR
            </div>
          </div>

          {/* PLAYER PHOTO AREA */}

          <div
            style={{
              height: 175,
              marginTop: 12,
              borderRadius: 16,
              background:
                "linear-gradient(180deg, #403823, #211d16)",
              border:
                "1px solid rgba(245,239,224,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              overflow: "hidden",
            }}
          >
            {card.photo ? (
              <img
                src={card.photo}
                alt={card.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                }}
              />
            ) : (
              "⚽"
            )}
          </div>

          {/* NAME */}

          <div
            style={{
              textAlign: "center",
              marginTop: 12,
              fontSize: 21,
              fontWeight: 900,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.name}
          </div>

          {/* POSITION */}

          <div
            style={{
              textAlign: "center",
              marginTop: 3,
              fontSize: 13,
              opacity: 0.7,
            }}
          >
            {card.position} • {card.nationality}
          </div>

          {/* ========================= */}
          {/* ATTRIBUTES */}
          {/* ========================= */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "5px 18px",
              marginTop: 13,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {isGoalkeeper ? (
              <>
                <div>🧠 AWR {card.awareness}</div>
                <div>🧤 CAT {card.catching}</div>
                <div>⚡ REF {card.reflexes}</div>
                <div>🪽 DIV {card.diving}</div>
                <div>🦘 JMP {card.jumping}</div>
                <div>💪 PHY {card.physical}</div>
              </>
            ) : (
              <>
                <div>⚡ PAC {card.pace}</div>
                <div>🎯 SHO {card.shooting}</div>
                <div>🎯 PAS {card.passing}</div>
                <div>💨 DRI {card.dribbling}</div>
                <div>🛡️ DEF {card.defending}</div>
                <div>💪 PHY {card.physical}</div>
              </>
            )}
          </div>
        </div>

        {/* ========================= */}
        {/* BELAKANG KARTU */}
        {/* ========================= */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: 22,
            border: `3px solid ${style.border}`,
            background:
              "linear-gradient(145deg, #15120d, #302818)",
            boxShadow: `
              0 0 25px ${style.glow},
              0 18px 45px rgba(0,0,0,0.45)
            `,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: style.border,
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 50,
                marginBottom: 15,
              }}
            >
              ⚽
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                letterSpacing: 3,
              }}
            >
              RALOU
            </div>

            <div
              style={{
                fontSize: 12,
                marginTop: 5,
                opacity: 0.7,
                letterSpacing: 2,
              }}
            >
              FOOTBALL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}