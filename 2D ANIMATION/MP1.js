/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author Eric Shaffer <shaffer1@eillinois.edu>
 * @author Alex Capps <amcapps2@illinois.edu>
 * 
 * Updated Spring 2021 to use WebGL 2.0 and GLSL 3.00
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The vertex array object for the triangle */
var vertexArrayObject;

/** @global The rotation angle of our triangle */
var rotAngle = 0;

/** @global The ModelView matrix contains any modeling and viewing transformations */
var modelViewMatrix = glMatrix.mat4.create();

/** @global Records time last frame was rendered */
var previousTime = 0;

/** @global Illini logo ORANGE has RGB val of 235,76,52 */
var illini_orange = [
    235.0/255.0, 76.0/255.0, 52.0/255.0, 1.0
  ];
    
/** @global Illini logo BLUE has RGB val of 20,44,76 */
var illini_blue = [
    20.0/255.0, 44.0/255.0, 76.0/255.0, 1.0
  ];

/** @global Flag to determine which animation to draw. */
var illini = false;

/** @global Number of vertices for triangle fan. */
var num_vertices = 18;

/** @global Number of rings of triangles to draw. */
var num_rings = 5;

/** @global Stores triangle fan. */
var triangles = [];

/** @global Stores alternate version of triangle fan. */
var triangles2 = [];

/** @global Stores linear interpolation of triangle fans. */
var triangles3 = [];

/** @global Triangle fan colors. */
var triangleColors = [];

/** @global Illini logo vertices */
var logoVertices = [
    // OUTLINE
    //top rectangle
    -0.50, 0.40, 0.0,
    -0.50, 0.80, 0.0,
    -0.30, 0.40, 0.0,
    -0.50, 0.80, 0.0,
    -0.30, 0.40, 0.0,
    0, 0.80, 0.0,
    -0.30, 0.40, 0.0,
    0, 0.80, 0.0,
    0.30, 0.40, 0.0,
    0, 0.80, 0.0,
    0.30, 0.40, 0.0,
    0.50, 0.80, 0.0,
    0.30, 0.40, 0.0,
    0.50, 0.80, 0.0,
    0.50, 0.40, 0.0,
    // column
    -0.30, 0.40, 0.0,
    0.30, 0.40, 0.0,
    -0.30, 0.0, 0.0,
    0.30, 0.40, 0.0,
    -0.30, 0.0, 0.0,
    0.30, -0.40, 0.0,
    -0.30, 0.0, 0.0,
    0.30, -0.40, 0.0,
    -0.30, -0.40, 0.0,
    // lower rectangle
    -0.50, -0.40, 0.0,
    -0.50, -0.80, 0.0,
    -0.30, -0.40, 0.0,
    -0.50, -0.80, 0.0,
    -0.30, -0.40, 0.0,
    0, -0.80, 0.0,
    -0.30, -0.40, 0.0,
    0, -0.80, 0.0,
    0.30, -0.40, 0.0,
    0, -0.80, 0.0,
    0.30, -0.40, 0.0,
    0.50, -0.80, 0.0,
    0.30, -0.40, 0.0,
    0.50, -0.80, 0.0,
    0.50, -0.40, 0.0,

   // ORANGE
    //top rectangle
    -0.45, 0.45, 0.0,
    -0.45, 0.75, 0.0,
    -0.25, 0.45, 0.0,
    -0.45, 0.75, 0.0,
    -0.25, 0.45, 0.0,
    0, 0.75, 0.0,
    -0.25, 0.45, 0.0,
    0, 0.75, 0.0,
    0.25, 0.45, 0.0,
    0, 0.75, 0.0,
    0.25, 0.45, 0.0,
    0.45, 0.75, 0.0,
    0.25, 0.45, 0.0,
    0.45, 0.75, 0.0,
    0.45, 0.45, 0.0,
    // column
    -0.25, 0.45, 0.0,
    0.25, 0.45, 0.0,
    -0.25, 0.0, 0.0,
    0.25, 0.45, 0.0,
    -0.25, 0.0, 0.0,
    0.25, -0.45, 0.0,
    -0.25, 0.0, 0.0,
    0.25, -0.45, 0.0,
    -0.25, -0.45, 0.0,
    // lower rectangle
    -0.45, -0.45, 0.0,
    -0.45, -0.75, 0.0,
    -0.25, -0.45, 0.0,
    -0.45, -0.75, 0.0,
    -0.25, -0.45, 0.0,
    0, -0.75, 0.0,
    -0.25, -0.45, 0.0,
    0, -0.75, 0.0,
    0.25, -0.45, 0.0,
    0, -0.75, 0.0,
    0.25, -0.45, 0.0,
    0.45, -0.75, 0.0,
    0.25, -0.45, 0.0,
    0.45, -0.75, 0.0,
    0.45, -0.45, 0.0,
  ];

