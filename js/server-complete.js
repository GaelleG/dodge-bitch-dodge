// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//
//                                    Vertex                                    
//
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function Vertex() {}

Vertex.getRandomVertice = function(left, top, box_nb_x, box_nb_y, box_size, max_size, move) {
  var min = {
    x: 0,
    y: 0,
  };
  var max = {
    x: box_nb_x,
    y: box_nb_y,
  };
  var randSize = {
    x: Math.round(Math.random() * (max_size - 1) + 1),
    y: Math.round(Math.random() * (max_size - 1) + 1),
  };
  max.x -= randSize.x;
  max.y -= randSize.y;
  var randPosition = {
    x: Math.round(Math.random() * max.x),
    y: Math.round(Math.random() * max.y),
  };
  randSize.x *= box_size;
  randSize.y *= box_size;
  randPosition.x += left;
  randPosition.x *= box_size;
  randPosition.x += move.x;
  randPosition.y += top;
  randPosition.y *= box_size;
  randPosition.y += move.y;
  var vertice = [
    randPosition.x, randPosition.y, 0.0,
    randPosition.x + randSize.x, randPosition.y, 0.0,
    randPosition.x, randPosition.y + randSize.y, 0.0,
    randPosition.x + randSize.x, randPosition.y + randSize.y, 0.0,
  ];
  return vertice;
};

Vertex.addMatrix = function(m1, m2, bounds) {
  if (m1.length != m2.length) {
    return m1;
  }
  var clamp = {
    x: 0.0,
    y: 0.0,
  };
  var i=0;
  if (bounds !== undefined) {
    for (i=0; i<m1.length && i<m2.length; i++) {
      if (i%3 === 0) {
        if (m1[i] + m2[i] < bounds.left && clamp.x <= 0) {
          clamp.x -= m1[i] + m2[i] + bounds.left;
        }
        if (m1[i] + m2[i] > bounds.right && clamp.x >= 0) {
          clamp.x -= m1[i] + m2[i] - bounds.right;
        }
      }
      if (i%3 == 1) {
        if (m1[i] + m2[i] < bounds.top && clamp.y <= 0) {
          clamp.y -= m1[i] + m2[i] + bounds.top;
        }
        if (m1[i] + m2[i] > bounds.bottom && clamp.y >= 0) {
          clamp.y -= m1[i] + m2[i] - bounds.bottom;
        }
      }
    }
  }
  var vertice = [];
  for (i=0; i<m1.length && i<m2.length; i++) {
    var newPos = m1[i] + m2[i];
    if (i%3 === 0) {
      newPos += clamp.x;
    }
    if (i%3 == 1) {
      newPos += clamp.y;
    }
    vertice.push(newPos);
  }
  return vertice;
};

Vertex.multiplyMatrix = function(m1, size) {
  var vertice = [];
  for (var i=0; i<m1.length; i++) {
    vertice.push(m1[i] * size);
  }
  return vertice;
};

Vertex.outOfBounds = function(vertice4, bounds) {
  for (var i=0; i<vertice4.length; i+=3) {
    var vertex = vertice4.slice(i, i+2);
    if (vertex[0] > bounds.left && vertex[0] < bounds.right &&
        vertex[1] > bounds.top && vertex[1] < bounds.bottom) {
      return false;
    }
  }
  return true;
};

Vertex.collision = function(v1, v2) {
  var edges1 = Vertex.getVerticeEdges(v1);
  var edges2 = Vertex.getVerticeEdges(v2);
  if (edges1.top >= edges2.top && edges1.top <= edges2.bottom &&
      edges1.left >= edges2.left && edges1.left <= edges2.right) {
    return true;
  }
  if (edges1.top >= edges2.top && edges1.top <= edges2.bottom &&
      edges1.right >= edges2.left && edges1.right <= edges2.right) {
    return true;
  }
  if (edges1.bottom >= edges2.top && edges1.bottom <= edges2.bottom &&
      edges1.left >= edges2.left && edges1.left <= edges2.right) {
    return true;
  }
  if (edges1.bottom >= edges2.top && edges1.bottom <= edges2.bottom &&
      edges1.right >= edges2.left && edges1.right <= edges2.right) {
    return true;
  }
  return false;
};

