// ========================================
// CHESS LOGIC
// ========================================

export const PIECES = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },

  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
};

// ========================================
// INITIAL BOARD
// ========================================

export function createInitialBoard() {
  return [
    [
      { type: "rook", color: "black" },
      { type: "knight", color: "black" },
      { type: "bishop", color: "black" },
      { type: "queen", color: "black" },
      { type: "king", color: "black" },
      { type: "bishop", color: "black" },
      { type: "knight", color: "black" },
      { type: "rook", color: "black" },
    ],

    Array(8)
      .fill(null)
      .map(() => ({
        type: "pawn",
        color: "black",
      })),

    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),

    Array(8)
      .fill(null)
      .map(() => ({
        type: "pawn",
        color: "white",
      })),

    [
      { type: "rook", color: "white" },
      { type: "knight", color: "white" },
      { type: "bishop", color: "white" },
      { type: "queen", color: "white" },
      { type: "king", color: "white" },
      { type: "bishop", color: "white" },
      { type: "knight", color: "white" },
      { type: "rook", color: "white" },
    ],
  ];
}

// ========================================
// INITIAL GAME STATE
// ========================================

export function createInitialState() {
  return {
    board: createInitialBoard(),

    turn: "white",

    castlingRights: {
      white: {
        kingSide: true,
        queenSide: true,
      },

      black: {
        kingSide: true,
        queenSide: true,
      },
    },

    // Kotak yang bisa digunakan untuk en passant
    enPassant: null,
  };
}

// ========================================
// HELPERS
// ========================================

export function cloneBoard(board) {
  return board.map((row) =>
    row.map((piece) =>
      piece ? { ...piece } : null
    )
  );
}

export function isInsideBoard(row, col) {
  return (
    row >= 0 &&
    row < 8 &&
    col >= 0 &&
    col < 8
  );
}

export function getPieceSymbol(piece) {
  if (!piece) return "";

  return PIECES[piece.color][piece.type];
}

function oppositeColor(color) {
  return color === "white" ? "black" : "white";
}

// ========================================
// FIND KING
// ========================================

export function findKing(board, color) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];

      if (
        piece &&
        piece.color === color &&
        piece.type === "king"
      ) {
        return { row, col };
      }
    }
  }

  return null;
}

// ========================================
// IS SQUARE ATTACKED?
// ========================================

export function isSquareAttacked(
  board,
  row,
  col,
  attackerColor
) {
  // ------------------------------------
  // PAWN
  // ------------------------------------

  const pawnRow =
    attackerColor === "white"
      ? row + 1
      : row - 1;

  for (const pawnCol of [
    col - 1,
    col + 1,
  ]) {
    if (!isInsideBoard(pawnRow, pawnCol)) {
      continue;
    }

    const piece = board[pawnRow][pawnCol];

    if (
      piece &&
      piece.color === attackerColor &&
      piece.type === "pawn"
    ) {
      return true;
    }
  }

  // ------------------------------------
  // KNIGHT
  // ------------------------------------

  const knightMoves = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];

  for (const [dr, dc] of knightMoves) {
    const r = row + dr;
    const c = col + dc;

    if (!isInsideBoard(r, c)) continue;

    const piece = board[r][c];

    if (
      piece &&
      piece.color === attackerColor &&
      piece.type === "knight"
    ) {
      return true;
    }
  }

  // ------------------------------------
  // KING
  // ------------------------------------

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;

      const r = row + dr;
      const c = col + dc;

      if (!isInsideBoard(r, c)) continue;

      const piece = board[r][c];

      if (
        piece &&
        piece.color === attackerColor &&
        piece.type === "king"
      ) {
        return true;
      }
    }
  }

  // ------------------------------------
  // ROOK / QUEEN
  // ------------------------------------

  const straightDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const [dr, dc] of straightDirections) {
    let r = row + dr;
    let c = col + dc;

    while (isInsideBoard(r, c)) {
      const piece = board[r][c];

      if (piece) {
        if (
          piece.color === attackerColor &&
          (
            piece.type === "rook" ||
            piece.type === "queen"
          )
        ) {
          return true;
        }

        break;
      }

      r += dr;
      c += dc;
    }
  }

  // ------------------------------------
  // BISHOP / QUEEN
  // ------------------------------------

  const diagonalDirections = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (const [dr, dc] of diagonalDirections) {
    let r = row + dr;
    let c = col + dc;

    while (isInsideBoard(r, c)) {
      const piece = board[r][c];

      if (piece) {
        if (
          piece.color === attackerColor &&
          (
            piece.type === "bishop" ||
            piece.type === "queen"
          )
        ) {
          return true;
        }

        break;
      }

      r += dr;
      c += dc;
    }
  }

  return false;
}

