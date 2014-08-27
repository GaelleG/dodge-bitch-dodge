// =============================================================================
// Based on developer.mozilla.org sample
// https://developer.mozilla.org/samples/webgl/sample2/webgl-demo.js
// =============================================================================

var gl;
var squareVerticesBuffers = [];
var mvMatrix;
var fragmentProgramEnemy;
var fragmentProgramPlayer;
var currentProgram;
var vertexPositionAttribute;
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
  while (squareVerticesBuffers.length > vertices.length) {
    squareVerticesBuffers.pop();
  }
  for (var i=squareVerticesBuffers.length; i<vertices.length; i++) {
    squareVerticesBuffers.push(gl.createBuffer());
  }
  for (var i=0; i<vertices.length; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffers[i]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices[i]), gl.STATIC_DRAW);
  }
}

function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (var i=0; i<squareVerticesBuffers.length; i++) {
    if (i < 2) {
      if (i == 0) {
        currentProgram = fragmentProgramPlayer;
      }
      else if (i == 1) {
        currentProgram = fragmentProgramEnemy;
      }
      gl.useProgram(currentProgram);
      perspectiveMatrix = makeOrtho(0, canvas.width, canvas.height, 0, 0.1, 100);
      loadIdentity();
      mvTranslate([-0.0, 0.0, -6.0]);
      setMatrixUniforms();
      vertexPositionAttribute = gl.getAttribLocation(currentProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffers[i]);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

function initShaders() {
  var fragmentShaderEnemy = getShader(gl, "shader-fs-enemy");
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