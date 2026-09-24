import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

import { db } from "./firebase";
import { ref, update } from "firebase/database";

const GOLD = "#C9A227";
const ROUND_TIME = 15;

const LOW_OBSTACLES = [
  { x: 5, z: 3, width: 2.5, depth: 2, height: 0.9 },
  { x: -1.5, z: 4, width: 2.5, depth: 1.5, height: 0.9 },
  { x: 1.5, z: -4, width: 2.5, depth: 1.5, height: 0.9 },
];

const MEDIUM_OBSTACLES = [
  { x: 5, z: -3, width: 2.5, depth: 0.8, height: 1.7 },
  { x: -5, z: -3, width: 1.8, depth: 0.8, height: 1.7 },
];

const CLIMBABLE_OBSTACLES = [
  ...LOW_OBSTACLES,
  ...MEDIUM_OBSTACLES,
];

const HIGH_OBSTACLES = [
  { x: 0, z: 0, width: 3, depth: 0.8, height: 3.2 },
  { x: -5, z: 3, width: 2.5, depth: 0.8, height: 3.2 },
  { x: 5, z: 1, width: 2.2, depth: 0.8, height: 3.2 },
];

const MODEL_PATHS = {
  fanzi: "/models/character-male-a-colored.glb",
  echa: "/models/character-female-a-colored.glb",
  andy: "/models/character-male-b-colored.glb",
  kevin: "/models/character-male-c-colored.glb",
  sherina: "/models/character-female-b-colored.glb",
  maled: "/models/character-male-d-colored.glb",
  malee: "/models/character-male-e-colored.glb",
  femalec: "/models/character-female-c-colored.glb",
};

const SPAWNS = [
  [-7, -4],
  [0, -4],
  [7, -4],
  [-7, 4],
  [0, 4],
  [7, 4],
  [-3.5, 0],
  [3.5, 0],
];

function isInsideObstacle(x, z, obstacle) {
  const r = 0.45;

  return (
    x > obstacle.x - obstacle.width / 2 - r &&
    x < obstacle.x + obstacle.width / 2 + r &&
    z > obstacle.z - obstacle.depth / 2 - r &&
    z < obstacle.z + obstacle.depth / 2 + r
  );
}

function getObstacleUnderPlayer(x, z) {
  for (const obstacle of CLIMBABLE_OBSTACLES) {
    if (isInsideObstacle(x, z, obstacle)) return obstacle;
  }

  return null;
}

function getHighObstacleAt(x, z) {
  for (const obstacle of HIGH_OBSTACLES) {
    if (isInsideObstacle(x, z, obstacle)) return obstacle;
  }

  return null;
}

// Menentukan permukaan tempat karakter benar-benar bisa berdiri.
// Obstacle tinggi baru dianggap sebagai lantai kalau karakter
// sudah mencapai ketinggian atasnya. Ini mencegah karakter
// "mendelep" ke dalam badan obstacle tinggi.
function getSurfaceAtPlayer(x, z, y) {
  const highObstacle = getHighObstacleAt(x, z);

  if (highObstacle) {
    const highTop = highObstacle.height + 0.65;

    if (y >= highTop - 0.2) {
      return highObstacle;
    }
  }

  return getObstacleUnderPlayer(x, z);
}

function isOutsideArena(x, z) {
  return x < -9.55 || x > 9.55 || z < -6.55 || z > 6.55;
}

function distance2D(a, b) {
  if (!a || !b) return 999;

  const dx = (a.x || 0) - (b.x || 0);
  const dz = (a.z || 0) - (b.z || 0);

  return Math.sqrt(dx * dx + dz * dz);
}

function Wall({ position, scale }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#66594d" />
    </mesh>
  );
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#9a8064" />
      </mesh>

      <gridHelper
        args={[20, 20, "#d0b99a", "#806b55"]}
        position={[0, 0.02, 0]}
      />
    </>
  );
}