// ========================================
// CHECK
// ========================================

export function isKingInCheck(
  board,
  color
) {
  const king = findKing(board, color);

  // Seharusnya tidak pernah terjadi
  // karena Raja tidak boleh dimakan.
  if (!king) return true;

  return isSquareAttacked(
    board,
    king.row,
    king.col,
    oppositeColor(color)
  );
}

// ========================================
// PATH CHECK
// ========================================

function isPathClear(
  board,
  fromRow,
  fromCol,
  toRow,
  toCol
) {
  const rowStep = Math.sign(
    toRow - fromRow
  );

  const colStep = Math.sign(
    toCol - fromCol
  );

  let row = fromRow + rowStep;
  let col = fromCol + colStep;

  while (
    row !== toRow ||
    col !== toCol
  ) {
    if (board[row][col]) {
      return false;
    }

    row += rowStep;
    col += colStep;
  }

  return true;
}

// ========================================
// PSEUDO LEGAL MOVES
// ========================================

export function getPseudoLegalMoves(
  state,
  fromRow,
  fromCol
) {
  const {
    board,
    castlingRights,
    enPassant,
  } = state;

  const piece = board[fromRow][fromCol];

  if (!piece) return [];

  const moves = [];

  const addMove = (
    row,
    col,
    extra = {}
  ) => {
    if (!isInsideBoard(row, col)) return;

    const target = board[row][col];

    if (
      target &&
      target.color === piece.color
    ) {
      return;
    }

    moves.push({
      row,
      col,
      ...extra,
    });
  };

  // ====================================
  // PAWN
  // ====================================

  if (piece.type === "pawn") {
    const direction =
      piece.color === "white"
        ? -1
        : 1;

    const startRow =
      piece.color === "white"
        ? 6
        : 1;

    const promotionRow =
      piece.color === "white"
        ? 0
        : 7;

    // Maju 1
    const oneRow =
      fromRow + direction;

    if (
      isInsideBoard(oneRow, fromCol) &&
      !board[oneRow][fromCol]
    ) {
      addMove(
        oneRow,
        fromCol,
        oneRow === promotionRow
          ? { promotion: true }
          : {}
      );

      // Maju 2
      const twoRow =
        fromRow + direction * 2;

      if (
        fromRow === startRow &&
        !board[twoRow][fromCol]
      ) {
        addMove(
          twoRow,
          fromCol
        );
      }
    }

    // Capture diagonal
    for (const dc of [-1, 1]) {
      const targetRow =
        fromRow + direction;

      const targetCol =
        fromCol + dc;

      if (
        !isInsideBoard(
          targetRow,
          targetCol
        )
      ) {
        continue;
      }

      const target =
        board[targetRow][targetCol];

      if (
        target &&
        target.color !== piece.color
      ) {
        addMove(
          targetRow,
          targetCol,
          targetRow === promotionRow
            ? { promotion: true }
            : {}
        );
      }

      // En passant
      if (
        enPassant &&
        enPassant.row === targetRow &&
        enPassant.col === targetCol
      ) {
        const adjacent =
          board[fromRow][targetCol];

        if (
          adjacent &&
          adjacent.type === "pawn" &&
          adjacent.color !== piece.color
        ) {
          addMove(
            targetRow,
            targetCol,
            {
              enPassant: true,
            }
          );
        }
      }
    }

    return moves;
  }

  // ====================================
  // KNIGHT
  // ====================================

  if (piece.type === "knight") {
    const knightMoves = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    for (const [dr, dc] of knightMoves) {
      addMove(
        fromRow + dr,
        fromCol + dc
      );
    }

    return moves;
  }

  // ====================================
  // BISHOP
  // ====================================

  if (piece.type === "bishop") {
    const directions = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    for (const [dr, dc] of directions) {
      let row = fromRow + dr;
      let col = fromCol + dc;

      while (isInsideBoard(row, col)) {
        const target = board[row][col];

        if (!target) {
          addMove(row, col);
        } else {
          if (
            target.color !== piece.color
          ) {
            addMove(row, col);
          }

          break;
        }

        row += dr;
        col += dc;
      }
    }

    return moves;
  }

  // ====================================
  // ROOK
  // ====================================

  if (piece.type === "rook") {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];

    for (const [dr, dc] of directions) {
      let row = fromRow + dr;
      let col = fromCol + dc;

      while (isInsideBoard(row, col)) {
        const target = board[row][col];

        if (!target) {
          addMove(row, col);
        } else {
          if (
            target.color !== piece.color
          ) {
            addMove(row, col);
          }

          break;
        }

        row += dr;
        col += dc;
      }
    }

    return moves;
  }

  // ====================================
  // QUEEN
  // ====================================

  if (piece.type === "queen") {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    for (const [dr, dc] of directions) {
      let row = fromRow + dr;
      let col = fromCol + dc;

      while (isInsideBoard(row, col)) {
        const target = board[row][col];

        if (!target) {
          addMove(row, col);
        } else {
          if (
            target.color !== piece.color
          ) {
            addMove(row, col);
          }

          break;
        }

        row += dr;
        col += dc;
      }
    }

    return moves;
  }

  // ====================================
  // KING
  // ====================================

  if (piece.type === "king") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        addMove(
          fromRow + dr,
          fromCol + dc
        );
      }
    }

    // ==================================
    // CASTLING
    // ==================================

    const rights =
      castlingRights[piece.color];

    const enemy =
      oppositeColor(piece.color);

    const homeRow =
      piece.color === "white"
        ? 7
        : 0;

    // King side
    if (
      fromRow === homeRow &&
      fromCol === 4 &&
      rights.kingSide &&
      !board[homeRow][5] &&
      !board[homeRow][6] &&
      board[homeRow][7]?.type === "rook" &&
      board[homeRow][7]?.color === piece.color &&
      !isSquareAttacked(
        board,
        homeRow,
        4,
        enemy
      ) &&
      !isSquareAttacked(
        board,
        homeRow,
        5,
        enemy
      ) &&
      !isSquareAttacked(
        board,
        homeRow,
        6,
        enemy
      )
    ) {
      addMove(
        homeRow,
        6,
        {
          castle: "kingSide",
        }
      );
    }

    // Queen side
    if (
      fromRow === homeRow &&
      fromCol === 4 &&
      rights.queenSide &&
      !board[homeRow][1] &&
      !board[homeRow][2] &&
      !board[homeRow][3] &&
      board[homeRow][0]?.type === "rook" &&
      board[homeRow][0]?.color === piece.color &&
      !isSquareAttacked(
        board,
        homeRow,
        4,
        enemy
      ) &&
      !isSquareAttacked(
        board,
        homeRow,
        3,
        enemy
      ) &&
      !isSquareAttacked(
        board,
        homeRow,
        2,
        enemy
      )
    ) {
      addMove(
        homeRow,
        2,
        {
          castle: "queenSide",
        }
      );
    }

    return moves;
  }

  return moves;
}

