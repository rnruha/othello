const board = document.getElementById("board");
const turnInfo = document.getElementById("turn-info");
const result = document.getElementById("result");
const restartButton = document.getElementById("restart-button");
const scoreDisplay = document.getElementById("score-display");
const startScreen = document.getElementById("start-screen");
const cpuLevelScreen = document.getElementById("cpu-level-screen");
const fadeMessage = document.getElementById("fade-message");

let currentPlayer = "black";
let useCPU = false;
let cpuLevel = "normal";
const directions = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
let state = [];


function showCPULevels() {
  startScreen.style.display = "none";
  cpuLevelScreen.style.display = "flex";
  cpuLevelScreen.className = startScreen.className;
}

function startGame(cpuMode, level) {
  useCPU = cpuMode;
  cpuLevel = level;
  startScreen.style.display = "none";
  cpuLevelScreen.style.display = "none";
  const msg = cpuMode ? "あなたは黒です" : "最初のプレイヤーは黒です";
  showFadeMessage(msg);
  restartGame();
}

function showFadeMessage(msg) {
  fadeMessage.textContent = msg;
  fadeMessage.style.display = "block";
  fadeMessage.classList.remove("fadeout");
  fadeMessage.offsetWidth;
  fadeMessage.classList.add("fadeout");
}

fadeMessage.addEventListener("animationend", () => {
  fadeMessage.style.display = "none";
});

function initializeBoard() {
  state = Array(8).fill(null).map(() => Array(8).fill(null));
  state[3][3] = "white";
  state[3][4] = "black";
  state[4][3] = "black";
  state[4][4] = "white";
}

function restartGame() {
  initializeBoard();
  currentPlayer = "black";
  result.textContent = "";
  restartButton.style.display = "none";
  render();
}

function render(showHighlights = true) {
  board.innerHTML = "";
  const validMoves = getValidMoves(currentPlayer);

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.x = x;
      cell.dataset.y = y;

      if (showHighlights && (!useCPU || currentPlayer === "black") && validMoves.some(([vx, vy]) => vx === x && vy === y)) {
        cell.classList.add("highlight");
      }

      cell.addEventListener("click", () => {
        if (!useCPU || currentPlayer !== "white") {
          handlePlayerMove(x, y);
        }
      });

      if (state[y][x]) {
        const disk = document.createElement("div");
        disk.className = `disk ${state[y][x]}`;
        disk.dataset.x = x;
        disk.dataset.y = y;
        cell.appendChild(disk);
      }
      board.appendChild(cell);
    }
  }
  updateScore();
  turnInfo.textContent = currentPlayer === "black" ? "黒の番です" : "白の番です";
}

function handlePlayerMove(x, y) {
  if (state[y][x]) return;
  const flips = getFlippableDisks(x, y, currentPlayer);
  if (flips.length === 0) return;

  state[y][x] = currentPlayer;

  const flipSet = new Set(flips.map(([fx, fy]) => `${fx},${fy}`));

  clearHighlights();
  render(false);

  setTimeout(() => {
    for (const [fx, fy] of flips) {
      const cellIndex = fy * 8 + fx;
      const cell = board.children[cellIndex];
      const oldDisk = cell.querySelector('.disk');
      if (oldDisk && flipSet.has(`${fx},${fy}`)) {
        flipDisk(oldDisk, currentPlayer);
        state[fy][fx] = currentPlayer;
      }
    }

    setTimeout(() => {
      currentPlayer = currentPlayer === "black" ? "white" : "black";
      render();
      updateTurn();
    }, 800);
  }, 200);
}

function clearHighlights() {
  const highlighted = document.querySelectorAll('.highlight');
  highlighted.forEach(cell => cell.classList.remove('highlight'));
}

// ... その他の関数は変更なし ...



function updateTurn() {
  const validMoves = getValidMoves(currentPlayer);
  if (validMoves.length === 0) {
    const opponent = currentPlayer === "black" ? "white" : "black";
    const opponentMoves = getValidMoves(opponent);
    if (opponentMoves.length > 0) {
      showFadeMessage(`${currentPlayer === "black" ? "黒" : "白"}はパスされました`);
      currentPlayer = opponent;
      setTimeout(() => {
        render();
        updateTurn();
      }, 1000);
    } else {
      showResult();
    }
  } else {
    if (useCPU && currentPlayer === "white") {
      setTimeout(cpuTurn, 500);
    }
  }
}

function updateScore() {
  let blackCount = 0;
  let whiteCount = 0;
  for (let row of state) {
    for (let cell of row) {
      if (cell === "black") blackCount++;
      if (cell === "white") whiteCount++;
    }
  }
  scoreDisplay.textContent = `黒: ${blackCount} | 白: ${whiteCount}`;
}

function showResult() {
  let blackCount = 0;
  let whiteCount = 0;
  for (let row of state) {
    for (let cell of row) {
      if (cell === "black") blackCount++;
      if (cell === "white") whiteCount++;
    }
  }
  let resultText = `黒 ${blackCount} 対 白 ${whiteCount} → `;
  if (blackCount > whiteCount) resultText += "黒の勝ち！";
  else if (whiteCount > blackCount) resultText += "白の勝ち！";
  else resultText += "引き分け！";
  turnInfo.textContent = "ゲーム終了";
  result.textContent = resultText;
  restartButton.style.display = "inline-block";
}

