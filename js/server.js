// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//
//                                    SERVER                                    
//
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

// ---------------------------------------------------------------------- GLOBAL
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 1337, origin: 'http://127.0.0.1'});
var clients = [];
var players = [];
var ready = [];
var over = [];

// =============================================================================
//                              WEB SOCKET SERVER                              
// =============================================================================

// ------------------------------------------------------------------ CONNECTION
wss.on('connection', function(ws) {
  var index = clients.length;
  clients.push(ws);
  ws.on('message', function(message) {
    var json = JSON.parse(message);
    if (json.player !== undefined) {
      AbstractViewport.player = json.player;
    }
    else if (json.status !== undefined) {
      if (json.status == "ready") {
        ready.push(index);
        if (ready.length == clients.length) {
          startGame();
        };
      }
      else if (json.status == "over") {
        ready.splice(ready.indexOf(index), 1);
        over.push(index);
        if (over.length == clients.length) {
          stopGame();
        };
      }
    }
  });
  ws.on('close', function() {
    clients.splice(clients.indexOf(index), 1);
  });
  ws.send(JSON.stringify({player:players[index]}));
});

// ------------------------------------------------------------------- BROADCAST
wss.broadcast = function(data) {
  for(var i in this.clients)
    this.clients[i].send(data);
};

function broadcastStartGame() {
  wss.broadcast(JSON.stringify({
    player: AbstractViewport.player,
    friends: AbstractViewport.friends,
    enemies: AbstractViewport.enemies,
    enemyDirection: AbstractViewport.enemyDirection,
    gameStatus: 'ingame',
  }));
}

function broadcastStopGame() {
  wss.broadcast(JSON.stringify({
    gameStatus: 'over',
  }));
}

function broadcastEnemies() {
  wss.broadcast(JSON.stringify({
    enemies: AbstractViewport.enemies,
  }));
}

function broadcastEnemyDirection() {
  wss.broadcast(JSON.stringify({
    enemyDirection: AbstractViewport.enemyDirection,
  }));
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
        broadcastEnemies();
      }
      if (AbstractViewport.setEnemyDirection(delta)) {
        broadcastEnemyDirection();
      }
      AbstractViewport.moveEnemies(delta, AbstractViewport.getEnemyDirection());
      // if (AbstractViewport.playerCollisionWithEnemies()) {
      //   stopGame();
      //   broadcastStopGame();
      // }
    },
    16
  );
  broadcastStartGame();
}

function stopGame() {
  clearInterval(gameLoop);
  AbstractViewport.emptyEnemies();
  AbstractViewport.emptyPlayer();
  ready = [];
  over = [];
}