Vertex.getVerticeEdges = function(vertice) {
  var edges = { left:0, top:0, bottom:0, right:0 };
  for (var i=0; i<vertice.length; i+=3) {
    var vertex = vertice.slice(i, i+2);
    if (i === 0) {
      edges.left = vertex[0];
      edges.right = vertex[0];
      edges.top = vertex[1];
      edges.bottom = vertex[1];
    }
    else {
      if (vertex[0] < edges.left)
        edges.left = vertex[0];
      if (vertex[0] > edges.right)
        edges.right = vertex[0];
      if (vertex[1] < edges.top)
        edges.top = vertex[1];
      if (vertex[1] > edges.bottom)
        edges.bottom = vertex[1];
    }
  }
  return edges;
};

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//
//                               AbstractViewport                               
//
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function AbstractViewport() {}

// =============================================================================
//                                     VARS                                     
// =============================================================================

// ----------------------------------------------------------------------- CONST
AbstractViewport.BOX_NB_X = 24.0;
AbstractViewport.BOX_NB_Y = 24.0;
AbstractViewport.BOX_SIZE = 1.0;
AbstractViewport.ENEMY_MAX_SIZE = 3.0;
AbstractViewport.VIEWPORT_BOUNDS = {
  left: 0.0,
  top: 0.0,
  right: AbstractViewport.BOX_NB_X,
  bottom: AbstractViewport.BOX_NB_Y,
};
AbstractViewport.ENEMY_VIEWPORT_BOUNDS = {
  left: AbstractViewport.VIEWPORT_BOUNDS.left - AbstractViewport.ENEMY_MAX_SIZE*AbstractViewport.BOX_SIZE,
  top: AbstractViewport.VIEWPORT_BOUNDS.top - AbstractViewport.ENEMY_MAX_SIZE*AbstractViewport.BOX_SIZE,
  right: AbstractViewport.VIEWPORT_BOUNDS.right + AbstractViewport.ENEMY_MAX_SIZE*AbstractViewport.BOX_SIZE,
  bottom: AbstractViewport.VIEWPORT_BOUNDS.bottom + AbstractViewport.ENEMY_MAX_SIZE*AbstractViewport.BOX_SIZE,
};
AbstractViewport.DIRECTION = {
  left:
    { x:-1, y:0 },
  right:
    { x:1, y:0 },
  top:
    { x:0, y:-1 },
  bottom:
    { x:0, y:1 },
};
AbstractViewport.ENEMY_SET_INTERVAL = 10000/((AbstractViewport.BOX_NB_X > AbstractViewport.BOX_NB_Y) ? AbstractViewport.BOX_NB_X : AbstractViewport.BOX_NB_Y);

// ---------------------------------------------------------------------- STATIC
AbstractViewport.enemies = [];
AbstractViewport.enemyDirection = {
  x: 0.0,
  y: 0.0
};
AbstractViewport.enemyMove = {
  x: 0.0,
  y: 0.0
};
AbstractViewport.enemyLastSet = 0;
AbstractViewport.enemyLastDirectionChange = 0;
AbstractViewport.player = [];
AbstractViewport.playerDirection = { x:0, y:0 };

// =============================================================================
//                                   FUNCTIONS
// =============================================================================

