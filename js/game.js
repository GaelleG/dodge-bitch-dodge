var vertices = [];
var canvas;

function setEnemy() {
  vertices.push(getRandomVertice());
}

function getRandomVertice() {
  var min = {
    x: -canvas.width/2,
    y: -canvas.height/2,
  };
  var max = {
    x: canvas.width/2,
    y: canvas.height/2,
  };
  var randSize = {
    x: Math.random() * (max.x - min.x) + min.x, 
    y: Math.random() * (max.y - min.y) + min.y,
  };
  max.x -= randSize.x;
  max.y -= randSize.y;
  var randPosition = {
    x: Math.random() * (max.x - min.x) + min.x, 
    y: Math.random() * (max.y - min.y) + min.y, 
  };
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
