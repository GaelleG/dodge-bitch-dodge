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

// ---------------------------------------------------------------------- GLOBAL
var enemies = [];
var player = [];
var canvas;
var menu;
var play;

// =============================================================================
//                                 GAME LOADING
// =============================================================================

function loadGame() {

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
  AbstractViewport.setPlayer();
  player = multiplyMatrix(AbstractViewport.player, BOX_SIZE);
}

function emptyPlayer() {
  AbstractViewport.emptyPlayer();
  player = [];
}

function movePlayer(delta) {
  if (AbstractViewport.movePlayer(delta)) {
    player = multiplyMatrix(AbstractViewport.player, BOX_SIZE);
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
  AbstractViewport.moveEnemies(delta, AbstractViewport.getRandomDirection(delta));
  updateEnemies();
}

function updateEnemies() {
  enemies = [];
  var abstractEnemies = AbstractViewport.enemies;
  for (var i=0; i<abstractEnemies.length; i++) {
    enemies.push(multiplyMatrix(abstractEnemies[i], BOX_SIZE));
  }
}

// -------------------------------------------------------------------- VERTICES
function multiplyMatrix(m1, size) {
  var vertice = [];
  for (var i=0; i<m1.length; i++) {
    vertice.push(m1[i] * size);
  }
  return vertice;
}

function getRandomVertice(left, top, box_nb_x, box_nb_y) {
  var min = {
    x: 0,
    y: 0,
  };
  var max = {
    x: box_nb_x,
    y: box_nb_y,
  };
  var randSize = {
    x: Math.round(Math.random() * (ENEMY_MAX_SIZE - 1) + 1),
    y: Math.round(Math.random() * (ENEMY_MAX_SIZE - 1) + 1),
  };
  max.x -= randSize.x;
  max.y -= randSize.y;
  var randPosition = {
    x: Math.round(Math.random() * max.x),
    y: Math.round(Math.random() * max.y),
  };
  randSize.x *= BOX_SIZE;
  randSize.y *= BOX_SIZE;
  randPosition.x += left;
  randPosition.x *= BOX_SIZE;
  randPosition.y += top;
  randPosition.y *= BOX_SIZE;
  var vertice = [
    randPosition.x, randPosition.y, 0.0,
    randPosition.x + randSize.x, randPosition.y, 0.0,
    randPosition.x, randPosition.y + randSize.y, 0.0,
    randPosition.x + randSize.x, randPosition.y + randSize.y, 0.0,
  ];
  return vertice;
}

// ------------------------------------------------------------------------ GAME
var gameLoop;
function startGame() {
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
      setEnemy(delta);
      moveEnemies(delta);
      movePlayer(delta);
      if (AbstractViewport.playerCollisionWithEnemies()) {
        stopGame();
      }
    },
    16
  );
}

function stopGame() {
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
    enemies.push(getRandomVertice(0, 0, BOX_NB_X, BOX_NB_Y));
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
  startGame();
});

}