/** @global Stores alternate version of Illini logo. */
var vertexPosition2 = [];

/** @global Stores linear interpolation of Illini logos. */
var vertexPosition3 = [];

/** @global Stores the colors for the logo. */
var logoColors = [];


/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
    var context = null;
    context = canvas.getContext("webgl2");
    if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
    } else {
        alert("Failed to create WebGL context!");
    }
    return context;
}


/**
 * Loads a shader.
 * Retrieves the source code from the HTML document and compiles it.
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
  
    // If we don't find an element with the specified id
    // we do an early exit 
    if (!shaderScript) {
        return null;
    }

    var shaderSource = shaderScript.text;
 
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


/**
 * Set up the fragment and vertex shaders.
 */
function setupShaders() {
    // Compile the shaders' source code.
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");
  
    // Link the shaders together into a program.
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    // We only use one shader program for this example, so we can just bind
    // it as the current program here.
    gl.useProgram(shaderProgram);
    
    // Query the index of each attribute in the list of attributes maintained
    // by the GPU. 
    shaderProgram.vertexPositionAttribute =
        gl.getAttribLocation(shaderProgram, "aVertexPosition");
    shaderProgram.vertexColorAttribute =
        gl.getAttribLocation(shaderProgram, "aVertexColor");
    
    //Get the index of the Uniform variable as well
    shaderProgram.modelViewMatrixUniform =
        gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
}

/**
 * Set up the buffers to hold the triangle's vertex positions and colors.
 */
function setupBuffersNew() {
    modelViewMatrix = glMatrix.mat4.create();
    // Create vertex array object — holds list of attributes for
    // the triangle.
    vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject); 

    // Create a buffer for positions & bind it to  vertex array object.
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
    // Assign vertex array.
    var triangleVertices = triangles;
    
    // Stores distance of each vertex from center.
    var distance = [];
    
    // Generate a triangle fan around origin
    var z=0.0;
    for (var ring = 0; ring < num_rings; ring++) {
        var radius= ring * 0.25;
        var offset = ring * .05;
        for (var i=0;i<num_vertices;i++){
            var angle = i *  2 * Math.PI / 18;
            var x = (radius * Math.cos(angle)*(ring/4)) + offset;
            var y = (radius * Math.sin(angle)*(ring/4)) + offset;
            //add the vertex coordinates to the array
            triangleVertices.push(x);
            triangleVertices.push(y);
            triangleVertices.push(z);
            distance.push(Math.pow(x,2) + Math.pow(y,2));
        }
    }
    
    var vertices = triangleVertices;
    
    // Makes alternate vertices for linear interpolation.
    makeOtherVertices();
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = vertices.length/3;

    // Binds the buffer that we just made to the vertex position attribute.
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
    // Do the same steps for the color buffer.
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var colors = triangleColors;

    //Alternates between assigning red, blue, and green triangles. 
    var num_items = vertexPositionBuffer.numberOfItems;

    var track = 0;
    for (var j = 0; j < num_items; j++) {
        var hue = [];
        var fade = 1-(distance[j]/3);
        if (track == 0) hue = [fade,0,0];
        else if (track == 1) hue = [0,fade,0];
        else hue = [0,0,fade];
        colors.push(hue[0]);
        colors.push(hue[1]);
        colors.push(hue[2]);
        colors.push(fade);
        if ((j + 1)%3 == 0) track = track + 1;
        if (track > 2) track = 0;
    }
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = vertices.length/4;  
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    // Enable each attribute we are using in the VAO.  
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
    // Unbind the vertex array object to be safe.
    gl.bindVertexArray(null);
}

/**
 * Set up the buffers to hold the logo's vertex positions and colors.
 */
