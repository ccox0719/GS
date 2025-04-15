const basicDeck = ["Move", "Move", "Fire", "Strafe", "Delay", "Boost", "Fire", "Move", "Fire", "Strafe"];
let decks = {};
let discards = {};
let players = [];
let hand = [];
let queue = [];
let currentPlayer = 0;
let overlayStep = null;
let activeTooltipCard = null;
let tooltipTimeout = null;

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// DOM references
const handDiv = document.getElementById("hand");
const queueDisplay = document.getElementById("queue-display");
const resultDisplay = document.getElementById("result-display");
const playerDisplay = document.getElementById("player-display");

// Build inputs for each player
function buildPlayerInputs() {
  const count = parseInt(document.getElementById("player-count").value);
  const inputs = document.getElementById("player-inputs");
  inputs.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>Player ${i} Name:
        <input type="text" id="name${i}" value="Player ${i}" />
      </label>
      <label> Color:
        <input type="color" id="color${i}" value="#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}" />
      </label>
    `;
    inputs.appendChild(div);
  }
}

// Start the game
function startGame() {
  const count = parseInt(document.getElementById("player-count").value);
  players = [];

  for (let i = 1; i <= count; i++) {
    const name = document.getElementById(`name${i}`).value;
    const color = document.getElementById(`color${i}`).value;
    players.push({ name, color });
    decks[i - 1] = [...basicDeck];
    discards[i - 1] = [];
  }

  document.getElementById("setup-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  drawHand();
}

// Draw hand for current player
function drawHand() {
  if (decks[currentPlayer].length < 5 && discards[currentPlayer].length > 0) {
    reshuffleDeck();
  }

  hand = decks[currentPlayer].splice(0, 5);
  queue = [];
  updateHandDisplay();
  updateDeckInfo();
  updatePlayerDisplay();
}

// Update player banner
function updatePlayerDisplay() {
  const player = players[currentPlayer];
  playerDisplay.innerHTML = `<span style="color: ${player.color}">${player.name}</span>: Draw your hand`;
}

// Display cards in hand
function updateHandDisplay() {
  handDiv.innerHTML = "";
  hand.forEach((card, index) => {
    const btn = document.createElement("button");
    btn.innerText = card;
    btn.className = "card-btn";
    btn.style.borderColor = players[currentPlayer].color;
    btn.onclick = () => selectCard(index, btn);
    attachTooltipEvents(btn, card);
    handDiv.appendChild(btn);
  });
  updateQueueDisplay();
}

// Select a card into queue
function selectCard(index, btn) {
  if (queue.length >= 3 || btn.classList.contains("selected")) return;
  queue.push(hand[index]);
  btn.classList.add("selected");
  updateQueueDisplay();
}

// Update queue display
function updateQueueDisplay() {
  queueDisplay.innerText = "Queued: " + JSON.stringify(queue);
}

// Update deck & discard counts
function updateDeckInfo() {
  document.getElementById("deck-count").innerText = decks[currentPlayer].length;
  document.getElementById("discard-count").innerText = discards[currentPlayer].length;
}

// Reshuffle discard pile into deck
function reshuffleDeck() {
  decks[currentPlayer] = shuffle([...discards[currentPlayer]]);
  discards[currentPlayer] = [];
}

// Fisher-Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Submit turn
function submitTurn() {
  if (queue.length < 3) {
    alert("Select 3 actions to submit.");
    return;
  }

  discards[currentPlayer].push(...hand);
  hand = [];
  queue = [];
  updateDeckInfo();

  if (currentPlayer < players.length - 1) {
    currentPlayer++;
    overlayStep = 'pass';
    showOverlay(`Pass to ${players[currentPlayer].name}`);
  } else {
    overlayStep = 'resolve';
    showOverlay("Ready to Resolve Actions");
  }
}

// Resolve actions for all players
function resolveActions() {
  let result = "";
  for (let i = 0; i < 3; i++) {
    result += `<strong>Step ${i + 1}</strong><br>`;
    players.forEach((p, index) => {
      const action = discards[index][discards[index].length - 5 + i];
      if (action === "Fire") {
        const roll = Math.ceil(Math.random() * 6);
        result += `<span style="color:${p.color}">${p.name}</span> fires! 🎲 Rolled a ${roll}<br>`;
      } else {
        result += `<span style="color:${p.color}">${p.name}</span> performs ${action}<br>`;
      }
    });
    result += "<br>";
  }
  resultDisplay.innerHTML = result;
  currentPlayer = 0;
  drawHand();
}

// Show overlay between turns
function showOverlay(message) {
  document.getElementById("overlay").style.display = "flex";
  document.getElementById("overlay-message").innerText = message;
}

function continueFromOverlay() {
  document.getElementById("overlay").style.display = "none";
  if (overlayStep === 'pass') drawHand();
  else resolveActions();
  overlayStep = null;
}

// Add new card from dropdown
function addNewCard() {
  const newCard = document.getElementById("newCard").value;
  discards[currentPlayer].push(newCard);
  updateDeckInfo();
  alert(`Added "${newCard}" to ${players[currentPlayer].name}'s discard pile.`);
}