function SpawnMarker({ position }) {
  return (
    <mesh
      position={[position[0], 0.04, position[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[0.7, 32]} />
      <meshStandardMaterial
        color={GOLD}
        transparent
        opacity={0.65}
      />
    </mesh>
  );
}

/* =========================
   BOMB
========================= */

function Bomb3D({ position, flying = false }) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (flying) {
      groupRef.current.rotation.x += delta * 9;
      groupRef.current.rotation.z += delta * 7;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={flying ? 1.15 : 0.82}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial
          color="#202020"
          metalness={0.35}
          roughness={0.55}
        />
      </mesh>

      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.16, 16]} />
        <meshStandardMaterial
          color="#444444"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      <mesh
        position={[0, 0.46, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.035, 0.035, 0.22, 10]} />
        <meshStandardMaterial
          color="#8a6b3d"
          roughness={0.8}
        />
      </mesh>

      <mesh position={[0.11, 0.46, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial
          color="#ff7a00"
          emissive="#ff3300"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

/* =========================
   ANIMATION
========================= */

const ANIMATION_ALIASES = {
  idle: ["idle", "Idle", "IDLE", "Idle_01"],
  walk: [
    "walk",
    "Walk",
    "walking",
    "Walking",
    "Walk_01",
  ],
  run: [
    "run",
    "Run",
    "running",
    "Running",
    "Run_01",
  ],
  jump: [
    "jump",
    "Jump",
    "jumping",
    "Jumping",
    "Jump_01",
  ],
  throw: [
    "throw",
    "Throw",
    "throwing",
    "Throwing",
    "Throw_01",
  ],
};

function findAnimationAction(actions, animationName) {
  if (!actions) return null;

  const aliases =
    ANIMATION_ALIASES[animationName] || [animationName];

  for (const name of aliases) {
    if (actions[name]) {
      return actions[name];
    }
  }

  const key = Object.keys(actions).find((actionKey) =>
    aliases.some(
      (name) =>
        actionKey.toLowerCase() === name.toLowerCase()
    )
  );

  return key ? actions[key] : null;
}

function KenneyModel({
  modelGroupRef,
  animationName,
  characterId,
}) {
  const modelPath =
    MODEL_PATHS[characterId] || MODEL_PATHS.fanzi;

  const { scene, animations } = useGLTF(modelPath);

  const { actions } = useAnimations(
    animations,
    modelGroupRef
  );

  useEffect(() => {
    if (!actions || !animationName) return;

    let action = findAnimationAction(
      actions,
      animationName
    );

    // Kalau throw tidak tersedia, gunakan idle sebagai fallback.
    if (!action && animationName === "throw") {
      action = findAnimationAction(actions, "idle");
    }

    if (!action) return;

    Object.values(actions).forEach((otherAction) => {
      if (otherAction !== action) {
        otherAction.fadeOut(0.18);
      }
    });

    action.reset().fadeIn(0.18).play();

    if (animationName === "throw") {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    }

    return () => {
      action.fadeOut(0.18);
    };
  }, [actions, animationName]);

  return (
    <group ref={modelGroupRef}>
      <primitive
        object={scene}
        scale={[3, 3, 3]}
        position={[0, -0.65, 0]}
      />
    </group>
  );
}

Object.values(MODEL_PATHS).forEach((path) => {
  useGLTF.preload(path);
});

/* =========================
   LOCAL PLAYER
========================= */

function LocalPlayer({
  playerRef,
  characterId,
  alive,
  onPositionChange,
  mobileInputRef,
  mobileJumpRef,
}) {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const position = useRef(
    new THREE.Vector3(0, 1, 5)
  );

  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const modelGroupRef = useRef();
  const lastSync = useRef(0);

  const [animation, setAnimation] = useState("idle");

  useEffect(() => {
    const keyDown = (event) => {
      if (!alive) return;

      if (
        event.key === "w" ||
        event.key === "W" ||
        event.key === "ArrowUp"
      ) {
        keys.current.forward = true;
      }

      if (
        event.key === "s" ||
        event.key === "S" ||
        event.key === "ArrowDown"
      ) {
        keys.current.backward = true;
      }

      if (
        event.key === "a" ||
        event.key === "A" ||
        event.key === "ArrowLeft"
      ) {
        keys.current.left = true;
      }

      if (
        event.key === "d" ||
        event.key === "D" ||
        event.key === "ArrowRight"
      ) {
        keys.current.right = true;
      }

      if (
        event.code === "Space" &&
        isGrounded.current
      ) {
        velocityY.current = 8;
        isGrounded.current = false;
      }
    };

    const keyUp = (event) => {
      if (
        event.key === "w" ||
        event.key === "W" ||
        event.key === "ArrowUp"
      ) {
        keys.current.forward = false;
      }

      if (
        event.key === "s" ||
        event.key === "S" ||
        event.key === "ArrowDown"
      ) {
        keys.current.backward = false;
      }

      if (
        event.key === "a" ||
        event.key === "A" ||
        event.key === "ArrowLeft"
      ) {
        keys.current.left = false;
      }

      if (
        event.key === "d" ||
        event.key === "D" ||
        event.key === "ArrowRight"
      ) {
        keys.current.right = false;
      }
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [alive]);

  useFrame((_, delta) => {
    if (!alive) {
      setAnimation("idle");
      return;
    }

    const speed = 5;

    if (mobileJumpRef?.current && isGrounded.current) {
      velocityY.current = 8;
      isGrounded.current = false;
      mobileJumpRef.current = false;
    }

    let x = 0;
    let z = 0;

    if (keys.current.forward) z -= 1;
    if (keys.current.backward) z += 1;
    if (keys.current.left) x -= 1;
    if (keys.current.right) x += 1;

    // Mobile virtual joystick.
    if (mobileInputRef?.current) {
      x += mobileInputRef.current.x || 0;
      z += mobileInputRef.current.y || 0;
    }

    const direction = new THREE.Vector3(x, 0, z);
    const isMoving = direction.lengthSq() > 0;

    if (isMoving) {
      direction.normalize();

      const moveX = direction.x * speed * delta;
      const moveZ = direction.z * speed * delta;

      const currentSurface = getSurfaceAtPlayer(
        position.current.x,
        position.current.z,
        position.current.y
      );

      const currentTop = currentSurface
        ? currentSurface.height + 0.65
        : 1;

      const isOnSurface =
        Math.abs(position.current.y - currentTop) < 0.2;

      // -------------------------------------
      // Collision X
      // -------------------------------------
      const nextX = position.current.x + moveX;

      let blockedX = false;

      if (isOutsideArena(nextX, position.current.z)) {
        blockedX = true;
      } else {
        const highX = getHighObstacleAt(
          nextX,
          position.current.z
        );

        if (highX) {
          const highTop = highX.height + 0.65;

          // Belum cukup tinggi untuk masuk ke atas obstacle.
          if (position.current.y < highTop - 0.15) {
            blockedX = true;
          }
        }

        const obstacleX = getObstacleUnderPlayer(
          nextX,
          position.current.z
        );

        if (obstacleX) {
          const obstacleTop = obstacleX.height + 0.65;

          // Dari tanah, tidak boleh menembus sisi obstacle.
          // Dari atas obstacle yang sama/lebih tinggi, tetap boleh bergerak.
          if (
            position.current.y < obstacleTop - 0.15 &&
            !isOnSurface
          ) {
            blockedX = true;
          }
        }
      }

      if (!blockedX) {
        position.current.x = nextX;
      }

      // -------------------------------------
      // Collision Z
      // -------------------------------------
      const nextZ = position.current.z + moveZ;

      let blockedZ = false;

      if (isOutsideArena(position.current.x, nextZ)) {
        blockedZ = true;
      } else {
        const highZ = getHighObstacleAt(
          position.current.x,
          nextZ
        );

        if (highZ) {
          const highTop = highZ.height + 0.65;

          if (position.current.y < highTop - 0.15) {
            blockedZ = true;
          }
        }

        const obstacleZ = getObstacleUnderPlayer(
          position.current.x,
          nextZ
        );

        if (obstacleZ) {
          const obstacleTop = obstacleZ.height + 0.65;

          if (
            position.current.y < obstacleTop - 0.15 &&
            !isOnSurface
          ) {
            blockedZ = true;
          }
        }
      }

      if (!blockedZ) {
        position.current.z = nextZ;
      }

      playerRef.current.rotation.y =
        THREE.MathUtils.lerp(
          playerRef.current.rotation.y,
          Math.atan2(direction.x, direction.z),
          0.2
        );
    }

    // -------------------------------------
    // Vertical movement / gravity
    // -------------------------------------
    velocityY.current -= 20 * delta;
    position.current.y += velocityY.current * delta;

    const surface = getSurfaceAtPlayer(
      position.current.x,
      position.current.z,
      position.current.y
    );

    if (surface) {
      const top = surface.height + 0.65;

      if (
        velocityY.current <= 0 &&
        position.current.y <= top
      ) {
        position.current.y = top;
        velocityY.current = 0;
        isGrounded.current = true;
      }
    }

    if (position.current.y <= 1) {
      position.current.y = 1;
      velocityY.current = 0;
      isGrounded.current = true;
    }

    setAnimation(
      !isGrounded.current
        ? "jump"
        : isMoving
        ? "walk"
        : "idle"
    );

    playerRef.current.position.copy(
      position.current
    );

    const now = Date.now();

    if (now - lastSync.current > 50) {
      lastSync.current = now;

      onPositionChange(
        position.current,
        playerRef.current.rotation.y
      );
    }
  });

  return (
    <group
      ref={playerRef}
      position={[
        position.current.x,
        position.current.y,
        position.current.z,
      ]}
    >
      <KenneyModel
        modelGroupRef={modelGroupRef}
        animationName={animation}
        characterId={characterId}
      />
    </group>
  );
}

/* =========================
   REMOTE PLAYER
========================= */

function RemotePlayer({ player }) {
  const groupRef = useRef();
  const modelRef = useRef();

  const targetPosition = useRef(
    new THREE.Vector3(
      player.position?.x || 0,
      player.position?.y || 1,
      player.position?.z || 0
    )
  );

  const targetRotation = useRef(
    typeof player.position?.rotationY === "number"
      ? player.position.rotationY
      : 0
  );

  const [animation, setAnimation] =
    useState("idle");

  const [throwing, setThrowing] =
    useState(false);

  const movingUntil = useRef(0);
  const lastAnimation = useRef("idle");

  useEffect(() => {
    const nextX = player.position?.x || 0;
    const nextY = player.position?.y || 1;
    const nextZ = player.position?.z || 0;
    const changed =
      Math.abs(targetPosition.current.x - nextX) > 0.002 ||
      Math.abs(targetPosition.current.y - nextY) > 0.002 ||
      Math.abs(targetPosition.current.z - nextZ) > 0.002;

    targetPosition.current.set(nextX, nextY, nextZ);
    if (changed) movingUntil.current = performance.now() + 260;

    if (typeof player.position?.rotationY === "number") {
      targetRotation.current = player.position.rotationY;
    }
  }, [
    player.position?.x,
    player.position?.y,
    player.position?.z,
    player.position?.rotationY,
  ]);

  useEffect(() => {
    if (!player.lastThrowAt) return;

    setThrowing(true);

    const timeout = setTimeout(() => {
      setThrowing(false);
    }, 650);

    return () => clearTimeout(timeout);
  }, [player.lastThrowAt]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const before =
      groupRef.current.position.clone();

    groupRef.current.position.lerp(
      targetPosition.current,
      Math.min(1, delta * 12)
    );

    // Kalau device pengirim belum mengirim rotationY dengan benar,
    // arah hadap remote tetap mengikuti arah perpindahannya.
    const moveDX =
      groupRef.current.position.x - before.x;
    const moveDZ =
      groupRef.current.position.z - before.z;

    if (Math.abs(moveDX) + Math.abs(moveDZ) > 0.0005) {
      targetRotation.current = Math.atan2(
        moveDX,
        moveDZ
      );
    }

    groupRef.current.rotation.y =
      THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current,
        Math.min(1, delta * 10)
      );

    const isNetworkMoving = performance.now() < movingUntil.current;
    let nextAnimation = "idle";

    if (throwing) {
      nextAnimation = "throw";
    } else if (
      player.isJumping ||
      player.position?.y > 1.2
    ) {
      nextAnimation = "jump";
    } else if (isNetworkMoving) {
      nextAnimation =
        player.isRunning || player.isBot
          ? "run"
          : "walk";
    }

    if (lastAnimation.current !== nextAnimation) {
      lastAnimation.current = nextAnimation;
      setAnimation(nextAnimation);
    }
  });

  if (player.alive === false) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      position={[
        player.position?.x || 0,
        player.position?.y || 1,
        player.position?.z || 0,
      ]}
      rotation={[
        0,
        typeof player.position?.rotationY === "number"
          ? player.position.rotationY
          : 0,
        0,
      ]}
    >
      <KenneyModel
        modelGroupRef={modelRef}
        animationName={animation}
        characterId={
          player.character || "fanzi"
        }
      />
    </group>
  );
}

/* =========================
   BOMB THROW
========================= */

async function tryThrowBomb({
  roomCode,
  game,
  players,
  throwerId,
  throwerPosition,
  throwerRotationY = 0,
}) {
  if (
    !roomCode ||
    !game ||
    game.status !== "arena"
  ) {
    return null;
  }

  if (game.bombHolderId !== throwerId) {
    return null;
  }

  // Arah lempar mengikuti arah hadap karakter.
  // rotationY tersimpan di dalam player.position pada game ini.
  const forwardX = Math.sin(throwerRotationY);
  const forwardZ = Math.cos(throwerRotationY);

  const aliveTargets = Object.entries(players)
    .filter(
      ([id, player]) =>
        id !== throwerId &&
        player.alive !== false &&
        player.position
    )
    .map(([id, player]) => {
      const dx = player.position.x - throwerPosition.x;
      const dz = player.position.z - throwerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const length = distance || 1;
      const dot =
        (dx / length) * forwardX +
        (dz / length) * forwardZ;

      return { id, player, distance, dot };
    })
    .sort((a, b) => a.distance - b.distance);

  // Hanya pemain yang benar-benar berada di depan karakter
  // yang boleh dianggap terkena lemparan otomatis.
  const hitTarget =
    aliveTargets.find(
      (item) =>
        item.distance <= 4.8 &&
        item.dot > 0.35
    ) || null;

  const now = Date.now();

  let targetId = null;
  let targetPosition;

  if (hitTarget) {
    targetId = hitTarget.id;
    targetPosition = {
      x: hitTarget.player.position.x,
      y: hitTarget.player.position.y + 0.7,
      z: hitTarget.player.position.z,
    };
  } else {
    // Always throw, even when nobody is close enough to be hit.
    const THROW_DISTANCE = 6.5;

    let x =
      throwerPosition.x +
      forwardX * THROW_DISTANCE;

    let z =
      throwerPosition.z +
      forwardZ * THROW_DISTANCE;

    // Keep the missed throw inside the arena.
    x = THREE.MathUtils.clamp(x, -8.9, 8.9);
    z = THREE.MathUtils.clamp(z, -5.9, 5.9);

    targetPosition = {
      x,
      y: Math.max(1.1, throwerPosition.y + 0.2),
      z,
    };
  }

  const gameRef = ref(
    db,
    `bomBomRooms/${roomCode}/game`
  );

  await update(gameRef, {
    // Transfer only on an actual hit.
    bombHolderId: targetId || throwerId,

    lastThrowerId: throwerId,
    lastThrowTargetId: targetId,
    lastThrowAt: now,

    throwStartPosition: {
      x: throwerPosition.x + forwardX * 0.55,
      y: throwerPosition.y + 1.05,
      z: throwerPosition.z + forwardZ * 0.55,
    },

    throwTargetPosition: targetPosition,
  });

  return {
    targetId,
    targetPosition,
    throwAt: now,
  };
}

/* =========================
   BOT CONTROLLER
========================= */

function BotController({
  roomCode,
  players,
  game,
  isHost,
}) {
  const timerRef = useRef(null);
  const lastAction = useRef({});
  const playersRef = useRef(players);
  const gameRef = useRef(game);
  const botStates = useRef({});

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (!roomCode || !isHost) {
      return;
    }

    const runBots = async () => {
      const currentPlayers =
        playersRef.current;

      const currentGame =
        gameRef.current;

      if (
        !currentGame ||
        currentGame.status !== "arena"
      ) {
        return;
      }

      const bots = Object.entries(
        currentPlayers
      ).filter(
        ([, player]) =>
          player.isBot &&
          player.alive !== false &&
          player.position
      );

      if (!bots.length) return;

      const alivePlayers =
        Object.entries(
          currentPlayers
        ).filter(
          ([, player]) =>
            player.alive !== false &&
            player.position
        );

      const now = Date.now();

      for (const [botId, bot] of bots) {
        const current =
          bot.position || {
            x: 0,
            y: 1,
            z: 0,
          };

        if (!botStates.current[botId]) {
          botStates.current[botId] = {
            nextJumpAt:
              now +
              1000 +
              Math.random() * 2500,
            velocityY: 0,
            lastTime: now,
          };
        }

        const state =
          botStates.current[botId];

        const dt = Math.min(
          0.3,
          Math.max(
            0.01,
            (now - state.lastTime) / 1000
          )
        );

        state.lastTime = now;

        const holderId =
          currentGame.bombHolderId;

        const botHasBomb =
          holderId === botId;

        const bombHolder =
          holderId
            ? currentPlayers[holderId]
            : null;

        let moveX = 0;
        let moveZ = 0;
        let target = null;

        if (botHasBomb) {
          target =
            alivePlayers
              .filter(([id]) => id !== botId)
              .sort(
                (a, b) =>
                  distance2D(
                    current,
                    a[1].position
                  ) -
                  distance2D(
                    current,
                    b[1].position
                  )
              )[0];

          if (target) {
            const targetPos =
              target[1].position;

            const dx =
              targetPos.x - current.x;

            const dz =
              targetPos.z - current.z;

            const length =
              Math.sqrt(
                dx * dx + dz * dz
              ) || 1;

            moveX = dx / length;
            moveZ = dz / length;
          }
        } else if (
          bombHolder?.position
        ) {
          const dx =
            current.x -
            bombHolder.position.x;

          const dz =
            current.z -
            bombHolder.position.z;

          const length =
            Math.sqrt(
              dx * dx + dz * dz
            ) || 1;

          moveX = dx / length;
          moveZ = dz / length;

          // Gerakan zig-zag supaya kaburnya tidak kaku.
          const sideX = -moveZ;
          const sideZ = moveX;

          const wave =
            Math.sin(
              now / 450 +
                bot.playerNumber
            ) * 0.38;

          moveX += sideX * wave;
          moveZ += sideZ * wave;

          const finalLength =
            Math.sqrt(
              moveX * moveX +
                moveZ * moveZ
            ) || 1;

          moveX /= finalLength;
          moveZ /= finalLength;
        }

        const holderDistance =
          bombHolder?.position
            ? distance2D(
                current,
                bombHolder.position
              )
            : 999;

        let speed = botHasBomb
          ? 3.6
          : 3.8;

        if (
          !botHasBomb &&
          holderDistance < 3.5
        ) {
          speed = 5.2;
        }

        let nextX =
          current.x +
          moveX * speed * dt;

        let nextZ =
          current.z +
          moveZ * speed * dt;

        nextX = THREE.MathUtils.clamp(
          nextX,
          -8.8,
          8.8
        );

        nextZ = THREE.MathUtils.clamp(
          nextZ,
          -5.8,
          5.8
        );

        // JUMP BOT
        if (
          now >= state.nextJumpAt &&
          Math.abs(state.velocityY) < 0.1
        ) {
          state.velocityY = 7;

          state.nextJumpAt =
            now +
            1800 +
            Math.random() * 3000;
        }

        state.velocityY -= 20 * dt;

        let nextY =
          (current.y || 1) +
          state.velocityY * dt;

        if (nextY <= 1) {
          nextY = 1;
          state.velocityY = 0;
        }

        const isJumping =
          nextY > 1.15 ||
          Math.abs(state.velocityY) > 0.5;

        const isMoving =
          Math.abs(moveX) > 0.01 ||
          Math.abs(moveZ) > 0.01;

        const nextPosition = {
          x: Number(nextX.toFixed(2)),
          y: Number(nextY.toFixed(2)),
          z: Number(nextZ.toFixed(2)),
        };

        await update(
          ref(
            db,
            `bomBomRooms/${roomCode}/players/${botId}`
          ),
          {
            position: nextPosition,
            rotationY: Math.atan2(
              moveX,
              moveZ
            ),
            isRunning: isMoving,
            isJumping,
          }
        );

        // BOT LEMPAR BOM
        if (
          botHasBomb &&
          target
        ) {
          const distance =
            distance2D(
              nextPosition,
              target[1].position
            );

          const last =
            lastAction.current[botId] || 0;

          if (
            distance < 4.8 &&
            now - last > 2200
          ) {
            lastAction.current[botId] =
              now;

            await tryThrowBomb({
              roomCode,
              game:
                gameRef.current,
              players:
                playersRef.current,
              throwerId: botId,
              throwerPosition:
                nextPosition,
              throwerRotationY:
                Math.atan2(
                  target[1].position.x -
                    nextPosition.x,
                  target[1].position.z -
                    nextPosition.z
                ),
            });
          }
        }
      }
    };

    timerRef.current =
      setInterval(runBots, 150);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [roomCode, isHost]);

  return null;
}

/* =========================
   FLYING BOMB
========================= */

function FlyingBomb({
  start,
  target,
  active,
}) {
  const groupRef = useRef();
  const startedAt = useRef(0);

  const startX = start?.x || 0;
  const startY = start?.y || 1.5;
  const startZ = start?.z || 0;

  const targetX = target?.x || 0;
  const targetY = target?.y || 1;
  const targetZ = target?.z || 0;

  useEffect(() => {
    if (!active) return;

    startedAt.current = performance.now();

    if (groupRef.current) {
      groupRef.current.position.set(
        startX,
        startY,
        startZ
      );
    }
  }, [
    active,
    startX,
    startY,
    startZ,
    targetX,
    targetY,
    targetZ,
  ]);

  useFrame(() => {
    if (!active || !groupRef.current) return;

    // Fixed throw duration so the bomb visibly travels
    // instead of being pulled toward the target.
    const FLIGHT_TIME = 560;
    const elapsed = performance.now() - startedAt.current;
    const t = Math.min(1, elapsed / FLIGHT_TIME);

    // Smooth acceleration/deceleration.
    const eased = t * t * (3 - 2 * t);

    const x = THREE.MathUtils.lerp(
      startX,
      targetX,
      eased
    );

    const z = THREE.MathUtils.lerp(
      startZ,
      targetZ,
      eased
    );

    const baseY = THREE.MathUtils.lerp(
      startY,
      targetY + 0.2,
      eased
    );

    // Parabolic throwing arc.
    // The bomb rises in the middle and falls toward the target.
    const arcHeight = 2.2;
    const arc =
      Math.sin(Math.PI * eased) * arcHeight;

    groupRef.current.position.set(
      x,
      baseY + arc,
      z
    );
  });

  if (!active) return null;

  return (
    <group
      ref={groupRef}
      position={[startX, startY, startZ]}
    >
      <Bomb3D
        position={[0, 0, 0]}
        flying
      />
    </group>
  );
}

/* =========================
   CAMERA
========================= */

function FollowCamera({ playerRef }) {
  const { camera } = useThree();

  const smoothPosition =
    useRef(new THREE.Vector3());

  const smoothTarget =
    useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!playerRef.current) return;

    const player =
      playerRef.current;

    const desiredCamera =
      new THREE.Vector3(
        player.position.x,
        player.position.y + 7,
        player.position.z + 9
      );

    const desiredTarget =
      new THREE.Vector3(
        player.position.x,
        player.position.y + 1,
        player.position.z
      );

    const smooth =
      1 - Math.pow(0.001, delta);

    smoothPosition.current.lerp(
      desiredCamera,
      smooth
    );

    smoothTarget.current.lerp(
      desiredTarget,
      smooth
    );

    camera.position.copy(
      smoothPosition.current
    );

    camera.lookAt(
      smoothTarget.current
    );
  });

  return null;
}

