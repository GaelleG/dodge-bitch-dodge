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
};

// ---------------------------------------------------------------------- GLOBAL
var enemies = [];
var player = [];
var friends = [];
var canvas;
var menu;
var play;
var gs = GAME_STATE.menu;

// =============================================================================
//                                 GAME LOADING
// =============================================================================

function loadGame() {

// ---------------------------------------------------------------------- SOCKET
var local = true;
try {
  var socket = new WebSocket("ws://127.0.0.1:1337");
  var socketObject = {};
  socket.onmessage = function(event) {
    local = false;
    var object = JSON.parse(event.data);
    if (object.player !== undefined) {
      socketObject["player"] = object.player;
      setPlayer();
    }
    if (object.enemies !== undefined) {
      if (gs == GAME_STATE.ingame) {
        updateEnemies(object.enemies);
      }
    }
    if (object.enemyDirection !== undefined) {
      socketObject["enemyDirection"] = object.enemyDirection;
    }
    if (object.gameStatus !== undefined) {
      if (object.gameStatus == "ingame") {
        startGame();
      }
      if (object.gameStatus == "over") {
        stopGame();
      }
    }
  };
}
catch (e) {
}

// ------------------------------------------------------------------------- DOM
canvas = document.getElementById("glcanvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
menu = document.getElementById("menu");
play = document.getElementById("play");

// =============================================================================
//                                   FUNCTIONS
// =============================================================================

// ---------------------------------------------------------------------- PLAYER
function setPlayer() {
  if (local) {
    AbstractViewport.setPlayer();
  }
  else {
    AbstractViewport.player = socketObject.player;
    socket.send(JSON.stringify({player:AbstractViewport.player}));
  }
  player = Vertex.multiplyMatrix(AbstractViewport.player, BOX_SIZE);
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
  var direction = (local)
    ? AbstractViewport.getEnemyDirection()
    : socketObject.enemyDirection;
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

// ------------------------------------------------------------------------ GAME
var gameLoop;
function startGame() {
  gs = GAME_STATE.ingame;
  emptyEnemies();
  menu.style.display = "none";
  setPlayer();
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
      movePlayer(delta);
      if (AbstractViewport.playerCollisionWithEnemies()) {
        stopGame();
        socket.send(JSON.stringify({status: "over"}));
      }
    },
    16
  );
}

function stopGame() {
  gs = GAME_STATE.over;
  clearInterval(gameLoop);
  emptyEnemies();
  emptyPlayer();
  showMenu();
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
  if (event.defaultPrevented) {
    return;
  }
  AbstractViewport.playerEvent(event);
  event.preventDefault();
}, true);

window.addEventListener("keyup", function (event) {
  if (event.defaultPrevented) {
    return;
  }
  AbstractViewport.playerEvent(event);
  event.preventDefault();
}, true);

play.addEventListener("click", function (event) {
  if (local) {
    startGame();
  }
  else {
    socket.send(JSON.stringify({status:"ready"}));
  }
});

}