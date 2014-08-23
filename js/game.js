var vertices = [];
var canvas;
var BOX_SIZE = 20;
var CANVAS_WIDTH = 
  BOX_SIZE * Math.floor(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / BOX_SIZE);
var CANVAS_HEIGHT = 
  BOX_SIZE * Math.floor(Math.max(document.documentElement.clientHeight, window.innerHeight || 0) / BOX_SIZE);
var BOX_NB_X = Math.floor(CANVAS_WIDTH/20);
var BOX_NB_Y = Math.floor(CANVAS_HEIGHT/20);

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
    x: Math.round(Math.random() * (3 - min.x+1) + min.x+1), 
    y: Math.round(Math.random() * (3 - min.y+1) + min.y+1),
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
    randPosition.x, randPosition.y, 0.0,
    randPosition.x + randSize.x, randPosition.y, 0.0,
    randPosition.x, randPosition.y + randSize.y, 0.0,
    randPosition.x + randSize.x, randPosition.y + randSize.y, 0.0,
  ];
  return vertice;
}

setInterval(
  function() {
    setEnemy();
  },
  1000
);
