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
var playerScore;
var friends = {};
var canvas;
var menu;
var play;
var loading;
var players;
var gs = GAME_STATE.menu;
var local = true;
var socket = null;
var socketObject = {};

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

// =============================================================================
//                                   FUNCTIONS
// =============================================================================

// ---------------------------------------------------------------------- SOCKET
function setWebSocket() {
  var getInit = setInterval(function(){
    if (!local) {
      socket.send(JSON.stringify({get:"init"}));
    }
  }, 100);
  (function(getInit){
    setTimeout(function(){
      clearInterval(getInit);
      if (local) {
        startGame();
      }
    }, 5000);
  })(getInit);
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
    socket.send(JSON.stringify({player: AbstractViewport.player}));
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
    playerScore = document.createElement("div");
    playerScore.id = "me";
    var colorDiv = document.createElement("div");
    colorDiv.className = "color";
    playerScore.appendChild(colorDiv);
    var scoreDiv = document.createElement("div");
    scoreDiv.className = "score";
    playerScore.appendChild(scoreDiv);
    var nameDiv = document.createElement("div");
    nameDiv.className = "name";
    playerScore.appendChild(nameDiv);
    players.appendChild(playerScore);
  }
}

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
  var indexes = Object.keys(_friends);
  for (var index in friends) {
    if(friends.hasOwnProperty(index) && indexes.indexOf(index) == -1){
      delete friends[index];
      removeFriendDom(index);
    }
    else if (friends[index].length < 12) {
      delete friends[index];
      removeFriendDom(index);
    }
  }
  for (var i=0; i<indexes.length; i++) {
    if (_friends[indexes[i]].length < 12) {
      delete friends[indexes[i]];
      removeFriendDom(indexes[i]);
    }
    else {
      if (friends[indexes[i]] === undefined) {
        friends[indexes[i]] = {};
      }
      friends[indexes[i]].vertices = Vertex.multiplyMatrix(_friends[indexes[i]], BOX_SIZE);
      if (friends[indexes[i]].color === undefined) {
        friends[indexes[i]].color = Math.floor(Math.random()*COLORS.length);
      }
      setFriendDom(indexes[i]);
    }
  }
}

function setFriendDom(index) {
  if (document.getElementById("friend" + index) === null) {
    var friendDiv = document.createElement("div");
    friendDiv.id = "friend" + index;
    var colorDiv = document.createElement("div");
    colorDiv.className = "color";
    colorDiv.style.backgroundColor = "rgba(" + COLORS[friends[index].color][0] + "," + COLORS[friends[index].color][1] + "," + COLORS[friends[index].color][2] + "," + COLORS[friends[index].color][3] + ")";
    friendDiv.appendChild(colorDiv);
    var scoreDiv = document.createElement("div");
    scoreDiv.className = "score";
    friendDiv.appendChild(scoreDiv);
    var nameDiv = document.createElement("div");
    nameDiv.className = "name";
    friendDiv.appendChild(nameDiv);
    players.appendChild(friendDiv);
  }
}

function removeFriendDom(index) {
  var friendDom = document.getElementById("friend" + index);
  if (friendDom !== null) {
    friendDom.remove();
  }
}

// ------------------------------------------------------------------------ GAME
var gameLoop;
function startGame() {
  setPlayerDom();
  gs = GAME_STATE.ingame;
  if (!local) {
    socket.send(JSON.stringify({status:gs}));
  }
  play.style.display = "inline";
  loading.style.display = "none";
  menu.style.display = "none";
  setPlayer();
  playerInvincibility = PLAYER_INVINCIBILITY;
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
        if (!local) {
          socket.send(JSON.stringify({status: "over"}));
        }
      }
    },
    10
  );
}

function stopGame() {
  gs = GAME_STATE.over;
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

function loadGame() {
  gs = GAME_STATE.loading;
  play.style.display = "none";
  loading.style.display = "block";
  if (local) {
    setWebSocket();
  }
  else {
    socket.send(JSON.stringify({get:"init"}));
  }
}

// ------------------------------------------------------------------------ MENU
function showMenu() {
  menu.style.display = "table-cell";
  enemies = [];
  for (var i=0; i<((BOX_NB_X > BOX_NB_Y) ? BOX_NB_X*2 : BOX_NB_Y*2); i++) {
    enemies.push(Vertex.getRandomVertice(0, 0, BOX_NB_X, BOX_NB_Y, BOX_SIZE, AbstractViewport.ENEMY_MAX_SIZE, {x:0,y:0}));
  }
}

// =============================================================================
//                                FUNCTIONS CALL
// =============================================================================

showMenu();

// ---------------------------------------------------------------------- EVENTS
window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented || gs != GAME_STATE.ingame) {
    return;
  }
  AbstractViewport.playerEvent(event);
  event.preventDefault();
}, true);

window.addEventListener("keyup", function (event) {
  if (event.defaultPrevented || gs != GAME_STATE.ingame) {
    return;
  }
  AbstractViewport.playerEvent(event);
  event.preventDefault();
}, true);

play.addEventListener("click", function (event) {
  loadGame();
});

}