// ---------------------------------------------------------------------- PLAYER
AbstractViewport.setPlayer = function() {
  AbstractViewport.player = [
    AbstractViewport.BOX_NB_X/2 - AbstractViewport.BOX_SIZE*0.5/2, AbstractViewport.BOX_NB_Y/2 - AbstractViewport.BOX_SIZE*0.5/2, 0.0,
    AbstractViewport.BOX_NB_X/2 + AbstractViewport.BOX_SIZE*0.5/2, AbstractViewport.BOX_NB_Y/2 - AbstractViewport.BOX_SIZE*0.5/2, 0.0,
    AbstractViewport.BOX_NB_X/2 - AbstractViewport.BOX_SIZE*0.5/2, AbstractViewport.BOX_NB_Y/2 + AbstractViewport.BOX_SIZE*0.5/2, 0.0,
    AbstractViewport.BOX_NB_X/2 + AbstractViewport.BOX_SIZE*0.5/2, AbstractViewport.BOX_NB_Y/2 + AbstractViewport.BOX_SIZE*0.5/2, 0.0,
  ];
};

AbstractViewport.movePlayer = function(delta) {
  if (AbstractViewport.playerDirection.x === 0 && AbstractViewport.playerDirection.y === 0) {
    return false;
  }
  var move = {
    x: AbstractViewport.playerDirection.x * 0.01*delta,
    y: AbstractViewport.playerDirection.y * 0.01*delta,
  };
  var moveVertice = [
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
  ];
  AbstractViewport.player = Vertex.addMatrix(AbstractViewport.player, moveVertice, AbstractViewport.VIEWPORT_BOUNDS);
  return true;
};

AbstractViewport.emptyPlayer = function() {
  AbstractViewport.player = [];
  AbstractViewport.playerDirection = { x:0, y:0 };
};

AbstractViewport.playerEvent = function(event) {
  if (event.type == "keydown") {
    switch (event.keyCode) {
      case 40:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.bottom, undefined, { max:1, min:-1 });
        break;
      case 38:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.top, undefined, { max:1, min:-1 });
        break;
      case 37:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.left, undefined, { max:1, min:-1 });
        break;
      case 39:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.right, undefined, { max:1, min:-1 });
        break;
      default:
        return;
    }
  }
  else if (event.type == "keyup") {
    switch (event.keyCode) {
      case 40:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.top, undefined, { max:1, min:-1 });
        break;
      case 38:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.bottom, undefined, { max:1, min:-1 });
        break;
      case 37:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.right, undefined, { max:1, min:-1 });
        break;
      case 39:
        AbstractViewport.addMoves(AbstractViewport.playerDirection, AbstractViewport.DIRECTION.left, undefined, { max:1, min:-1 });
        break;
      default:
        return;
    }
  }
};

// --------------------------------------------------------------------- ENEMIES
AbstractViewport.setEnemy = function(delta) {
  AbstractViewport.enemyLastSet += delta;
  if (AbstractViewport.enemyLastSet < AbstractViewport.ENEMY_SET_INTERVAL) {
    return false;
  }
  else {
    AbstractViewport.enemyLastSet -= AbstractViewport.ENEMY_SET_INTERVAL;
  }
  var left = 0;
  if (AbstractViewport.enemyDirection.x < 0) {
    left = AbstractViewport.BOX_NB_X + 2;
  }
  else if (AbstractViewport.enemyDirection.x > 0) {
    left = - (AbstractViewport.ENEMY_MAX_SIZE + 1); 
  }
  var top = 0;
  if (AbstractViewport.enemyDirection.y < 0) {
    top = AbstractViewport.BOX_NB_Y + 2;
  }
  else if (AbstractViewport.enemyDirection.y > 0) {
    top = - (AbstractViewport.ENEMY_MAX_SIZE + 1);
  }
  var box_nb_x = (left === 0) ? AbstractViewport.BOX_NB_X : AbstractViewport.ENEMY_MAX_SIZE;
  var box_nb_y = (top === 0) ? AbstractViewport.BOX_NB_Y : AbstractViewport.ENEMY_MAX_SIZE;
  AbstractViewport.enemies.push(Vertex.getRandomVertice(left, top, box_nb_x, box_nb_y, AbstractViewport.BOX_SIZE, AbstractViewport.ENEMY_MAX_SIZE, AbstractViewport.enemyMove));
  return true;
};

