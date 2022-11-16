/**
 * @file CS 418 Iteractive Computer Graphics 
 * @description Simple physics engine
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 * @author Alex Capps <amcapps2@illinois.edu>
 */

var gl;
var canvas;
var vertexPositionBuffer;
var shaderProgram;

//Store normals for shading here!
var sphereVertexNormalBuffer;

// Normal
var nMatrix = mat3.create();

// Store sphere geometry here!
var sphereVertexPositionBuffer;

// Shiny amount.
var shiny = 100;

// View params.
var eyePt = vec3.fromValues(0.0, 0.0, 4.0);
var up = vec3.fromValues(0.0, 1.0, 0.0);
var viewDir = vec3.fromValues(0.0, 0.0, -1.0);
var viewPt = vec3.fromValues(0.0, 0.0, 0.0);


// Projection matrix
var pMatrix = mat4.create();

// ModelView matrix & storeage.
var mvMatrix = mat4.create();
var mvMatrixStack = [];



//-----------------------------------------------------------------
// List of particles
var particles = [];

// Initialize particles list
addParticles();

//-----------------------------------------------------------------
//COLOR CONVERTERS
function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }
function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) }
function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) }
function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) }


//-------------------------------------------------------------------------
/**
 * Populate our buffers w/ sphere data.
 */
function setupSphereBuffers() {

  var sphereCluster = [];
  var sphereNormals = [];
  var numT = sphereFromSubdivision(6, sphereCluster, sphereNormals);
  console.log("Generated ", numT, " triangles");
  sphereVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereCluster), gl.STATIC_DRAW);
    
  sphereVertexPositionBuffer.numItems = numT * 3;
  sphereVertexPositionBuffer.itemSize = 3;

  console.log(sphereCluster.length / 9);

  // Specify normals to be able to do lighting calculations
  sphereVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals), gl.STATIC_DRAW);
    
  sphereVertexNormalBuffer.numItems = numT * 3;
  sphereVertexNormalBuffer.itemSize = 3;

  console.log("Normals ", sphereNormals.length / 3);
}

//-------------------------------------------------------------------------
/**
 * Draw sphere from our sphere buffer
 */
function drawSphere() {
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize,
  gl.FLOAT, false, 0, 0);

  // Bind buffer of normals.
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize,
  gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);
}

//-------------------------------------------------------------------------
/**
 * Send our Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Send our projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates + sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix, mvMatrix);
  mat3.transpose(nMatrix, nMatrix);
  mat3.invert(nMatrix, nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushe matrix to modelview matrix (stack)
 */
function mvPushMatrix() {
  var copy = mat4.clone(mvMatrix);
  mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pop matrix off modelview matrix (stack)
 */
function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "popMatrix: Invalid!";
  }
  mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Send projection and modelview matrices to shader
 */
function setMatrixUniforms() {
  uploadModelViewMatrixToShader();
  uploadNormalMatrixToShader();
  uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translate degrees -> radians
 * @param {Number} degrees Degree input
 * @return {Number} Corresponding radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Create ontext for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i = 0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch (e) { }
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Load Shader
 * @param {string} id String for vertex/fragment shader to load.
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);

  // No element with specified id -> exit
  if (!shaderScript) {
    return null;
  }

  // Loop through  children for DOM element (already found).
  // Then build shader source code as string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 => TEXT_NODE
      shaderSource += currentChild.textContent;
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

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
    
  return shader;
}

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 */
function setupShaders(vshader, fshader) {
  vertexShader = loadShaderFromDOM(vshader);
  fragmentShader = loadShaderFromDOM(fshader);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
  
  //Matrix Setup. 
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    
  //Material setup.
  shaderProgram.uniformDiffuseMaterialColor = gl.getUniformLocation(shaderProgram,"uDiffuseMaterialColor");
  shaderProgram.uniformAmbientMaterialColor = gl.getUniformLocation(shaderProgram,"uAmbientMaterialColor");
  shaderProgram.uniformSpecularMaterialColor = gl.getUniformLocation(shaderProgram,"uSpecularMaterialColor");

  //Light setup.
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");

  shaderProgram.uniformShininess = gl.getUniformLocation(shaderProgram, "uShininess");
}


//-------------------------------------------------------------------------
/**
 * Sends light info to shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} s Specular light strength
 */
function uploadLightToShader(loc, a, d, s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}


//-------------------------------------------------------------------------
/**
 * Sends material info to shader
 * @param {Float32Array} a diffuse material color
 * @param {Float32Array} a specular material color 
 * @param {Float32Array} a ambient material color
 * @param {Float32} the shininess exponent for Phong illumination
 */
function uploadMaterialToShader(cdiffuse, cspec, camb, shiny) {
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColor, cdiffuse);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColor, cspec);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColor, camb);

  gl.uniform1f(shaderProgram.uniformShininess, shiny);
}


//----------------------------------------------------------------------------------
/**
 * Populate all buffers with data
 */
function setupBuffers() {
  setupSphereBuffers();
}

//----------------------------------------------------------------------------------
/**
 * Draw call; applies matrix transforms to model + draws model in frame
 */
function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Use perspective 
  mat4.perspective(pMatrix, degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

  // Need to look down -z. Create a lookat point in that direction    
  vec3.add(viewPt, eyePt, viewDir);
    
  // Generate  lookat matrix. Then initialize MV matrix to that view
  mat4.lookAt(mvMatrix, eyePt, viewPt, up);

  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    mvPushMatrix();
    mat4.translate(mvMatrix, mvMatrix, p.p);
    mat4.scale(mvMatrix, mvMatrix, [p.r, p.r, p.r]);

    //Extract the material color
    R = p.R;
    G = p.G;
    B = p.B;

    uploadLightToShader([0, 0, 0], [0.0, 0.0, 0.0], [1.0, 1.0, 1.0], [1.0, 1.0, 1.0]);
    uploadMaterialToShader([R, G, B], [R, G, B], [1.0, 1.0, 1.0], shiny);
    setMatrixUniforms();
    drawSphere();
    mvPopMatrix();
  }
}



//----------------------------------------------------------------------------------
/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function setGouraudShader() {
  console.log("Setting Gouraud Shader");
  setupShaders("shader-gouraud-phong-vs", "shader-gouraud-phong-fs");
}


//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders("shader-gouraud-phong-vs", "shader-gouraud-phong-fs");
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Tick called for every animation frame.
 */
function tick() {
  requestAnimFrame(tick);
  updateParticles();
  draw();
}

//----------------------------------------------------------------------------------
/**
 * Update particle positions, velocities and accelerations
 */
function updateParticles() {
  updateParameters();
  for (var i = 0; i < particles.length; i++) {
    particles[i].updateVelocity();
    particles[i].updatePosition();
    particles[i].updateAcceleration();
  }
}

/**
 * Add particles
 */
function addParticles() {
  for (var i = 0; i < 10; i++) {
    particles.push(new Particle());
  }
}

/**
 * Burst particles
 */
function burstParticles() {
  for (var i = 0; i < particles.length; i++) {
    vec3.random(particles[i].v, 2);
  }
}

/**
 * Reset particles
 */
function resetParticles() {
  particles = [];
}

