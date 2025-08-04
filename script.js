// Fensterverwaltung
let lastOpenedWindowId = null;

/**
 * Öffnet ein Fenster und positioniert es (zentriert für Sudoku, versetzt für andere)
 * @param {string} id - Die DOM-ID des Fensters
 */
function openWindow(id) {
  const win = document.getElementById(id);
  win.classList.remove('hidden');
  bringToFront(win);

  // Sudoku-Fenster immer mittig öffnen
  if (id === "sudokuWindow") {
    const rect = win.getBoundingClientRect();
    const winWidth = rect.width || win.offsetWidth;
    const winHeight = rect.height || win.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    win.style.left = `${Math.max(0, (viewportWidth - winWidth) / 2)}px`;
    win.style.top = `${Math.max(0, (viewportHeight - winHeight) / 2)}px`;
  } else if (!win.style.left && !win.style.top) {
    // Standardverhalten für andere Fenster: versetzt vom zuletzt geöffneten Fenster
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
      // Wenn kein Referenzfenster, Fenster zentrieren
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
 * Schließt ein Fenster, indem es ausgeblendet wird
 * @param {string} id - Die DOM-ID des Fensters
 */
function closeWindow(id) {
  document.getElementById(id).classList.add('hidden');
}

/**
 * Bringt ein Fenster in den Vordergrund (höchster z-index)
 * @param {HTMLElement} win - Das Fensterelement
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

// Drag & Drop für Fenster
let offsetX, offsetY, currentWin;

/**
 * Startet das Ziehen eines Fensters
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
 * Bewegt das aktuelle Fenster mit der Maus
 * @param {MouseEvent} e
 */
function drag(e) {
  if (!currentWin) return;
  currentWin.style.left = `${e.clientX - offsetX}px`;
  currentWin.style.top = `${e.clientY - offsetY}px`;
}

/**
 * Beendet das Ziehen des Fensters
 */
function stopDrag() {
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
  currentWin = null;
}

// -------------------- Blackjack-Spiel --------------------
let deck = [], player = [], dealer = [];
let gameActive = false; // true, solange das Spiel läuft

/**
 * Erstellt und mischt ein neues Kartendeck
 * @returns {Array} deck
 */
function newDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  // Jede Karte als Objekt, dann Deck mischen
  return suits.flatMap(s => values.map(v => ({ v, s }))).sort(() => Math.random() - 0.5);
}

/**
 * Berechnet den Wert einer Hand (mit Ass-Regel)
 * @param {Array} hand
 * @returns {number} totaler Wert
 */
function getValue(hand) {
  let total = 0, aces = 0;
  for (const card of hand) {
    if (['J', 'Q', 'K'].includes(card.v)) total += 10;
    else if (card.v === 'A') { total += 11; aces++; }
    else total += parseInt(card.v);
  }
  // Ass kann 1 oder 11 sein
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

/**
 * Zeigt die aktuellen Karten von Spieler und Dealer an
 */
function displayHands() {
  document.getElementById('playerHand').textContent = player.map(c => c.v + c.s).join(' ');
  document.getElementById('dealerHand').textContent = dealer.map(c => c.v + c.s).join(' ');
}

/**
 * Aktiviert/Deaktiviert die Buttons je nach Spielstatus
 */
function updateButtons() {
  const startBtn = document.getElementById('dealBtn');
  const hitBtn = document.getElementById('hitBtn');
  const standBtn = document.getElementById('standBtn');
  // Nur Start ist aktiv, wenn kein Spiel läuft
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
 * Startet eine neue Runde
 */
function deal() {
  deck = newDeck();
  player = [deck.pop(), deck.pop()];
  dealer = [deck.pop()]; // Dealer startet mit nur einer Karte
  displayHands();
  const val = getValue(player);
  // Sofortiger Gewinn bei 21
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
 * Spieler zieht eine Karte
 */
function hit() {
  if (!gameActive) return;
  player.push(deck.pop());
  displayHands();
  const val = getValue(player);
  // Sofortiger Gewinn bei 21
  if (val === 21) {
    document.getElementById('gameStatus').textContent = 'Blackjack! You win! :)';
    gameActive = false;
    updateButtons();
    return;
  }
  // Über 21 = verloren
  if (val > 21) {
    document.getElementById('gameStatus').textContent = 'Over 21, you lose. :(';
    gameActive = false;
    updateButtons();
  }
}

/**
 * Spieler bleibt stehen, Dealer zieht bis mindestens 17
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

// Initialisierung nach Laden des Fensters
window.addEventListener('DOMContentLoaded', () => {
  // Buttons umbenennen und IDs setzen
  const dealBtn = document.querySelector('#blackjackWindow button[onclick="deal()"]');
  if (dealBtn) {
    dealBtn.textContent = 'Start';
    dealBtn.id = 'dealBtn';
  }
  const hitBtn = document.querySelector('#blackjackWindow button[onclick="hit()"]');
  if (hitBtn) hitBtn.id = 'hitBtn';
  const standBtn = document.querySelector('#blackjackWindow button[onclick="stand()"]');
  if (standBtn) standBtn.id = 'standBtn';

  // Reset-Button entfernen, falls vorhanden (falls noch aus altem Code)
  const resetBtn = document.querySelector('#blackjackWindow button[onclick="resetGame()"]');
  if (resetBtn) resetBtn.remove();

  // Setzt das Spiel zurück beim Laden
  player = [];
  dealer = [];
  document.getElementById('gameStatus').textContent = 'Press "Start" to begin.';
  displayHands();
  gameActive = false;
  updateButtons();
});

// --- Sudoku Fenster Initialisierung ---
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
          // Synchronisiert den Status der Checkbox mit der Sichtbarkeit der Kandidaten
          $candidateToggle.prop("checked", showing);
        }
      });

  // Löse einen Schritt
  $solveStepBtn.on("click", mySudokuJS.solveStep);
  // Löse alle
  $solveAllBtn.on("click", mySudokuJS.solveAll);
  // Board löschen
  $clearBoardBtn.on("click", mySudokuJS.clearBoard);
  // Boards mit unterschiedlichem Schwierigkeitsgrad generieren
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

  // Kandidaten anzeigen/ausblenden bei Änderung der Checkbox
  $candidateToggle.on("change", function(){
    if($candidateToggle.is(":checked"))
      mySudokuJS.showCandidates();
    else
      mySudokuJS.hideCandidates();
  });

  // Kandidaten standardmäßig beim Laden ausblenden
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