AbstractViewport.moveEnemies = function(delta, direction) {
  var toDelete = [];
  var move = {
    x: direction.x * 0.005*delta,
    y: direction.y * 0.005*delta,
  };
  AbstractViewport.setGlobalMove(move);
  var moveVertice = [
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
    move.x, move.y, 0,
  ];
  var i=0;
  for (i=0; i<AbstractViewport.enemies.length; i++) {
    AbstractViewport.enemies[i] = Vertex.addMatrix(AbstractViewport.enemies[i], moveVertice);
    if (Vertex.outOfBounds(AbstractViewport.enemies[i], AbstractViewport.ENEMY_VIEWPORT_BOUNDS)) {
      toDelete.unshift(i);
    }
  }
  for (i=0; i<toDelete.length; i++) {
    AbstractViewport.enemies.splice(toDelete[i], 1);
  }
};

AbstractViewport.emptyEnemies = function() {
  AbstractViewport.enemies = [];
  AbstractViewport.enemyDirection = {
    x: 0.0,
    y: 0.0
  };
  AbstractViewport.enemyMove = {
    x: 0.0,
    y: 0.0
  };
  AbstractViewport.enemyLastSet = 0;
  AbstractViewport.enemyLastDirectionChange = 0;
};

// ------------------------------------------------------------------- COLLISION
AbstractViewport.playerCollisionWithEnemies = function() {
  for (var i=0; i<AbstractViewport.enemies.length; i++) {
    if (Vertex.collision(AbstractViewport.player, AbstractViewport.enemies[i])) {
      return true;
    }
  }
  return false;
};

// ------------------------------------------------------------------------ MOVE
AbstractViewport.setEnemyDirection = function(delta) {
  AbstractViewport.enemyLastDirectionChange += delta;
  if ((AbstractViewport.enemyDirection.x !== 0 || AbstractViewport.enemyDirection.y !== 0) && AbstractViewport.enemyLastDirectionChange < 4000) {
    return false;
  }
  if ((AbstractViewport.enemyDirection.x !== 0 || AbstractViewport.enemyDirection.y !== 0) || Math.floor(Math.random() * 10) === 0) {
    AbstractViewport.enemyLastDirectionChange -= 4000;
    var keys = Object.keys(AbstractViewport.DIRECTION);
    var newDirection;
    do {
      newDirection = AbstractViewport.DIRECTION[keys[Math.floor(Math.random() * keys.length)]];
    } while (newDirection == AbstractViewport.enemyDirection);
    AbstractViewport.enemyDirection = newDirection;
    return true;
  }
  return false;
};

AbstractViewport.getEnemyDirection = function() {
  return AbstractViewport.enemyDirection;
};

AbstractViewport.setGlobalMove = function(move) {
  AbstractViewport.addMoves(AbstractViewport.enemyMove, move, AbstractViewport.BOX_SIZE);
};

AbstractViewport.addMoves = function(move1, move2, modulo, clamp) {
  move1.x += move2.x;
  move1.y += move2.y;
  if (modulo !== undefined) {
    move1.x %= modulo;
    move1.y %= modulo;
  }
  if (clamp !== undefined) {
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
};

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//
//                                    SERVER                                    
//
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

// ----------------------------------------------------------------------- CONST
var GAME_STATE = {
  menu: 0,
  ingame: 1,
  over: 2,
  loading: 3,
};

// ---------------------------------------------------------------------- GLOBAL
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 1337, origin: 'http://127.0.0.1'});
var clients = {};

// ---------------------------------------------------------------------- CLIENT
function Client(ws) {
  this.connection = ws;
  this.vertices = [];
  this.status = GAME_STATE.ingame;
  this.name = "";
  this.score = 0;
}

// =============================================================================
//                              WEB SOCKET SERVER                              
// =============================================================================

