// =============================================================================
//                                  COMMON VARS
// =============================================================================

// ----------------------------------------------------------------------- CONST
var BOX_SIZE = 20;
var CANVAS_WIDTH = 
  BOX_SIZE * Math.floor(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / BOX_SIZE);
var CANVAS_HEIGHT = 
  BOX_SIZE * Math.floor(Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / BOX_SIZE);
var BOX_NB_X = Math.floor(CANVAS_WIDTH/BOX_SIZE);
var BOX_NB_Y = Math.floor(CANVAS_HEIGHT/BOX_SIZE);
var ENEMY_MAX_SIZE = 3;
var VIEWPORT_BOUNDS = {
  left: -ENEMY_MAX_SIZE*BOX_SIZE,
  top: -ENEMY_MAX_SIZE*BOX_SIZE,
  right: CANVAS_WIDTH + ENEMY_MAX_SIZE*BOX_SIZE*2,
  bottom: CANVAS_HEIGHT + ENEMY_MAX_SIZE*BOX_SIZE*2,
};
var DIRECTION = {
  left:
    { x:-1, y:0 },
  right:
    { x:1, y:0 },
  top:
    { x:0, y:-1 },
  bottom:
    { x:0, y:1 },
};

// ---------------------------------------------------------------------- GLOBAL
var vertices = [];
var enemyDirection = null;
var enemyMove = {
  x: 0.0,
  y: 0.0
};
var player = [];
var playerDirection = { x:0, y:0 };
var canvas;

// =============================================================================
//                                   FUNCTIONS
// =============================================================================

// ---------------------------------------------------------------------- PLAYER
function setPlayer() {
  player = [
    CANVAS_WIDTH/2 - BOX_SIZE/2, CANVAS_HEIGHT/2 - BOX_SIZE/2, 0.0,
    CANVAS_WIDTH/2 + BOX_SIZE/2, CANVAS_HEIGHT/2 - BOX_SIZE/2, 0.0,
    CANVAS_WIDTH/2 - BOX_SIZE/2, CANVAS_HEIGHT/2 + BOX_SIZE/2, 0.0,
    CANVAS_WIDTH/2 + BOX_SIZE/2, CANVAS_HEIGHT/2 + BOX_SIZE/2, 0.0,
  ];
  vertices.unshift(player);
}

function movePlayer(delta) {
  if (playerDirection.x == 0 && playerDirection.y == 0) {
    return;
  }
  var move = {
    x: playerDirection.x * 0.1*delta,
    y: playerDirection.y * 0.1*delta,
  };
  var moveVertice = [
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
  ];
  vertices[0] = addMatrix(vertices[0], moveVertice);
}

// --------------------------------------------------------------------- ENEMIES
function setEnemy() {
  var left = 0;
  if (enemyDirection.x < 0) {
    left = BOX_NB_X + 1;
  }
  else if (enemyDirection.x > 0) {
    left = - (ENEMY_MAX_SIZE + 1); 
  }
  var top = 0;
  if (enemyDirection.y < 0) {
    top = BOX_NB_Y + 1;
  }
  else if (enemyDirection.y > 0) {
    top = - (ENEMY_MAX_SIZE + 1);
  }
  var box_nb_x = (left == 0) ? BOX_NB_X : ENEMY_MAX_SIZE;
  var box_nb_y = (top == 0) ? BOX_NB_Y : ENEMY_MAX_SIZE;
  vertices.push(getRandomVertice(left, top, box_nb_x, box_nb_y));
}

function moveEnemies(delta, direction) {
  var toDelete = [];
  var move = {
    x: direction.x * 0.05*delta,
    y: direction.y * 0.05*delta,
  };
  setGlobalMove(move);
  var moveVertice = [
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
  ];
  for (var i=1; i<vertices.length; i++) {
    vertices[i] = addMatrix(vertices[i], moveVertice);
    if (outOfBounds(vertices[i], VIEWPORT_BOUNDS)) {
      toDelete.unshift(i);
    }
  }
  for (var i=0; i<toDelete.length; i++) {
    vertices.splice(toDelete[i], 1);
  }
}

