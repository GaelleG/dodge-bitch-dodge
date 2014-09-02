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