// ------------------------------------------------------------------ CONNECTION
wss.on('connection', function(ws) {
  var index = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
  var client = new Client(ws);
  clients[index] = client;
  ws.on('message', function(message) {
    var json = JSON.parse(message);
    var toBroadcast = {};
    toBroadcast[index] = {};
    if (json.player !== undefined) {
      clients[index].vertices = json.player;
      toBroadcast[index].vertices = clients[index].vertices;
    }
    if (json.playerName !== undefined) {
      clients[index].name = json.playerName;
      toBroadcast[index].name = clients[index].name;
    }
    if (json.status !== undefined) {
      if (json.status == GAME_STATE.ingame) {
        clients[index].status = GAME_STATE.ingame;
        toBroadcast[index].status = clients[index].status;
      }
      else if (json.status == GAME_STATE.over) {
        clients[index].status = GAME_STATE.over;
        toBroadcast[index].status = clients[index].status;
      }
    }
    if (json.score !== undefined) {
      clients[index].score = json.score;
      toBroadcast[index].score = clients[index].score;
    }
    broadcastPlayer(index, toBroadcast);
    if (json.get !== undefined) {
      if (json.get == "init") {
        ws.send(JSON.stringify({
          enemyDirection: AbstractViewport.enemyDirection,
          enemies: AbstractViewport.enemies,
          friends: getFriends(index),
        })); 
      }
    }
  });
  ws.on('close', function() {
    var toBroadcast = {};
    toBroadcast[index] = {};
    toBroadcast[index].status = GAME_STATE.over;
    broadcastPlayer(index, toBroadcast);
    delete clients[index];
  });
});

// ------------------------------------------------------------------- BROADCAST
wss.broadcast = function(data) {
  for(var i in clients)
    clients[i].connection.send(data);
};

function broadcastEnemies() {
  wss.broadcast(JSON.stringify({
    enemies: AbstractViewport.enemies,
  }));
}

function broadcastEnemyDirection() {
  wss.broadcast(JSON.stringify({
    enemyDirection: AbstractViewport.enemyDirection,
    enemies: AbstractViewport.enemies,
  }));
}

function broadcastNewEnemy() {
  wss.broadcast(JSON.stringify({
    newEnemy: AbstractViewport.enemies[AbstractViewport.enemies.length-1],
  }));
}

function broadcastPlayer(index, toBroadcast) {
  if (toBroadcast.length === 0 || toBroadcast[index] === undefined || toBroadcast[index].length === 0) {
    return;
  }
  for (var i in clients) {
    if (index != i) {
      clients[i].connection.send(JSON.stringify({friends: toBroadcast}));
    }
  }
}

// --------------------------------------------------------------------- FRIENDS
function getFriends(index) {
  var friends = {};
  for (var i in clients) {
    if (i != index) {
      friends[i] = (clients[i].status == GAME_STATE.ingame) ? {vertices:clients[i].vertices, name:clients[i].name, score:clients[i].score} : {};
    }
  }
  return friends;
}

// =============================================================================
//                                   GAME LOOP                                  
// =============================================================================

var gameLoop;
function startGame() {
  AbstractViewport.emptyEnemies();
  AbstractViewport.setPlayer();
  var delta = 0;
  var oldTime = Date.now();
  var newTime = Date.now();
  gameLoop = setInterval(
    function() {
      newTime = Date.now();
      delta = newTime - oldTime;
      oldTime = newTime;
      if (AbstractViewport.setEnemy(delta)) {
        broadcastNewEnemy();
      }
      if (AbstractViewport.setEnemyDirection(delta)) {
        broadcastEnemyDirection();
      }
      AbstractViewport.moveEnemies(delta, AbstractViewport.getEnemyDirection());
    },
    10
  );
}

function stopGame() {
  clearInterval(gameLoop);
  AbstractViewport.emptyEnemies();
  AbstractViewport.emptyPlayer();
}

startGame();