/* =========================
   ARENA SCENE
========================= */

function ArenaScene({
  characterId,
  roomCode,
  players,
  game,
  playerId,
  onPositionChange,
  isHost,
  mobileInputRef,
  mobileJumpRef,
}) {
  const playerRef = useRef();

  const currentPlayer =
    players[playerId];

  const alive =
    currentPlayer?.alive !== false;

  const remotePlayers =
    useMemo(
      () =>
        Object.entries(players).filter(
          ([id]) => id !== playerId
        ),
      [players, playerId]
    );

  const bombHolder =
    players[game?.bombHolderId];

  const bombPosition =
    bombHolder?.position
      ? [
          (bombHolder.position.x || 0) +
            0.48,
          (bombHolder.position.y || 1) +
            0.52,
          (bombHolder.position.z || 0) -
            0.08,
        ]
      : [0, 1.5, 4];

  const [bombFlying, setBombFlying] =
    useState(false);

  useEffect(() => {
    if (!game?.lastThrowAt) return;

    setBombFlying(true);

    const timeout = setTimeout(() => {
      setBombFlying(false);
    }, 620);

    return () =>
      clearTimeout(timeout);
  }, [game?.lastThrowAt]);

  const throwStart =
    game?.throwStartPosition ||
    bombPosition;

  const throwTarget =
    game?.throwTargetPosition ||
    bombPosition;

  return (
    <>
      <ambientLight intensity={2} />

      <directionalLight
        position={[5, 12, 8]}
        intensity={3}
        castShadow
      />

      <pointLight
        position={[0, 6, 0]}
        intensity={20}
        distance={30}
        color={GOLD}
      />

      <Floor />

      <Wall
        position={[0, 1, -7]}
        scale={[20, 2, 0.5]}
      />

      <Wall
        position={[0, 1, 7]}
        scale={[20, 2, 0.5]}
      />

      <Wall
        position={[-10, 1, 0]}
        scale={[0.5, 2, 14]}
      />

      <Wall
        position={[10, 1, 0]}
        scale={[0.5, 2, 14]}
      />

      <Wall
        position={[0, 1.6, 0]}
        scale={[3, 3.2, 0.8]}
      />

      <Wall
        position={[-5, 1.6, 3]}
        scale={[2.5, 3.2, 0.8]}
      />

      <Wall
        position={[5, 1.6, 1]}
        scale={[2.2, 3.2, 0.8]}
      />

      <Wall
        position={[5, 0.85, -3]}
        scale={[2.5, 1.7, 0.8]}
      />

      <Wall
        position={[-5, 0.85, -3]}
        scale={[1.8, 1.7, 0.8]}
      />

      <Wall
        position={[5, 0.45, 3]}
        scale={[2.5, 0.9, 2]}
      />

      <Wall
        position={[-1.5, 0.45, 4]}
        scale={[2.5, 0.9, 1.5]}
      />

      <Wall
        position={[1.5, 0.45, -4]}
        scale={[2.5, 0.9, 1.5]}
      />

      {SPAWNS.map((position, index) => (
        <SpawnMarker
          key={index}
          position={position}
        />
      ))}

      {remotePlayers.map(
        ([id, player]) => (
          <RemotePlayer
            key={id}
            player={{
              ...player,
              id,
            }}
          />
        )
      )}

      <LocalPlayer
        playerRef={playerRef}
        characterId={characterId}
        alive={alive}
        onPositionChange={
          onPositionChange
        }
        mobileInputRef={mobileInputRef}
        mobileJumpRef={mobileJumpRef}
      />

      {!bombFlying && (
        <Bomb3D
          position={bombPosition}
        />
      )}

      <FlyingBomb
        start={throwStart}
        target={throwTarget}
        active={bombFlying}
      />

      <BotController
        roomCode={roomCode}
        players={players}
        game={game}
        isHost={isHost}
      />

      <FollowCamera
        playerRef={playerRef}
      />
    </>
  );
}