// -------------------------------------------------------------------- VERTICES
function getRandomVertice(left, top, box_nb_x, box_nb_y) {
  var min = {
    x: 0,
    y: 0,
  };
  var max = {
    x: box_nb_x-1,
    y: box_nb_y-1,
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
  randPosition.x += enemyMove.x;
  randPosition.y += top;
  randPosition.y *= BOX_SIZE;
  randPosition.y += enemyMove.y;
  var vertice = [
    randPosition.x, randPosition.y, 0.0,
    randPosition.x + randSize.x, randPosition.y, 0.0,
    randPosition.x, randPosition.y + randSize.y, 0.0,
    randPosition.x + randSize.x, randPosition.y + randSize.y, 0.0,
  ];
  return vertice;
}

function addMatrix(m1, m2) {
  if (m1.length != m2.length) {
    return m1;
  }
  var vertice = [];
  for (var i=0; i<m1.length && i<m2.length; i++) {
    vertice.push(m1[i] + m2[i]);
  }
  return vertice;
}

function outOfBounds(vertice4, bounds) {
  for (var i=0; i<vertice4.length; i+=3) {
    var vertex = vertice4.slice(i, i+2);
    if (vertex[0] > bounds.left && vertex[0] < bounds.right &&
        vertex[1] > bounds.top && vertex[1] < bounds.bottom) {
      return false;
    }
  }
  return true;
}

// ------------------------------------------------------------------------ MOVE
var lastDirectionChange = 0;
function getRandomDirection(delta) {
  lastDirectionChange += delta;
  if (enemyDirection != null && lastDirectionChange < 1000) {
    return enemyDirection;
  }
  lastDirectionChange -= 1000;
  if (enemyDirection == null || Math.floor(Math.random() * 10) == 0) {
    var keys = Object.keys(DIRECTION);
    var newDirection;
    do {
      newDirection = DIRECTION[keys[Math.floor(Math.random() * keys.length)]];
    } while (newDirection == enemyDirection);
    enemyDirection = newDirection;
  }
  return enemyDirection;
}

function setGlobalMove(move) {
  addMoves(enemyMove, move, BOX_SIZE);
}

function addMoves(move1, move2, modulo, clamp) {
  move1.x += move2.x;
  move1.y += move2.y;
  if (modulo !== undefined) {
    move1.x %= modulo;
    move1.y %= modulo;
  }
  if (clamp != undefined) {
    if (move1.x > clamp.max) {
      move1.x = clamp.max;
    }
    if (move1.y > clamp.max) {
      move1.y = clamp.max;
    }
    if (move1.x < clamp.min) {
      move1.x = clamp.min;
    }
    if (move1.y < clamp.min) {
      move1.y = clamp.min;
    }
  }
}

// =============================================================================
//                                FUNCTIONS CALL
// =============================================================================

setPlayer();
setInterval(
  function() {
    setEnemy();
  },
  500
);

var delta = 0;
var oldTime = Date.now();
var newTime = Date.now();
setInterval(
  function() {
    newTime = Date.now();
    delta = newTime - oldTime;
    oldTime = newTime;
    moveEnemies(delta, getRandomDirection(delta));
    movePlayer(delta);
  },
  16
);

window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented) {
    return;
  }
  switch (event.keyCode) {
    case 40:
      addMoves(playerDirection, DIRECTION.bottom, undefined, { max:1, min:-1 });
      break;
    case 38:
      addMoves(playerDirection, DIRECTION.top, undefined, { max:1, min:-1 });
      break;
    case 37:
      addMoves(playerDirection, DIRECTION.left, undefined, { max:1, min:-1 });
      break;
    case 39:
      addMoves(playerDirection, DIRECTION.right, undefined, { max:1, min:-1 });
      break;
    default:
      return;
  }
  event.preventDefault();
}, true);

window.addEventListener("keyup", function (event) {
  if (event.defaultPrevented) {
    return;
  }
  switch (event.keyCode) {
    case 40:
      addMoves(playerDirection, DIRECTION.top, undefined, { max:1, min:-1 });
      break;
    case 38:
      addMoves(playerDirection, DIRECTION.bottom, undefined, { max:1, min:-1 });
      break;
    case 37:
      addMoves(playerDirection, DIRECTION.right, undefined, { max:1, min:-1 });
      break;
    case 39:
      addMoves(playerDirection, DIRECTION.left, undefined, { max:1, min:-1 });
      break;
    default:
      return;
  }
  event.preventDefault();
}, true);