function setupBuffersIllini() {
    // Create vertex array object — holds list of attributes for
    // the triangle.
    vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject); 

    // Create a buffer for positions & bind it to  vertex array object.
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

    // Assigns the vertex array. 
    var vertices = logoVertices;
    
    //Creates the alternate logo vertices for linear interpolation.
    for (var x = 0; x < logoVertices.length; x++) {
        //If orange I, scale down to .25
        if (x >= 117) vertexPosition2.push(vertices[x]*.25);
        //If blue I, scale down to .5
        else vertexPosition2.push(vertices[x]*.5);
    }
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = vertices.length/3;

    // Binds the buffer that we just made to the vertex position attribute.
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
    // Do the same steps for the color buffer.
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var colors = logoColors;

    //The first half (the outline of the Illini logo) should be colored blue.
    //The second half, which is on top, should be orange. 
    var num_items = vertexPositionBuffer.numberOfItems;
    for (var i = 0; i < num_items; i++) {
        for (var j = 0; j < 4; j++) {
            if (i < (num_items/2)) colors.push(illini_blue[j]);
            else colors.push(illini_orange[j]);
        }
    }
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = colors.length/4;  
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Enable each attribute we are using in the VAO.  
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
    // Unbind the vertex array object to be safe.
    gl.bindVertexArray(null);
}

/**
 * Uses the buffer to adjust the vertices of the logo. 
 */
function adjustLogoVertices() {
    // Create the vertex array object
    vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject); 

    // Create a buffer & bind it
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

    // Assign arrays
    var vertices = logoVertices;
    var vertices2 = vertexPosition2;
    var vertices3 = vertexPosition3;
    
    //Determine 'angle' to get time
    var angle = rotAngle*1.2;
    
    if (angle > 360) {
        angle = 0;
    }
    
    var time = Math.cos(degToRad(angle));
    for (var x = 0; x < logoVertices.length; x++) {
        if (vertices3.length != vertices.length) {
            vertices3.push(lerp(vertices[x], vertices2[x], time));
        } else {
            vertices3[x] = lerp(vertices[x], vertices2[x], time);
        }
    }
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices3), gl.DYNAMIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = vertices.length/3;
    // Binds the buffer to the vertex position attribute.
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
    // Do the same steps for the color buffer.
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var colors = logoColors;
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = colors.length/4;  
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Enable each attribute we are using in the VAO.  
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
    // Unbind the vertex array object to be safe.
    gl.bindVertexArray(null);
}

/**
 * Generates the alternate vertices for the triangle fan. 
 */
function makeOtherVertices() {
    // Assign vertex array.
    var triangleVertices = triangles2;
    // Generate a triangle fan around origin
    var z=0.0;

    for (var amt = 0; amt < num_rings; amt++) {
        var radius= amt * 0.25;
        var offset = amt * .05;
        for (var i=0;i<18;i++){
            var angle = i *  2 * Math.PI / (18);
            var x = (radius * Math.cos(angle)*(amt/2)) + offset;
            var y = (radius * Math.sin(angle)*(amt/2)) + offset;
            var mult = 1;
            if (i % 3 != 0) {
                mult = 1.9;
            }
            // add the vertex coordinates to the array
            triangleVertices.push(x*mult);
            triangleVertices.push(y*mult);
            triangleVertices.push(z);
        }
    }
}

/**
 * Uses the buffer to adjust the vertices of the triangle fan. 
 */
function adjustNewVertices() {
    // Create the vertex array object
    vertexArrayObject = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayObject); 

    // Create a buffer and bind 
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

    // Assign vertex arrays
    var vertices = triangles;
    var vertices2 = triangles2;
    var vertices3 = triangles3;
    
    //Determine 'angle' to get time
    var angle = rotAngle*1.2;
    if (angle > 360) {
        angle = 0;
    }
    var time = Math.cos(degToRad(angle));
    for (var x = 0; x < vertices.length; x++) {
        if (vertices3.length != vertices.length) {
            vertices3.push(lerp(vertices2[x], vertices[x], time));
        } else {
            vertices3[x] = lerp(vertices[x], vertices2[x], time);
        }
    }
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices3), gl.DYNAMIC_DRAW);
    vertexPositionBuffer.itemSize = 3;
    vertexPositionBuffer.numberOfItems = vertices3.length/3;

    // Binds the buffer to the vertex position attribute.
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
    // Do the same steps for the color buffer.
    vertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    var colors = triangleColors;
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    vertexColorBuffer.itemSize = 4;
    vertexColorBuffer.numItems = colors.length/4;  
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                         vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    // Enable each attribute we are using in the VAO.  
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    
    // Unbind the vertex array object to be safe.
    gl.bindVertexArray(null);
}

