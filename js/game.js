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

// ---------------------------------------------------------------------- GLOBAL
var enemies = [];
var player = [];
var playerInvincibility = 0;
var friends = [];
var canvas;
var menu;
var play;
var gs = GAME_STATE.menu;
var local = true;
var socket = null;
var socketObject = {};
var loading = false;

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

// =============================================================================
//                                   FUNCTIONS
// =============================================================================

// ---------------------------------------------------------------------- SOCKET
function setWebSocket() {
  (function(){
    setTimeout(function(){
      if (local) {
        startGame();
      }
    }, 5000);
  })();
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
  for (var i=0; i<indexes.length; i++) {
    while (friends.length < indexes.length) {
      friends.push([]);
    }
    friends[indexes[i]] = Vertex.multiplyMatrix(_friends[indexes[i]], BOX_SIZE);
  }
}

// ------------------------------------------------------------------------ GAME
var gameLoop;
function startGame() {
  gs = GAME_STATE.ingame;
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
  clearInterval(gameLoop);
  emptyEnemies();
  emptyPlayer();
  friends = [];
  showMenu();
}

function loadGame() {
  gs = GAME_STATE.loading;
  play.style.display = "none";
  loading.style.display = "block";
  if (local) {
    setWebSocket();
  }
  if (!local) {
    socket.send(JSON.stringify({get:'enemyDirection'}));
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