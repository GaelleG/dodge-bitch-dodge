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