/**
 * Set up the buffers to hold the animation's vertex positions and colors.
 */
function setupBuffers() {
    if (illini) {
        setupBuffersIllini();
    } else {
        setupBuffersNew();
    }
}


/**
 * Draws a frame to the screen.
 */
function draw() {
    // Transform the clip coordinates so the render fills the canvas dimensions.
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    // Clear the screen.
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use the vertex array object that we set up.
    gl.bindVertexArray(vertexArrayObject);
        
    // Send the ModelView matrix with our transformations to the vertex shader.
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrixUniform,
                      false, modelViewMatrix);
    
    // Render the triangle. 
    gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  
    // Unbind the vertex array object to be safe.
    gl.bindVertexArray(null);
}

/**
 * Animates the logo by updating the ModelView matrix with a rotation
 * each frame.
 */
function animateIllini(currentTime) {
    // Read the speed slider from the web page.
    var speed = document.getElementById("speed").value;
    // Convert the time to seconds.
    currentTime *= 0.001;
    // Subtract the previous time from the current time.
    var deltaTime = currentTime - previousTime;
    // Remember the current time for the next frame.
    previousTime = currentTime;

    // Update geometry to rotate 'speed' degrees per second.
    rotAngle += speed * deltaTime;

    if (rotAngle > 360.0)
        rotAngle = 0.0;

    var rad = degToRad(rotAngle);
    
    //Min prevents image from being too distorted.
    var min = .08; 
    
    //Determine scaling factors.
    var scalex = Math.max(Math.abs(1+Math.sin(rad)), min);  
    var scaley = Math.max(Math.abs(Math.sin(rad)), min); glMatrix.mat4.fromScaling(modelViewMatrix, [scalex,scaley,1]);

    // Draw the frame.
    draw();
  
    // Animate the next frame. The animate function is passed the current time in
    // milliseconds.
    animate();
}

/**
 * Animates the triangles by updating the ModelView matrix with a rotation
 * each frame.
 */
function animateNew(currentTime) {
    // Read the speed slider from the web page.
    var speed = document.getElementById("speed").value;

    // Convert the time to seconds.
    currentTime *= 0.001;
    // Subtract the previous time from the current time.
    var deltaTime = currentTime - previousTime;
    // Remember the current time for the next frame.
    previousTime = currentTime;

    // Update geometry to rotate 'speed' degrees per second.
    rotAngle += speed * deltaTime;
  
    if (rotAngle > 360.0)
        rotAngle = 0.0;
    
    var rad = degToRad(rotAngle*speed);
    
    glMatrix.mat4.fromZRotation(modelViewMatrix, degToRad(rotAngle));

    // Draw the frame.
    draw();
  
    // Animate the next frame. The animate function is passed the current time in
    // milliseconds.
    animate();
}

/**
 * Animates the image by updating the ModelView matrix with a rotation
 * each frame.
 */
function animate() {
    // Gets radio button values to determine which animation to show.
    // Refresh is true when switching between animations.
    var refresh = false;
    if (document.getElementById("I").checked == false) {
        if (illini == true) refresh = true;
        illini = false;
    } else {
        if (illini == false) refresh = true;
        illini = true;
    }

    if (refresh) {
        setupShaders();
        setupBuffers();
    }
  
    if (illini) {
        // Adjust vertices with buffer. 
        adjustLogoVertices();
        requestAnimationFrame(animateIllini);
    } else {
        // Adjust vertices with buffer. 
        adjustNewVertices();
        requestAnimationFrame(animateNew);
    }
}

/**
 * Linear Interpolation
 * Given the vertices of two "key frames," (positions of object at two
 * points in time),  calculates the intermediate state between them
 * for smoother animation. 
 * Credit for the equation:
 * http://cs.brown.edu/stc/summer/94Animation/94Animation_13.html
 * @param {number} start The value of start position
 * @param {number} end The value of end position
 * @param {number} t Value in range 0, 1
 * @returns {number} Intermediate vertex
 */
function lerp(v1, v2, t) {
  return v1 + t * (v2 - v1);
}


/**
 * Startup function called from html code to start the program.
 */
function startup() {
    console.log("Starting animation...");
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    setupShaders(); 
    setupBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    animate();
}