// ========================================
// APPLY MOVE
// ========================================

export function applyMove(
  state,
  fromRow,
  fromCol,
  move,
  promotionPiece = "queen"
) {
  const board = cloneBoard(state.board);

  const piece = board[fromRow][fromCol];

  if (!piece) {
    return state;
  }

  const movingColor = piece.color;

  const target =
    board[move.row][move.col];

  // ====================================
  // CASTLING RIGHTS
  // ====================================

  const castlingRights = {
    white: {
      ...state.castlingRights.white,
    },
    black: {
      ...state.castlingRights.black,
    },
  };

  const disableRookRight = (
    color,
    side
  ) => {
    castlingRights[color][side] = false;
  };

  // King moved
  if (piece.type === "king") {
    disableRookRight(
      movingColor,
      "kingSide"
    );

    disableRookRight(
      movingColor,
      "queenSide"
    );
  }

  // Rook moved from starting square
  if (
    piece.type === "rook" &&
    fromRow ===
      (movingColor === "white" ? 7 : 0)
  ) {
    if (fromCol === 0) {
      disableRookRight(
        movingColor,
        "queenSide"
      );
    }

    if (fromCol === 7) {
      disableRookRight(
        movingColor,
        "kingSide"
      );
    }
  }

  // Rook captured on starting square
  if (
    target &&
    target.type === "rook"
  ) {
    const targetColor = target.color;
    const targetHomeRow =
      targetColor === "white" ? 7 : 0;

    if (
      move.row === targetHomeRow &&
      move.col === 0
    ) {
      disableRookRight(
        targetColor,
        "queenSide"
      );
    }

    if (
      move.row === targetHomeRow &&
      move.col === 7
    ) {
      disableRookRight(
        targetColor,
        "kingSide"
      );
    }
  }

  // ====================================
  // MOVE PIECE
  // ====================================

  board[fromRow][fromCol] = null;

  board[move.row][move.col] = {
    ...piece,
  };

  // ====================================
  // EN PASSANT CAPTURE
  // ====================================

  if (move.enPassant) {
    const capturedPawnRow =
      movingColor === "white"
        ? move.row + 1
        : move.row - 1;

    board[capturedPawnRow][move.col] =
      null;
  }

  // ====================================
  // CASTLING ROOK MOVE
  // ====================================

  if (move.castle === "kingSide") {
    const row = movingColor === "white" ? 7 : 0;

    board[row][5] = board[row][7];
    board[row][7] = null;
  }

  if (move.castle === "queenSide") {
    const row = movingColor === "white" ? 7 : 0;

    board[row][3] = board[row][0];
    board[row][0] = null;
  }

  // ====================================
  // PROMOTION
  // ====================================

  const promotionRow =
    movingColor === "white" ? 0 : 7;

  if (
    piece.type === "pawn" &&
    move.row === promotionRow
  ) {
    const allowed = [
      "queen",
      "rook",
      "bishop",
      "knight",
    ];

    board[move.row][move.col] = {
      type: allowed.includes(
        promotionPiece
      )
        ? promotionPiece
        : "queen",
      color: movingColor,
    };
  }

  // ====================================
  // EN PASSANT TARGET
  // ====================================

  let enPassant = null;

  if (
    piece.type === "pawn" &&
    Math.abs(move.row - fromRow) === 2
  ) {
    enPassant = {
      row:
        (move.row + fromRow) / 2,
      col: fromCol,
    };
  }

  // ====================================
  // NEXT TURN
  // ====================================

  return {
    board,

    turn:
      movingColor === "white"
        ? "black"
        : "white",

    castlingRights,

    enPassant,
  };
}