/* =========================
   MOBILE VIRTUAL JOYSTICK
========================= */

function VirtualJoystick({ inputRef, disabled, onJump }) {
  const activePointer = useRef(null);
  const baseRef = useRef(null);
  const RADIUS = 52;

  const reset = () => {
    if (inputRef?.current) {
      inputRef.current.x = 0;
      inputRef.current.y = 0;
    }
    activePointer.current = null;
  };

  const updateFromPointer = (event) => {
    if (
      activePointer.current === null ||
      activePointer.current !== event.pointerId ||
      !baseRef.current ||
      disabled
    ) {
      return;
    }

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const distance = Math.hypot(dx, dy);
    if (distance > RADIUS) {
      const scale = RADIUS / distance;
      dx *= scale;
      dy *= scale;
    }

    if (inputRef?.current) {
      inputRef.current.x = dx / RADIUS;
      inputRef.current.y = dy / RADIUS;
    }

    const knob = baseRef.current.querySelector(
      '[data-joystick-knob="true"]'
    );

    if (knob) {
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  };

  const handlePointerDown = (event) => {
    if (disabled) return;

    event.preventDefault();
    activePointer.current = event.pointerId;

    try {
      baseRef.current?.setPointerCapture(event.pointerId);
    } catch {}

    updateFromPointer(event);
  };

  const handlePointerMove = (event) => {
    event.preventDefault();
    updateFromPointer(event);
  };

  const handlePointerUp = (event) => {
    event.preventDefault();

    try {
      baseRef.current?.releasePointerCapture(event.pointerId);
    } catch {}

    reset();

    const knob = baseRef.current?.querySelector(
      '[data-joystick-knob="true"]'
    );

    if (knob) {
      knob.style.transform = 'translate(0px, 0px)';
    }
  };

  useEffect(() => reset, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 18,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        style={{
          width: 118,
          height: 118,
          borderRadius: '50%',
          background: 'rgba(20,14,10,0.48)',
          border: '2px solid rgba(245,239,224,0.45)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <div
          data-joystick-knob="true"
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(201,162,39,0.92)',
            border: '2px solid rgba(245,239,224,0.9)',
            boxShadow: '0 5px 15px rgba(0,0,0,0.35)',
            transition: 'transform 0.04s linear',
            pointerEvents: 'none',
          }}
        />
      </div>


    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */

export function BomBomArena3D({
  characterId = "fanzi",
  game,
  players = {},
  playerId,
  roomCode,
}) {
  const mobileInputRef = useRef({ x: 0, y: 0 });
  const mobileJumpRef = useRef(false);

  const [timeLeft, setTimeLeft] =
    useState(ROUND_TIME);

  const currentPlayer =
    players[playerId];

  const alive =
    currentPlayer?.alive !== false;

  const winner =
    game?.winnerId
      ? players[game.winnerId]
      : null;

  const [throwCooldown, setThrowCooldown] =
    useState(false);

  useEffect(() => {
    if (
      !game?.roundStartedAt ||
      game?.status !== "arena"
    ) {
      setTimeLeft(ROUND_TIME);
      return;
    }

    const updateTimer = () => {
      const elapsed =
        (Date.now() -
          game.roundStartedAt) /
        1000;

      const remaining =
        Math.max(
          0,
          ROUND_TIME - elapsed
        );

      setTimeLeft(
        Math.ceil(remaining)
      );
    };

    updateTimer();

    const timer =
      setInterval(updateTimer, 100);

    return () =>
      clearInterval(timer);
  }, [
    game?.roundStartedAt,
    game?.status,
  ]);

  const throwBomb = useCallback(
    async () => {
      if (
        !roomCode ||
        !playerId ||
        !game ||
        !alive ||
        game.bombHolderId !== playerId ||
        throwCooldown
      ) {
        return;
      }

      const player =
        players[playerId];

      if (!player?.position) return;

      setThrowCooldown(true);

      try {
        await tryThrowBomb({
          roomCode,
          game,
          players,
          throwerId: playerId,
          throwerPosition:
            player.position,
          throwerRotationY:
            typeof player.position.rotationY === "number"
              ? player.position.rotationY
              : 0,
        });
      } catch (error) {
        console.error(
          "Gagal melempar bom:",
          error
        );
      } finally {
        setTimeout(() => {
          setThrowCooldown(false);
        }, 700);
      }
    },
    [
      roomCode,
      playerId,
      game,
      players,
      alive,
      throwCooldown,
    ]
  );

  useEffect(() => {
    const handler = (event) => {
      if (
        event.key === "e" ||
        event.key === "E"
      ) {
        event.preventDefault();
        throwBomb();
      }
    };

    window.addEventListener(
      "keydown",
      handler
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handler
      );
  }, [throwBomb]);

  const alivePlayers =
    Object.entries(players).filter(
      ([, player]) =>
        player.alive !== false
    );

  const holder =
    players[game?.bombHolderId];

  const isHost =
    game?.hostId === playerId;

  const goToGameHub = useCallback(() => {
    const url = new URL(window.location.href);
    url.search = "";
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        background: "#1a1310",
        border: "none",
        borderRadius: 0,
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform:
            "translateX(-50%)",
          zIndex: 10,
          padding: "10px 22px",
          borderRadius: 14,
          background:
            "rgba(20,14,10,0.88)",
          border:
            "2px solid rgba(201,162,39,0.8)",
          color: "#F5EFE0",
          fontSize: 24,
          fontWeight: 900,
          minWidth: 90,
          textAlign: "center",
        }}
      >
        ⏱️ {timeLeft}
      </div>

      <div
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          zIndex: 10,
          padding: "8px 14px",
          borderRadius: 12,
          background:
            "rgba(20,14,10,0.88)",
          color: "#F5EFE0",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        Ronde {game?.round || 1}
        {" / "}
        {Math.max(
          1,
          game?.totalRounds ||
            alivePlayers.length - 1
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          zIndex: 10,
          padding: "8px 14px",
          borderRadius: 12,
          background:
            "rgba(20,14,10,0.88)",
          color:
            holder ? GOLD : "#F5EFE0",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        💣{" "}
        {holder
          ? holder.id === playerId
            ? "BOM ADA DI KAMU!"
            : holder.isBot
            ? "BOT MEMEGANG BOM"
            : `Player ${holder.playerNumber}`
          : "Tidak ada pemegang"}
      </div>

      {!alive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "rgba(20,10,5,0.65)",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: 25,
              borderRadius: 18,
              background:
                "rgba(20,14,10,0.95)",
              border:
                "2px solid rgba(220,80,80,0.5)",
            }}
          >
            <div style={{ fontSize: 40 }}>
              💥
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 25,
                fontWeight: 900,
                color: "#ffb4b4",
              }}
            >
              KAMU TERELIMINASI
            </div>

            <div
              style={{
                marginTop: 8,
                opacity: 0.7,
              }}
            >
              Tunggu ronde berikutnya...
            </div>
          </div>
        </div>
      )}

      {game?.status === "winner" &&
        winner && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "rgba(10,7,5,0.82)",
              backdropFilter:
                "blur(5px)",
            }}
          >
            <div
              style={{
                width: "min(90%, 430px)",
                padding: "35px 25px",
                borderRadius: 22,
                textAlign: "center",
                background:
                  "linear-gradient(180deg, #241a15, #120d0a)",
                border:
                  "2px solid rgba(201,162,39,0.85)",
                boxShadow:
                  "0 20px 70px rgba(0,0,0,0.65)",
              }}
            >
              <div style={{ fontSize: 64 }}>
                🏆
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: GOLD,
                  fontSize: 32,
                  fontWeight: 900,
                }}
              >
                PEMENANG!
              </div>

              <div
                style={{
                  marginTop: 18,
                  color: "#F5EFE0",
                  fontSize: 24,
                  fontWeight: 900,
                }}
              >
                {winner.isBot
                  ? `🤖 ${
                      winner.botName ||
                      `Bot ${winner.playerNumber}`
                    }`
                  : `Player ${winner.playerNumber}`}
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: GOLD,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {winner.character
                  ? winner.character
                      .charAt(0)
                      .toUpperCase() +
                    winner.character.slice(1)
                  : ""}
              </div>

              <div
                style={{
                  marginTop: 20,
                  color: "#F5EFE0",
                  opacity: 0.65,
                  fontSize: 13,
                }}
              >
                Pemain terakhir yang
                bertahan di arena.
              </div>

              <button
                onClick={goToGameHub}
                style={{
                  marginTop: 24,
                  padding: "12px 22px",
                  borderRadius: 12,
                  border: `1px solid ${GOLD}`,
                  background: GOLD,
                  color: "#17110e",
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: "pointer",
                  minWidth: 210,
                  touchAction: "manipulation",
                }}
              >
                ← Kembali ke Game Hub
              </button>
            </div>
          </div>
        )}

      <Canvas
        shadows
        camera={{
          position: [0, 8, 12],
          fov: 50,
        }}
      >
        <ArenaScene
          characterId={characterId}
          roomCode={roomCode}
          players={players}
          game={game}
          playerId={playerId}
          isHost={isHost}
          mobileInputRef={mobileInputRef}
          mobileJumpRef={mobileJumpRef}
          onPositionChange={(position, rotationY) => {
            if (!roomCode) return;

            update(
              ref(
                db,
                `bomBomRooms/${roomCode}/players/${playerId}/position`
              ),
              {
                x: Number(
                  position.x.toFixed(2)
                ),
                y: Number(
                  position.y.toFixed(2)
                ),
                z: Number(
                  position.z.toFixed(2)
                ),
                rotationY:
                  typeof rotationY === "number"
                    ? Number(rotationY.toFixed(3))
                    : 0,
              }
            ).catch((error) => {
              console.error(
                "Gagal sync posisi:",
                error
              );
            });
          }}
        />
      </Canvas>

      <style>{`
        .bom-mobile-joystick {
          display: none;
        }

        @media (pointer: coarse) {
          .bom-mobile-joystick {
            display: block;
          }

          .bom-mobile-jump {
            display: block !important;
          }

          .bom-pc-controls-hint {
            display: none;
          }
        }
      `}</style>

      <div
        className="bom-mobile-joystick"
        style={{
          position: "absolute",
          left: 18,
          bottom: 34,
          zIndex: 30,
        }}
      >
        <VirtualJoystick
          inputRef={mobileInputRef}
          disabled={!alive}
        />
      </div>

      <button
        className="bom-mobile-jump"
        onPointerDown={(event) => {
          event.preventDefault();
          if (alive) mobileJumpRef.current = true;
        }}
        disabled={!alive}
        style={{
          display: "none",
          position: "absolute",
          right: 22,
          bottom: 115,
          zIndex: 30,
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "2px solid rgba(245,239,224,0.9)",
          background: GOLD,
          color: BG,
          fontSize: 28,
          fontWeight: 900,
          touchAction: "none",
          userSelect: "none",
        }}
      >
        ↑
      </button>

      <button
        onClick={throwBomb}
        disabled={
          !alive ||
          game?.bombHolderId !== playerId
        }
        style={{
          position: "absolute",
          right: 22,
          bottom: 45,
          zIndex: 30,
          padding: "15px 22px",
          minWidth: 125,
          minHeight: 58,
          borderRadius: 15,
          border: "none",
          background:
            game?.bombHolderId === playerId
              ? GOLD
              : "rgba(255,255,255,0.15)",
          color:
            game?.bombHolderId === playerId
              ? "#17110e"
              : "#F5EFE0",
          fontWeight: 900,
          cursor:
            game?.bombHolderId === playerId
              ? "pointer"
              : "not-allowed",
          opacity:
            game?.bombHolderId === playerId
              ? 1
              : 0.5,
        }}
      >
        💣 LEMPAR BOM
        <br />
        <span style={{ fontSize: 10 }}>
          Tekan E
        </span>
      </button>

      <div
        className="bom-pc-controls-hint"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 15,
          textAlign: "center",
          color: "#F5EFE0",
          fontSize: 13,
          pointerEvents: "none",
          textShadow:
            "0 2px 4px rgba(0,0,0,0.8)",
        }}
      >
        WASD / Arrow Keys untuk bergerak
        {" • "}
        SPACE untuk lompat
        {" • "}
        E untuk lempar bom
      </div>
    </div>
  );
}