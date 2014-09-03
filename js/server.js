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
var clients = [];

// ---------------------------------------------------------------------- CLIENT
function Client(ws) {
  this.connection = ws;
  this.vertice = [];
  this.status = GAME_STATE.ingame;
}

// =============================================================================
//                              WEB SOCKET SERVER                              
// =============================================================================

// ------------------------------------------------------------------ CONNECTION
wss.on('connection', function(ws) {
  var index = clients.length;
  var client = new Client(ws);
  clients.push(client);
  ws.on('message', function(message) {
    var json = JSON.parse(message);
    if (json.player !== undefined) {
      clients[index].vertices = json.player;
      broadcastPlayer(index);
    }
    else if (json.status !== undefined) {
      if (json.status == GAME_STATE.ingame) {
        clients[index].status = GAME_STATE.ingame;
        broadcastPlayer(index);
      }
      else if (json.status == GAME_STATE.over) {
        clients[index].status = GAME_STATE.over;
        broadcastPlayer(index);
      }
    }
    else if (json.get !== undefined) {
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
    clients.splice(index, 1);
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

function broadcastPlayer(index) {
  for(var i in clients) {
    clients[i].connection.send(JSON.stringify({friends: getFriends(i)}));
  }
}

// --------------------------------------------------------------------- FRIENDS
function getFriends(index) {
  var friends = {};
  for (var i in clients) {
    if (i != index) {
      friends[i] = (clients[i].status == GAME_STATE.ingame) ? clients[i].vertices : [];
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