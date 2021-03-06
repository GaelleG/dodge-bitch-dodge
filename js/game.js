// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//
//                               Client game loop
//
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

// =============================================================================
//                                  COMMON VARS
// =============================================================================

// ----------------------------------------------------------------------- CONST
var CANVAS_WIDTH = Math.min(
  document.documentElement.clientWidth,
  window.innerWidth,
  document.documentElement.clientHeight, 
  window.innerHeight);
var CANVAS_HEIGHT = CANVAS_WIDTH;
var BOX_SIZE = CANVAS_HEIGHT/AbstractViewport.BOX_NB_X;
var BOX_NB_X = AbstractViewport.BOX_NB_X;
var BOX_NB_Y = AbstractViewport.BOX_NB_Y;
var ENEMY_MAX_SIZE = AbstractViewport.ENEMY_MAX_SIZE;
var GAME_STATE = {
  menu: 0,
  ingame: 1,
  over: 2,
  loading: 3,
};
var PLAYER_INVINCIBILITY = 2000;
var COLORS = [
  // Gagris blue
  [56, 124, 181, 1],
  // Gagris orange
  [232, 137, 37, 1],
  // Gagris yellow
  [255, 189, 48, 1],
  // Gagris cyan
  [121, 195, 224, 1],
  // Gagris purple
  [159, 84, 191, 1],
  // Gagris green
  [85, 181, 107, 1],
  // Gagris red
  [229, 82, 82, 1],
];

// ---------------------------------------------------------------------- GLOBAL
var enemies = [];
var player = [];
var playerInvincibility = 0;
var playerColor = Math.floor(Math.random()*COLORS.length);
var playerName = localStorage.getItem("dbd-name");
if (playerName === null)
  playerName = "";
var friends = {};
var friendsIndexes = [];
var friendsMaxDisplayedNb = -1;
var canvas;
var menu;
var play;
var loading;
var playerNameDiv;
var playerColorDiv;
var testPlayerName;
var players;
var gs = -1;
var local = true;
var socket = null;
var socketObject = {};
var time = 0;
var score = 0;
var bestScore = localStorage.getItem("dbd-bestscore");
if (bestScore === null || isNaN(bestScore))
  bestScore = 0;
else
  bestScore = parseInt(bestScore);
var bestScoreDiv;
var favicon;

// =============================================================================
//                                 GAME LOADING
// =============================================================================

