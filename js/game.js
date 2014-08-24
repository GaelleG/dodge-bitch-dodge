var vertices = [];
var canvas;
var BOX_SIZE = 20;
var CANVAS_WIDTH = 
  BOX_SIZE * Math.floor(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / BOX_SIZE);
var CANVAS_HEIGHT = 
  BOX_SIZE * Math.floor(Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / BOX_SIZE);
var BOX_NB_X = Math.floor(CANVAS_WIDTH/20);
var BOX_NB_Y = Math.floor(CANVAS_HEIGHT/20);
var ENEMY_MAX_SIZE = 3;
var VIEWPORT_BOUNDS = {
  left: -CANVAS_WIDTH/2 - ENEMY_MAX_SIZE*BOX_SIZE,
  top: -CANVAS_HEIGHT/2 - ENEMY_MAX_SIZE*BOX_SIZE,
  right: CANVAS_WIDTH/2 + ENEMY_MAX_SIZE*BOX_SIZE,
  bottom: CANVAS_HEIGHT/2 + ENEMY_MAX_SIZE*BOX_SIZE,
};
var DIRECTION = {
  left:
    { x:-1, y:0 },
  right:
    { x:1, y:0 },
  top:
    { x:0, y:1 },
  bottom:
    { x:0, y:-1 },
};
var globalMove = {
  x: 0.0,
  y: 0.0
};

function setEnemy() {
  vertices.push(getRandomVertice());
}

function getRandomVertice() {
  var min = {
    x: 0,
    y: 0,
  };
  var max = {
    x: BOX_NB_X-1,
    y: BOX_NB_Y-1,
  };
  var randSize = {
    x: Math.round(Math.random() * (ENEMY_MAX_SIZE - min.x+1) + min.x+1), 
    y: Math.round(Math.random() * (ENEMY_MAX_SIZE - min.y+1) + min.y+1),
  };
  max.x -= randSize.x;
  max.y -= randSize.y;
  var randPosition = {
    x: Math.round(Math.random() * (max.x - min.x) + min.x), 
    y: Math.round(Math.random() * (max.y - min.y) + min.y), 
  };
  randSize.x *= BOX_SIZE;
  randSize.y *= BOX_SIZE;
  randPosition.x *= BOX_SIZE;
  randPosition.x -= CANVAS_WIDTH/2;
  randPosition.y *= BOX_SIZE;
  randPosition.y -= CANVAS_HEIGHT/2;
  var vertice = [
    randPosition.x + globalMove.x, randPosition.y + globalMove.y, 0.0,
    randPosition.x + randSize.x + globalMove.x, randPosition.y + globalMove.y, 0.0,
    randPosition.x + globalMove.x, randPosition.y + randSize.y + globalMove.y, 0.0,
    randPosition.x + randSize.x + globalMove.x, randPosition.y + randSize.y + globalMove.y, 0.0,
  ];
  return vertice;
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
  for (var i=0; i<vertices.length; i++) {
    vertices[i] = addMatrix(vertices[i], moveVertice);
    if (outOfBounds(vertices[i], VIEWPORT_BOUNDS)) {
      toDelete.unshift(i);
    }
  }
  for (var i=0; i<toDelete.length; i++) {
    vertices.splice(toDelete[i], 1);
  }
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

var direction = null;
var lastDirectionChange = 0;
function getRandomDirection(delta) {
  lastDirectionChange += delta;
  if (direction != null && lastDirectionChange < 1000) {
    return direction;
  }
  lastDirectionChange -= 1000;
  if (direction == null || Math.floor(Math.random() * 10) == 0) {
    var keys = Object.keys(DIRECTION);
    var newDirection;
    do {
      newDirection = DIRECTION[keys[Math.floor(Math.random() * keys.length)]];
    } while (newDirection == direction);
    direction = newDirection;
  }
  return direction;
}

function setGlobalMove(move) {
  globalMove.x += move.x;
  globalMove.y += move.y;
  globalMove.x %= BOX_SIZE;
  globalMove.y %= BOX_SIZE;
}

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
  },
  16
);