// Load and display enhancement cards
function loadCardBrowser() {
  fetch('cards.json')
    .then(res => res.json())
    .then(data => renderCardList(data));
}
function renderCardList(cards) {
  const container = document.getElementById('card-list');
  container.innerHTML = "";
  cards.forEach(card => {
    const div = document.createElement('div');
    div.className = 'card-tile';
    const icons = card.symbols ? card.symbols.join(" ") : "";
    const imageHtml = card.image
      ? `<img src="${card.image}" alt="${card.name}" class="card-image" />`
      : "";
    
    div.innerHTML = `
      ${imageHtml}
      <h3>${icons} ${card.name}</h3>
      <div class="type ${card.type}">${card.type}</div>
      <div class="description">${card.description || "No description provided."}</div>
      <button onclick="addEnhancementCard('${card.name}')">Add to Discard</button>
    `;
    container.appendChild(div);
  });
}

function hideCardBrowser() {
  document.getElementById('card-browser').style.display = 'none';
}

function toggleSymbolReference() {
  const ref = document.getElementById('symbol-reference');
  ref.style.display = ref.style.display === "none" ? "block" : "none";
}

function addEnhancementCard(cardName) {
  if (!players[currentPlayer]) return alert("No active player.");
  discards[currentPlayer].push(cardName);
  updateDeckInfo();
  alert(`Added "${cardName}" to ${players[currentPlayer].name}'s discard pile.`);
}

// 💡 Large tooltip logic
function showCardTooltip(cardName) {
  fetch('cards.json')
    .then(res => res.json())
    .then(cards => {
      const card = cards.find(c => c.name === cardName);
      if (!card) return;
      const overlay = document.getElementById("tooltip-overlay");
      const box = document.getElementById("card-tooltip-large");
      const icons = card.symbols ? card.symbols.join(" ") : "";

      box.innerHTML = `
        <h2>${card.name}</h2>
        <div class="type">${card.type}</div>
        <div class="symbols">${icons}</div>
        <div class="description">${card.description}</div>
      `;

      overlay.style.display = "flex";
      activeTooltipCard = cardName;
    });
}

function hideCardTooltip() {
  const overlay = document.getElementById("tooltip-overlay");
  overlay.style.display = "none";
  activeTooltipCard = null;
}

function attachTooltipEvents(btn, cardName) {
  if (isTouchDevice) {
    btn.addEventListener("touchstart", (e) => {
      tooltipTimeout = setTimeout(() => {
        showCardTooltip(cardName);
      }, 400);
    });
    btn.addEventListener("touchend", () => clearTimeout(tooltipTimeout));
    btn.addEventListener("touchmove", () => clearTimeout(tooltipTimeout));
  } else {
    btn.addEventListener("mouseenter", () => showCardTooltip(cardName));
    btn.addEventListener("mouseleave", hideCardTooltip);
  }
}

document.getElementById("tooltip-overlay").addEventListener("click", hideCardTooltip);

window.addEventListener("DOMContentLoaded", buildPlayerInputs);
