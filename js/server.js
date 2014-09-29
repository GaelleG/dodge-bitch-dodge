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
    if (json.playerColor !== undefined) {
      clients[index].color = json.playerColor;
      toBroadcast[index].color = clients[index].color;
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
      friends[i] = (clients[i].status == GAME_STATE.ingame) ? {vertices:clients[i].vertices, name:clients[i].name, score:clients[i].score, color:clients[i].color} : {};
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