// ========================================
// LEGAL MOVES
// ========================================

export function getLegalMoves(
  state,
  fromRow,
  fromCol
) {
  const piece =
    state.board[fromRow][fromCol];

  if (!piece) return [];

  const pseudoMoves =
    getPseudoLegalMoves(
      state,
      fromRow,
      fromCol
    );

  const legalMoves = [];

  for (const move of pseudoMoves) {
    const simulated =
      applyMove(
        state,
        fromRow,
        fromCol,
        move,
        "queen"
      );

    if (
      !isKingInCheck(
        simulated.board,
        piece.color
      )
    ) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

// ========================================
// ALL LEGAL MOVES
// ========================================

export function getAllLegalMoves(
  state,
  color
) {
  const moves = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece =
        state.board[row][col];

      if (
        !piece ||
        piece.color !== color
      ) {
        continue;
      }

      const pieceMoves =
        getLegalMoves(
          state,
          row,
          col
        );

      for (const move of pieceMoves) {
        moves.push({
          fromRow: row,
          fromCol: col,
          ...move,
        });
      }
    }
  }

  return moves;
}

// ========================================
// GAME STATUS
// ========================================

export function getGameStatus(
  state
) {
  const color = state.turn;

  const check =
    isKingInCheck(
      state.board,
      color
    );

  const legalMoves =
    getAllLegalMoves(
      state,
      color
    );

  if (
    legalMoves.length === 0
  ) {
    if (check) {
      return {
        status: "checkmate",
        check: true,
        gameOver: true,
        winner:
          color === "white"
            ? "black"
            : "white",
      };
    }

    return {
      status: "stalemate",
      check: false,
      gameOver: true,
      winner: null,
    };
  }

  return {
    status: check
      ? "check"
      : "playing",
    check,
    gameOver: false,
    winner: null,
  };
}

// ========================================
// COMPATIBILITY HELPER
// ========================================

export function isBasicMoveValid(
  board,
  fromRow,
  fromCol,
  toRow,
  toCol
) {
  const state = {
    board,
    turn: board[fromRow][fromCol]?.color || "white",

    castlingRights: {
      white: {
        kingSide: false,
        queenSide: false,
      },
      black: {
        kingSide: false,
        queenSide: false,
      },
    },

    enPassant: null,
  };

  return getLegalMoves(
    state,
    fromRow,
    fromCol
  ).some(
    (move) =>
      move.row === toRow &&
      move.col === toCol
  );
}