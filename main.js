const basicDeck = ["Move", "Move", "Fire", "Strafe", "Delay", "Boost", "Fire", "Move", "Fire", "Strafe"];
let decks = {};
let discards = {};
let players = []; // [{name, color}]
let hand = [];
let queue = [];
let currentPlayer = 0;
let overlayStep = null;

const handDiv = document.getElementById("hand");
const queueDisplay = document.getElementById("queue-display");
const resultDisplay = document.getElementById("result-display");
const playerDisplay = document.getElementById("player-display");

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
        <input type="color" id="color${i}" value="#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}" />
      </label>
    `;
    inputs.appendChild(div);
  }
}

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

function drawHand() {
  if (decks[currentPlayer].length < 5) reshuffleDeck();
  hand = decks[currentPlayer].splice(0, 5);
  queue = [];
  updateHandDisplay();
  updateDeckInfo();
  updatePlayerDisplay();
}

function updatePlayerDisplay() {
  const player = players[currentPlayer];
  playerDisplay.innerHTML = `<span style="color: ${player.color}">${player.name}</span>: Draw your hand`;
}

function updateHandDisplay() {
  handDiv.innerHTML = "";
  hand.forEach((card, index) => {
    const btn = document.createElement("button");
    btn.innerText = card;
    btn.className = "card-btn";
    btn.style.borderColor = players[currentPlayer].color;
    btn.onclick = () => selectCard(index, btn);
    handDiv.appendChild(btn);
  });
  updateQueueDisplay();
}

function selectCard(index, btn) {
  if (queue.length >= 3 || btn.classList.contains("selected")) return;
  queue.push(hand[index]);
  btn.classList.add("selected");
  updateQueueDisplay();
}

function updateQueueDisplay() {
  queueDisplay.innerText = "Queued: " + JSON.stringify(queue);
}

function updateDeckInfo() {
  document.getElementById("deck-count").innerText = decks[currentPlayer].length;
  document.getElementById("discard-count").innerText = discards[currentPlayer].length;
}

function reshuffleDeck() {
  decks[currentPlayer] = shuffle([...discards[currentPlayer]]);
  discards[currentPlayer] = [];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

function showOverlay(message) {
  document.getElementById("overlay").style.display = "flex";
  document.getElementById("overlay-message").innerText = message;
}

function continueFromOverlay() {
  document.getElementById("overlay").style.display = "none";

  if (overlayStep === 'pass') {
    drawHand();
  } else if (overlayStep === 'resolve') {
    playerDisplay.innerText = "Actions resolved below";
    resolveActions();
  }

  overlayStep = null;
}

function addNewCard() {
  const newCard = document.getElementById("newCard").value;
  discards[currentPlayer].push(newCard);
  updateDeckInfo();
  alert(`Added "${newCard}" to ${players[currentPlayer].name}'s discard pile.`);
}