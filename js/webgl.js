// =============================================================================
// Based on developer.mozilla.org sample
// https://developer.mozilla.org/samples/webgl/sample2/webgl-demo.js
// =============================================================================

// ----------------------------------------------------------------------- CONST
var SQUARE_COLORS = [];
var LIGHT_SQUARE_COLORS = [];
for (var i in COLORS) {
  SQUARE_COLORS.push([
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 1,
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 1,
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 1,
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 1,
  ]);
  LIGHT_SQUARE_COLORS.push([
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 0.3,
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 0.3,
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 0.3,
    COLORS[i][0]/255, COLORS[i][1]/255, COLORS[i][2]/255, 0.3,
  ]);
}

// ---------------------------------------------------------------------- GLOBAL
var gl;
var enemyVerticeBuffers = [];
var playerVerticeBuffer = [];
var friendVerticeBuffers = [];
var squareVerticesColorBuffers = [];
var squareVerticesLightColorBuffers = [];
var mvMatrix;
var fragmentProgramEnemy;
var fragmentProgramPlayer;
var currentProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;

function start() {
  initWebGL(canvas);
  
  if (gl) {
    gl.clearColor(0.95, 0.95, 0.95, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    initShaders();
    updateBuffers();
    
    setInterval(
      function() {
        updateBuffers();
        drawScene();
      },
    16);
  }
}

function initWebGL() {
  gl = null;
  
  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

function updateBuffers() {
  var i=0;

  // enemies
  while (enemyVerticeBuffers.length > enemies.length) {
    enemyVerticeBuffers.pop();
  }
  for (i=enemyVerticeBuffers.length; i<enemies.length; i++) {
    enemyVerticeBuffers.push(gl.createBuffer());
  }
  for (i=0; i<enemies.length; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, enemyVerticeBuffers[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(enemies[i]), gl.STATIC_DRAW);
  }

  // friends
  var friendsKeys = Object.keys(friends);
  while (friendVerticeBuffers.length > friendsKeys.length) {
    friendVerticeBuffers.pop();
  }
  for (i=friendVerticeBuffers.length; i<friendsKeys.length; i++) {
    friendVerticeBuffers.push(gl.createBuffer());
  }
  for (i=0; i<friendsKeys.length; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, friendVerticeBuffers[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(friends[friendsKeys[i]].vertices), gl.STATIC_DRAW);
  }

  // player
  if (player.length < 12) {
    playerVerticeBuffer = [];
  }
  if (player.length == 12 && playerVerticeBuffer.length === 0) {
    playerVerticeBuffer.push(gl.createBuffer());
  }
  for (i=0; i<playerVerticeBuffer.length; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, playerVerticeBuffer[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(player), gl.STATIC_DRAW);
  }

  // colors
  while (squareVerticesColorBuffers.length > SQUARE_COLORS.length) {
    squareVerticesColorBuffers.pop();
  }
  for (i=squareVerticesColorBuffers.length; i<SQUARE_COLORS.length; i++) {
    squareVerticesColorBuffers.push(gl.createBuffer());
  }
  for (i=0; i<SQUARE_COLORS.length; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffers[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(SQUARE_COLORS[i]), gl.STATIC_DRAW);
  }

  // light colors
  while (squareVerticesLightColorBuffers.length > LIGHT_SQUARE_COLORS.length) {
    squareVerticesLightColorBuffers.pop();
  }
  for (i=squareVerticesLightColorBuffers.length; i<LIGHT_SQUARE_COLORS.length; i++) {
    squareVerticesLightColorBuffers.push(gl.createBuffer());
  }
  for (i=0; i<LIGHT_SQUARE_COLORS.length; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesLightColorBuffers[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(LIGHT_SQUARE_COLORS[i]), gl.STATIC_DRAW);
  }
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var i=0;

  perspectiveMatrix = makeOrtho(0, canvas.width, canvas.height, 0, 0.1, 100);
  loadIdentity();
  mvTranslate([-0.0, 0.0, -6.0]);

  // enemies
  currentProgram = fragmentProgramEnemy;
  gl.useProgram(currentProgram);
  setMatrixUniforms();
  vertexPositionAttribute = gl.getAttribLocation(currentProgram, "aVertexPosition");
  for (i=0; i<enemyVerticeBuffers.length; i++) {
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, enemyVerticeBuffers[i]);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // friends
  currentProgram = fragmentProgramFriend;
  gl.useProgram(currentProgram);
  setMatrixUniforms();
  vertexColorAttribute = gl.getAttribLocation(currentProgram, "aVertexColor");
  vertexPositionAttribute = gl.getAttribLocation(currentProgram, "aVertexPosition");
  var friendsIndexes = Object.keys(friends);
  for (i=0; i<friendVerticeBuffers.length; i++) {
    gl.enableVertexAttribArray(vertexColorAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesLightColorBuffers[friends[friendsIndexes[i]].color]);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, friendVerticeBuffers[i]);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // player
  currentProgram = fragmentProgramPlayer;
  gl.useProgram(currentProgram);
  setMatrixUniforms();
  vertexColorAttribute = gl.getAttribLocation(currentProgram, "aVertexColor");
  vertexPositionAttribute = gl.getAttribLocation(currentProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  for (i=0; i<playerVerticeBuffer.length; i++) {
    gl.enableVertexAttribArray(vertexColorAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffers[playerColor]);
    gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, playerVerticeBuffer[i]);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

function initShaders() {
  var fragmentShaderEnemy = getShader(gl, "shader-fs-enemy");
  var fragmentShaderFriend = getShader(gl, "shader-fs-friend");
  var fragmentShaderPlayer = getShader(gl, "shader-fs-player");
  var vertexShader = getShader(gl, "shader-vs");
  
  // enemy
  fragmentProgramEnemy = gl.createProgram();
  gl.attachShader(fragmentProgramEnemy, vertexShader);
  gl.attachShader(fragmentProgramEnemy, fragmentShaderEnemy);
  gl.linkProgram(fragmentProgramEnemy);

  if (!gl.getProgramParameter(fragmentProgramEnemy, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  // friend
  fragmentProgramFriend = gl.createProgram();
  gl.attachShader(fragmentProgramFriend, vertexShader);
  gl.attachShader(fragmentProgramFriend, fragmentShaderFriend);
  gl.linkProgram(fragmentProgramFriend);

  if (!gl.getProgramParameter(fragmentProgramEnemy, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  // player
  fragmentProgramPlayer = gl.createProgram();
  gl.attachShader(fragmentProgramPlayer, vertexShader);
  gl.attachShader(fragmentProgramPlayer, fragmentShaderPlayer);
  gl.linkProgram(fragmentProgramPlayer);

  if (!gl.getProgramParameter(fragmentProgramPlayer, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  
  if (!shaderScript) {
    return null;
  }
  
  var theSource = "";
  var currentChild = shaderScript.firstChild;
  
  while(currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    
    currentChild = currentChild.nextSibling;
  }
  
  var shader;
  
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
  
  gl.shaderSource(shader, theSource);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  
  return shader;
}

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(currentProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = gl.getUniformLocation(currentProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}