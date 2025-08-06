// script.js
let lastOpenedWindowId = null;

/**
 * Opens a window and positions it (centered for Sudoku, offset for others)
 * @param {string} id - The DOM ID of the window
 */
function openWindow(id) {
  const win = document.getElementById(id);
  win.classList.remove('hidden');
  bringToFront(win);

  // Always open Sudoku and Guestbook window centered
  if (id === "sudokuWindow" || id === "guestbookWindow") {
    const rect = win.getBoundingClientRect();
    const winWidth = rect.width || win.offsetWidth;
    const winHeight = rect.height || win.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    win.style.left = `${Math.max(0, (viewportWidth - winWidth) / 2)}px`;
    win.style.top = `${Math.max(0, (viewportHeight - winHeight) / 2)}px`;
  } else if (!win.style.left && !win.style.top) {
    // Default behavior for other windows: offset from the last opened window
    let refWin = null;
    if (
      lastOpenedWindowId &&
      lastOpenedWindowId !== id &&
      !document.getElementById(lastOpenedWindowId).classList.contains('hidden')
    ) {
      refWin = document.getElementById(lastOpenedWindowId);
    }
    if (refWin) {
      const lastLeft = parseInt(refWin.style.left) || refWin.getBoundingClientRect().left;
      const lastTop = parseInt(refWin.style.top) || refWin.getBoundingClientRect().top;
      win.style.left = `${lastLeft + 40}px`;
      win.style.top = `${lastTop + 40}px`;
    } else {
      // If no reference window, center the window
      const rect = win.getBoundingClientRect();
      const winWidth = rect.width || win.offsetWidth;
      const winHeight = rect.height || win.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      win.style.left = `${Math.max(0, (viewportWidth - winWidth) / 2)}px`;
      win.style.top = `${Math.max(0, (viewportHeight - winHeight) / 2)}px`;
    }
  }
  lastOpenedWindowId = id;
}

/**
 * Closes a window by hiding it
 * @param {string} id - The DOM ID of the window
 */
function closeWindow(id) {
  document.getElementById(id).classList.add('hidden');
}

/**
 * Brings a window to the front (highest z-index)
 * @param {HTMLElement} win - The window element
 */
function bringToFront(win) {
  const windows = document.querySelectorAll('.window');
  let maxZ = 10;
  windows.forEach(w => {
    const z = parseInt(window.getComputedStyle(w).zIndex) || 10;
    if (z > maxZ) maxZ = z;
  });
  win.style.zIndex = maxZ + 1;
}

// Drag & Drop for windows
let offsetX, offsetY, currentWin;

/**
 * Starts dragging a window
 * @param {MouseEvent} e
 * @param {HTMLElement} win
 */
function startDrag(e, win) {
  currentWin = win;
  offsetX = e.clientX - win.offsetLeft;
  offsetY = e.clientY - win.offsetTop;
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
}

/**
 * Moves the current window with the mouse
 * @param {MouseEvent} e
 */
function drag(e) {
  if (!currentWin) return;
  currentWin.style.left = `${e.clientX - offsetX}px`;
  currentWin.style.top = `${e.clientY - offsetY}px`;
}

/**
 * Stops dragging the window
 */
function stopDrag() {
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
  currentWin = null;
}

// -------------------- Blackjack Game --------------------
let deck = [], player = [], dealer = [];
let gameActive = false; // true while the game is running

/**
 * Creates and shuffles a new deck of cards
 * @returns {Array} deck
 */
function newDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  // Each card as an object, then shuffle deck
  return suits.flatMap(s => values.map(v => ({ v, s }))).sort(() => Math.random() - 0.5);
}

/**
 * Calculates the value of a hand (with Ace rule)
 * @param {Array} hand
 * @returns {number} total value
 */