function getValidMoves(player) {
  let moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (!state[y][x] && getFlippableDisks(x, y, player).length > 0) {
        moves.push([x, y]);
      }
    }
  }
  return moves;
}

function getFlippableDisks(x, y, player) {
  const opponent = player === "black" ? "white" : "black";
  let toFlip = [];
  for (const [dx, dy] of directions) {
    let i = x + dx;
    let j = y + dy;
    let line = [];
    while (i >= 0 && i < 8 && j >= 0 && j < 8 && state[j][i] === opponent) {
      line.push([i, j]);
      i += dx;
      j += dy;
    }
    if (i >= 0 && i < 8 && j >= 0 && j < 8 && state[j][i] === player && line.length) {
      toFlip.push(...line);
    }
  }
  return toFlip;
}

function flipDisk(diskElement, newColor) {
  diskElement.classList.add("flipping");
  setTimeout(() => {
    diskElement.classList.remove("black", "white");
    diskElement.classList.add(newColor);
    diskElement.classList.remove("flipping");
  }, 300);
}

function cpuTurn() {
  if (!useCPU || currentPlayer !== "white") return;
  const valid = getValidMoves("white");
  if (valid.length === 0) return;

  let bestMove;
  if (cpuLevel === "normal") {
    bestMove = valid.reduce((best, move) => {
      const [x, y] = move;
      let score = getFlippableDisks(x, y, "white").length;
      if ((x === 0 || x === 7) && (y === 0 || y === 7)) score += 100;
      else if (x === 0 || x === 7 || y === 0 || y === 7) score += 10;
      return score > best.score ? { move, score } : best;
    }, { move: null, score: -Infinity }).move;
  } else if (cpuLevel === "hard") {
    bestMove = valid.reduce((best, move) => {
      const [x, y] = move;
      const newState = copyState(state);
      const flips = getFlippableDisksFromState(newState, x, y, "white");
      newState[y][x] = "white";
      flips.forEach(([fx, fy]) => newState[fy][fx] = "white");
      const opponentMoves = getValidMovesFromState(newState, "black").length;
      const score = getMoveScore(x, y) - opponentMoves * 2;
      return score > best.score ? { move, score } : best;
    }, { move: null, score: -Infinity }).move;
  } else if (cpuLevel === "expert") {
    const decision = minimaxDecision(copyState(state), 5, true);
    bestMove = decision.move;
  }

  if (bestMove) {
    handlePlayerMove(bestMove[0], bestMove[1]);
  }
}

function copyState(original) {
  return original.map(row => [...row]);
}

function getValidMovesFromState(boardState, player) {
  let moves = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (!boardState[y][x] && getFlippableDisksFromState(boardState, x, y, player).length > 0) {
        moves.push([x, y]);
      }
    }
  }
  return moves;
}

function getFlippableDisksFromState(boardState, x, y, player) {
  const opponent = player === "black" ? "white" : "black";
  let toFlip = [];
  for (const [dx, dy] of directions) {
    let i = x + dx;
    let j = y + dy;
    let line = [];
    while (i >= 0 && i < 8 && j >= 0 && j < 8 && boardState[j][i] === opponent) {
      line.push([i, j]);
      i += dx;
      j += dy;
    }
    if (i >= 0 && i < 8 && j >= 0 && j < 8 && boardState[j][i] === player && line.length) {
      toFlip.push(...line);
    }
  }
  return toFlip;
}

function getMoveScore(x, y) {
  let score = getFlippableDisksFromState(state, x, y, "white").length;
  if ((x === 0 || x === 7) && (y === 0 || y === 7)) score += 100;
  else if (x === 0 || x === 7 || y === 0 || y === 7) score += 10;
  return score;
}

function minimaxDecision(state, depth, maximizing) {
  const validMoves = getValidMovesFromState(state, "white");
  let bestScore = -Infinity;
  let bestMove = null;
  for (const [x, y] of validMoves) {
    const newState = copyState(state);
    newState[y][x] = "white";
    const flips = getFlippableDisksFromState(newState, x, y, "white");
    flips.forEach(([fx, fy]) => newState[fy][fx] = "white");
    let score = minimax(newState, depth - 1, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [x, y];
    }
  }
  return { move: bestMove, score: bestScore };
}

function minimax(state, depth, maximizing) {
  if (depth === 0) return evaluate(state);
  const player = maximizing ? "white" : "black";
  const moves = getValidMovesFromState(state, player);
  if (moves.length === 0) return evaluate(state);

  let scores = moves.map(([x, y]) => {
    const newState = copyState(state);
    newState[y][x] = player;
    const flips = getFlippableDisksFromState(newState, x, y, player);
    flips.forEach(([fx, fy]) => newState[fy][fx] = player);
    return minimax(newState, depth - 1, !maximizing);
  });

  return maximizing ? Math.max(...scores) : Math.min(...scores);
}

function evaluate(state) {
  let score = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = state[y][x];
      let value = 0;
      if ((x === 0 || x === 7) && (y === 0 || y === 7)) value = 100;
      else if ((x === 1 || x === 6) && (y === 1 || y === 6)) value = -50;
      else if (x === 0 || x === 7 || y === 0 || y === 7) value = 10;
      else value = 1;
      if (cell === "white") score += value;
      else if (cell === "black") score -= value;
    }
  }
  return score;
}

window.onload = () => {
  initializeBoard();
  render();
};