function setGame() {

// ------------------------------------------------------------------------- DOM
canvas = document.getElementById("glcanvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
menu = document.getElementById("menu");
play = document.getElementById("play");
loading = document.getElementById("loading");
players = document.getElementById("players");
playerNameDiv = document.getElementById("name");
playerColorDiv = document.getElementById("color");
colorsDiv = document.getElementById("colorslist");
bestScoreDiv = document.getElementById("bestscore");
favicon = document.getElementById("favicon");

// =============================================================================
//                                   FUNCTIONS
// =============================================================================

// ---------------------------------------------------------------------- SOCKET
function setWebSocket() {
  var getInit = setInterval(function(){
    if (socket !== undefined && socket.readyState !== undefined) {
      if (socket.readyState == WebSocket.OPEN) {
        socket.send(JSON.stringify({get:"init"}));
      }
      else if (socket.readyState == WebSocket.CLOSING || socket.readyState == WebSocket.CLOSED) {
        clearInterval(getInit);
        startGame();
      }
    }
  }, 100);
  try {
    socket = new WebSocket("ws://127.0.0.1:1337");
    socketObject = {};
    socket.onmessage = function(event) {
      local = false;
      var object = JSON.parse(event.data);
      if (object.enemies !== undefined) {
        if (gs == GAME_STATE.ingame || gs == GAME_STATE.loading) {
          updateEnemies(object.enemies);
        }
      }
      if (object.newEnemy !== undefined) {
        if (gs == GAME_STATE.ingame) {
          addEnemy(object.newEnemy);
        }
      }
      if (object.enemyDirection !== undefined) {
        socketObject.enemyDirection = object.enemyDirection;
        if (gs == GAME_STATE.loading) {
          clearInterval(getInit);
          startGame();
        }
      }
      if (object.friends !== undefined) {
        updateFriends(object.friends);
      }
    };
    socket.onclose = function() {
      local = true;
    };
  }
  catch (e) {
    startGame();
  }
}

// ---------------------------------------------------------------------- PLAYER
function setPlayer() {
  AbstractViewport.setPlayer();
  player = Vertex.multiplyMatrix(AbstractViewport.player, BOX_SIZE);
  if (!local) {
    socket.send(JSON.stringify({
      status:gs,
      player: AbstractViewport.player,
      playerName: playerName,
      playerColor: playerColor
    }));
  }
}

function emptyPlayer() {
  AbstractViewport.emptyPlayer();
  player = [];
}

function movePlayer(delta) {
  if (AbstractViewport.movePlayer(delta)) {
    player = Vertex.multiplyMatrix(AbstractViewport.player, BOX_SIZE);
    if (!local) {
      socket.send(JSON.stringify({player:AbstractViewport.player}));
    }
  }
}

function setPlayerDom() {
  if (document.getElementById("me") === null) {
    var playerScore = document.createElement("div");
    playerScore.id = "me";
    playerScore.setAttribute("score", score);
    var colorDiv = document.createElement("div");
    colorDiv.className = "color";
    colorDiv.style.backgroundColor = "rgb(" + COLORS[playerColor][0] + "," + COLORS[playerColor][1] + "," + COLORS[playerColor][2] + ")";
    playerScore.appendChild(colorDiv);
    var scoreDiv = document.createElement("div");
    scoreDiv.className = "score";
    scoreDiv.id = "score";
    scoreDiv.innerHTML = "0";
    playerScore.appendChild(scoreDiv);
    var nameDiv = document.createElement("div");
    nameDiv.className = "name";
    nameDiv.innerHTML = (playerName.length > 0) ? playerName : "Noname";
    playerScore.appendChild(nameDiv);
    players.appendChild(playerScore);
    setFriendsMaxDispayedNb();
  }
}

function updatePlayerDom() {
  if (Object.keys(friends).length === 0) {
    return;
  }
  var meDiv = document.getElementById("me");
  if (meDiv === null) return;
  var nextDom = meDiv.nextSibling;
  if (nextDom !== null) {
    if (parseInt(meDiv.getAttribute("score")) <= parseInt(nextDom.getAttribute("score")))  {
      players.insertBefore(nextDom, meDiv);
    }
  }
  if (Array.prototype.indexOf.call(meDiv.parentNode.childNodes, meDiv) > friendsMaxDisplayedNb) {
    meDiv.className = "not-ranked";
  }
  else {
    meDiv.className = "";
  }
}

testPlayerName = function() {
  playerNameDiv.value = playerNameDiv.value.replace(/([^a-zA-Z0-9])/g,"");
  playerName = playerNameDiv.value;
  localStorage.setItem("dbd-name", playerName);
};

setPlayerColor = function(c) {
  if (c === undefined || c >= COLORS.length || c == playerColor) {
    return;
  }
  playerColor = c;
  setColorSelector();
};

// --------------------------------------------------------------------- ENEMIES
function setEnemy(delta) {
  AbstractViewport.setEnemy(delta);
  updateEnemies();
}

function emptyEnemies() {
  AbstractViewport.emptyEnemies();
  enemies = [];
}

function moveEnemies(delta) {
  if (local) {
    AbstractViewport.setEnemyDirection(delta);
  }
  var direction = (local) ? AbstractViewport.getEnemyDirection() : socketObject.enemyDirection;
  AbstractViewport.moveEnemies(delta, direction);
  updateEnemies();
}

function updateEnemies(_enemies) {
  enemies = [];
  if (_enemies !== undefined) {
    AbstractViewport.emptyEnemies();
    AbstractViewport.enemies = _enemies;
  }
  for (var i=0; i<AbstractViewport.enemies.length; i++) {
    enemies.push(Vertex.multiplyMatrix(AbstractViewport.enemies[i], BOX_SIZE));
  }
}

function addEnemy(enemy) {
  AbstractViewport.enemies.push(enemy);
  AbstractViewport.enemies.push(Vertex.multiplyMatrix(enemy, BOX_SIZE));
}

// --------------------------------------------------------------------- FRIENDS
function updateFriends(_friends) {
  if (gs != GAME_STATE.ingame) {
    return;
  }
  for (var index in _friends) {
    if ((_friends[index].hasOwnProperty("status") && _friends[index].status == GAME_STATE.over) ||
        ((friends[index] === undefined || friends[index].vertices === undefined) && !_friends[index].hasOwnProperty("vertices"))) {
      delete friends[index];
      removeFriendDom(index);
    }
    else {
      if (friends[index] === undefined) {
        friends[index] = {};
      }
      if (_friends[index].hasOwnProperty("vertices")) {
        friends[index].vertices = Vertex.multiplyMatrix(_friends[index].vertices, BOX_SIZE);
      }
      var domSetNeeded = [];
      if (_friends[index].hasOwnProperty("color") || friends[index].color === undefined) {
        domSetNeeded.push("color");
        _friends[index].color = parseInt(_friends[index].color);
        if (!isNaN(_friends[index].color) && _friends[index].color >= 0 && _friends[index].color < COLORS.length) {
          friends[index].color = _friends[index].color;
        }
        else {
          friends[index].color = Math.floor(Math.random()*COLORS.length);
        }
      }
      else if (friends[index].color === undefined) {
        domSetNeeded.push("color");
        friends[index].color = Math.floor(Math.random()*COLORS.length);
      }
      if (_friends[index].hasOwnProperty("name")) {
        domSetNeeded.push("name");
        friends[index].name = _friends[index].name;
      }
      if (_friends[index].hasOwnProperty("score")) {
        domSetNeeded.push("score");
        friends[index].score = _friends[index].score;
        sortFriends();
      }
      setFriendDom(index, domSetNeeded);
    }
  }
}

function sortFriends() {
  friendsIndexes = Object.keys(friends);
  friendsIndexes.sort(function(a, b) {
    return friends[b].score - friends[a].score;
  });
}

function setFriendDom(index, domSetNeeded) {
  if (domSetNeeded === undefined || domSetNeeded.length === 0) {
    return;
  }
  var friendDom = document.getElementById("friend" + index);
  var i=0;
  var playersListFull = (friends[index].score < getLowestVisibleScore() || friendsMaxDisplayedNb == -1);
  if (friendDom === null) {
    if (playersListFull) {
      return;
    }
    var friendDiv = document.createElement("div");
    friendDiv.id = "friend" + index;
    friendDiv.setAttribute("score", (friends[index].score === undefined) ? 0 : friends[index].score);
    var colorDiv = document.createElement("div");
    colorDiv.className = "color";
    colorDiv.style.backgroundColor = "rgba(" + COLORS[friends[index].color][0] + "," + COLORS[friends[index].color][1] + "," + COLORS[friends[index].color][2] + "," + COLORS[friends[index].color][3] + ")";
    friendDiv.appendChild(colorDiv);
    var scoreDiv = document.createElement("div");
    scoreDiv.className = "score";
    scoreDiv.innerHTML = (friends[index].score === undefined) ? 0 : friends[index].score;
    friendDiv.appendChild(scoreDiv);
    var nameDiv = document.createElement("div");
    nameDiv.className = "name";
    nameDiv.innerHTML = (friends[index].name !== undefined && friends[index].name.length > 0) ? friends[index].name : "Noname";
    friendDiv.appendChild(nameDiv);
    var inserted = false;
    for (i=0; i<players.childNodes.length; i++) {
      var domScore = (players.childNodes[i].id == "me") ? score : friends[players.childNodes[i].id.substring(("friend").length, players.childNodes[i].id.length)].score;
      if (domScore < friends[index].score) {
        players.insertBefore(friendDiv, players.childNodes[i]);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      players.appendChild(friendDiv);
    }
  }
  else {
    if (playersListFull) {
      removeFriendDom(index);
    }
    for (i=0; i<friendDom.childNodes.length; i++) {
      if (domSetNeeded.indexOf("name") > -1 && friendDom.childNodes[i].className == "name") {
        friendDom.childNodes[i].innerHTML = (friends[index].name.length > 0) ? friends[index].name : "Noname";
      }
      if (domSetNeeded.indexOf("score") > -1 && friendDom.childNodes[i].className == "score") {
        friendDom.childNodes[i].innerHTML = friends[index].score;
        friendDom.setAttribute("score", friends[index].score);
        updateFriendDom(index);
      }
    }
  }
}

function updateFriendDom(index) {
  var friendDiv = document.getElementById("friend"+index);
  if (friendDiv === null) return;
  var nextDom = friendDiv.nextSibling;
  if (nextDom === null) return;
  if (parseInt(friendDiv.getAttribute("score")) <= parseInt(nextDom.getAttribute("score")))  {
    players.insertBefore(nextDom, friendDiv);
  }
}

function removeFriendDom(index) {
  var friendDom = document.getElementById("friend" + index);
  if (friendDom !== null) {
    friendDom.parentNode.removeChild(friendDom);
  }
}

function setFriendsMaxDispayedNb() {
  var playerScoreDiv = document.getElementById("me");
  if (playerScoreDiv === null) {
    friendsMaxDisplayedNb = -1;
    return;
  }
  var listHeight = (window.innerHeight < window.innerWidth) ? window.innerHeight : window.innerHeight - CANVAS_HEIGHT;
  var itemHeight = playerScoreDiv.clientHeight;
  friendsMaxDisplayedNb = Math.floor(listHeight/itemHeight) - 1;
}

function getLowestVisibleScore() {
  if (friendsIndexes[friendsMaxDisplayedNb] === undefined) {
    return -1;
  }
  if (friends[friendsIndexes[friendsMaxDisplayedNb]].score === undefined) {
    return -1;
  }
  return friends[friendsIndexes[friendsMaxDisplayedNb]].score;
}

// ------------------------------------------------------------------------ GAME
function loadGame() {
  gs = GAME_STATE.loading;
  playerNameDiv.setAttribute("readonly", true);
  play.style.display = "none";
  loading.style.display = "block";
  if (playerColorDiv !== null) {
    playerColorDiv.className = "";
  }
  if (local) {
    setWebSocket();
  }
  else {
    socket.send(JSON.stringify({get:"init"}));
  }
}

var gameLoop;
function startGame() {
  setPlayerDom();
  gs = GAME_STATE.ingame;
  play.style.display = "inline";
  loading.style.display = "none";
  menu.style.display = "none";
  setPlayer();
  playerInvincibility = PLAYER_INVINCIBILITY;
  initScore();
  var delta = 0;
  var oldTime = Date.now();
  var newTime = Date.now();
  gameLoop = setInterval(
    function() {
      newTime = Date.now();
      delta = newTime - oldTime;
      oldTime = newTime;
      if (local) {
        setEnemy(delta);
      }
      moveEnemies(delta);
      if (movePlayer(delta)) {
        if (!local) {
          socket.send(JSON.stringify({player: AbstractViewport.player}));
        }
      }
      playerInvincibility -= delta;
      if (AbstractViewport.playerCollisionWithEnemies() && playerInvincibility <= 0) {
        stopGame();
      }
      updateScore(delta);
    },
    10
  );
}

function stopGame() {
  gs = GAME_STATE.over;
  playerNameDiv.setAttribute("readonly", false);
  if (!local) {
    socket.send(JSON.stringify({status:gs}));
  }
  clearInterval(gameLoop);
  emptyEnemies();
  emptyPlayer();
  friends = {};
  while (players.firstChild) {
    players.removeChild(players.firstChild);
  }
  showMenu();
}

// ----------------------------------------------------------------------- SCORE
function initScore() {
  time = 0;
  score = 0;
}

function updateScore(delta) {
  time += delta;
  var prevScore = score;
  score = Math.floor(time/1000);
  if (score != prevScore) {
    var scoreDiv = document.getElementById("score");
    document.getElementById("me").setAttribute("score", score);
    if (scoreDiv !== null) {
      scoreDiv.innerHTML = new Intl.NumberFormat("en-EN").format(score);
      if (!local) {
        socket.send(JSON.stringify({score:score}));
      }
      updatePlayerDom();
    }
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("dbd-bestscore", bestScore);
      if (bestScoreDiv !== null) {
        bestScoreDiv.innerHTML = bestScore;
      }
    }
  }
}

// ------------------------------------------------------------------------ MENU
function showMenu() {
  gs = GAME_STATE.menu;
  menu.style.display = "table-cell";
  enemies = [];
  for (var i=0; i<((BOX_NB_X > BOX_NB_Y) ? BOX_NB_X*2 : BOX_NB_Y*2); i++) {
    enemies.push(Vertex.getRandomVertice(0, 0, BOX_NB_X, BOX_NB_Y, BOX_SIZE, AbstractViewport.ENEMY_MAX_SIZE, {x:0,y:0}));
  }
  showSettings();
}

function showSettings() {
  setColorSelector();
  playerNameDiv.removeAttribute("readonly");
  playerNameDiv.value = playerName;
  playerNameDiv.focus();
  bestScoreDiv.innerHTML = bestScore;
}

function setColorSelector() {
  var n = 0;
  if (playerColorDiv !== null) {
    playerColorDiv.style.backgroundColor = "rgb(" + COLORS[playerColor][0] + "," + COLORS[playerColor][1] + "," + COLORS[playerColor][2] + ")";
    playerColorDiv.className = "editable";
  }
  while (colorsDiv.firstChild) {
    colorsDiv.removeChild(colorsDiv.firstChild);
  }
  for (var c in COLORS) {
    var div = document.createElement("div");
    div.style.backgroundColor = "rgb(" + COLORS[c][0] + "," + COLORS[c][1] + "," + COLORS[c][2] + ")";
    div.setAttribute("onmouseover", "setPlayerColor("+c+")");
    if (c == playerColor) {
      div.className = "selected";
    }
    colorsDiv.appendChild(div);
  }
  favicon.setAttribute("href", "img/"+playerColor+"-favicon.png");
}

// =============================================================================
//                                FUNCTIONS CALL
// =============================================================================

showMenu();
setFriendsMaxDispayedNb();

// ---------------------------------------------------------------------- EVENTS
window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented || gs != GAME_STATE.ingame) {
    return;
  }
  AbstractViewport.playerEvent(event);
  event.preventDefault();
}, true);

window.addEventListener("keyup", function (event) {
  if (gs == GAME_STATE.menu) {
    testPlayerName();
    if (event.keyCode == 13) {
      loadGame();
    }
  }
  else if (gs == GAME_STATE.ingame) {
    AbstractViewport.playerEvent(event);
  }
  event.preventDefault();
}, true);

window.addEventListener("resize", function() {
  setFriendsMaxDispayedNb();
});

play.addEventListener("click", function (event) {
  loadGame();
});

playerColorDiv.addEventListener("mouseover", function() {
  if (playerColorDiv.className == "editable") {
    colorsDiv.style.display = "block";
  }
});

playerColorDiv.addEventListener("mouseout", function() {
  colorsDiv.style.display = "none";
});

colorsDiv.addEventListener("mouseup", function(event) {
  this.style.display = "none";
});

}