function getValue(hand) {
  let total = 0, aces = 0;
  for (const card of hand) {
    if (['J', 'Q', 'K'].includes(card.v)) total += 10;
    else if (card.v === 'A') { total += 11; aces++; }
    else total += parseInt(card.v);
  }
  // Ace can be 1 or 11
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

/**
 * Displays the current cards of player and dealer
 */
function displayHands() {
  document.getElementById('playerHand').textContent = player.map(c => c.v + c.s).join(' ');
  document.getElementById('dealerHand').textContent = dealer.map(c => c.v + c.s).join(' ');
}

/**
 * Enables/disables buttons depending on game status
 */
function updateButtons() {
  const startBtn = document.getElementById('dealBtn');
  const hitBtn = document.getElementById('hitBtn');
  const standBtn = document.getElementById('standBtn');
  // Only Start is active if no game is running
  if (!gameActive) {
    startBtn.disabled = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
  } else {
    startBtn.disabled = true;
    hitBtn.disabled = false;
    standBtn.disabled = false;
  }
}

/**
 * Starts a new round
 */
function deal() {
  deck = newDeck();
  player = [deck.pop(), deck.pop()];
  dealer = [deck.pop()]; // Dealer starts with only one card
  displayHands();
  const val = getValue(player);
  // Immediate win at 21
  if (val === 21) {
    document.getElementById('gameStatus').textContent = 'Blackjack! You win! :)';
    gameActive = false;
    updateButtons();
    return;
  }
  document.getElementById('gameStatus').textContent = 'Your turn';
  gameActive = true;
  updateButtons();
}

/**
 * Player draws a card
 */
function hit() {
  if (!gameActive) return;
  player.push(deck.pop());
  displayHands();
  const val = getValue(player);
  // Immediate win at 21
  if (val === 21) {
    document.getElementById('gameStatus').textContent = 'Blackjack! You win! :)';
    gameActive = false;
    updateButtons();
    return;
  }
  // Over 21 = lose
  if (val > 21) {
    document.getElementById('gameStatus').textContent = 'Over 21, you lose. :(';
    gameActive = false;
    updateButtons();
  }
}

/**
 * Player stands, dealer draws until at least 17
 */
function stand() {
  if (!gameActive) return;
  while (getValue(dealer) < 17) dealer.push(deck.pop());
  displayHands();
  const p = getValue(player), d = getValue(dealer);
  let result = '';
  if (d > 21 || p > d) result = 'You win!';
  else if (p === d) result = 'Draw.';
  else result = 'Dealer wins.';
  document.getElementById('gameStatus').textContent = result;
  gameActive = false;
  updateButtons();
}

// Initialization after window load
window.addEventListener('DOMContentLoaded', () => {
  // Rename buttons and set IDs
  const dealBtn = document.querySelector('#blackjackWindow button[onclick="deal()"]');
  if (dealBtn) {
    dealBtn.textContent = 'Start';
    dealBtn.id = 'dealBtn';
  }
  const hitBtn = document.querySelector('#blackjackWindow button[onclick="hit()"]');
  if (hitBtn) hitBtn.id = 'hitBtn';
  const standBtn = document.querySelector('#blackjackWindow button[onclick="stand()"]');
  if (standBtn) standBtn.id = 'standBtn';

  // Remove reset button if present (from old code)
  const resetBtn = document.querySelector('#blackjackWindow button[onclick="resetGame()"]');
  if (resetBtn) resetBtn.remove();

  // Reset the game on load
  player = [];
  dealer = [];
  document.getElementById('gameStatus').textContent = 'Press "Start" to begin.';
  displayHands();
  gameActive = false;
  updateButtons();
});

// --- Sudoku window initialization ---
window.addEventListener('DOMContentLoaded', function() {
  var $candidateToggle = $(".js-candidate-toggle"),
      $generateBoardBtnEasy = $(".js-generate-board-btn--easy"),
      $generateBoardBtnMedium = $(".js-generate-board-btn--medium"),
      $generateBoardBtnHard = $(".js-generate-board-btn--hard"),
      $generateBoardBtnVeryHard = $(".js-generate-board-btn--very-hard"),
      $solveStepBtn = $(".js-solve-step-btn"),
      $solveAllBtn = $(".js-solve-all-btn"),
      $clearBoardBtn = $(".js-clear-board-btn"),
      mySudokuJS = $("#sudoku").sudokuJS({
        difficulty: "very hard",
        candidateShowToggleFn : function(showing){
          // Synchronize the checkbox status with the visibility of candidates
          $candidateToggle.prop("checked", showing);
        }
      });

  // Solve one step
  $solveStepBtn.on("click", mySudokuJS.solveStep);
  // Solve all
  $solveAllBtn.on("click", mySudokuJS.solveAll);
  // Clear board
  $clearBoardBtn.on("click", mySudokuJS.clearBoard);
  // Generate boards with different difficulty levels
  $generateBoardBtnEasy.on("click", function(){
    mySudokuJS.generateBoard("easy");
  });
  $generateBoardBtnMedium.on("click", function(){
    mySudokuJS.generateBoard("medium");
  });
  $generateBoardBtnHard.on("click", function(){
    mySudokuJS.generateBoard("hard");
  });
  $generateBoardBtnVeryHard.on("click", function(){
    mySudokuJS.generateBoard("very hard");
  });

  // Show/hide candidates when checkbox changes
  $candidateToggle.on("change", function(){
    if($candidateToggle.is(":checked"))
      mySudokuJS.showCandidates();
    else
      mySudokuJS.hideCandidates();
  });

  // Hide candidates by default on load
  $candidateToggle.prop("checked", false);
  mySudokuJS.hideCandidates();
});

/**
 * Toggles the visibility of a list and rotates the arrow icon.
 * @param {string} listId - The id of the list (dl or ul) to toggle
 * @param {HTMLElement} heading - The heading element that was clicked
 */
function toggleList(listId, heading) {
  const list = document.getElementById(listId);
  if (!list) return;
  const arrow = heading.querySelector('.arrow');
  if (list.style.display === "none" || list.style.display === "") {
    list.style.display = "block";
    heading.classList.add("active");
    if (arrow) arrow.style.transform = "rotate(90deg)";
  } else {
    list.style.display = "none";
    heading.classList.remove("active");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  }
}
