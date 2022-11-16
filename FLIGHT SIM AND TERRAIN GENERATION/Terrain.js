/**
 * @file Terrain.js - A simple 3D terrain model for WebGL
 * @author Ian Rudnick <itr2@illinois.edu>
 * @brief Starter code for CS 418 MP2 at the University of Illinois at
 * Urbana-Champaign.
 * 
 * Updated Spring 2021 for WebGL 2.0/GLSL 3.00 ES.
 * 
 * You'll need to implement the following functions:
 * setVertex(v, i) - convenient vertex access for 1-D array
 * getVertex(v, i) - convenient vertex access for 1-D array
 * generateTriangles() - generate a flat grid of triangles
 * shapeTerrain() - shape the grid into more interesting terrain
 * calculateNormals() - calculate normals after warping terrain
 * 
 * Good luck! Come to office hours if you get stuck!
 */

class Terrain {   
    /**
     * Initializes the members of the Terrain object.
     * @param {number} div Number of triangles along the x-axis and y-axis.
     * @param {number} minX Minimum X coordinate value.
     * @param {number} maxX Maximum X coordinate value.
     * @param {number} minY Minimum Y coordinate value.
     * @param {number} maxY Maximum Y coordinate value.
     */
    constructor(div, minX, maxX, minY, maxY) {
        this.div = div;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        this.minZ = -1;
        this.maxZ = 1;
        this.numWaterVertices = 0;
        
        // Allocate the vertex array
        this.positionData = [];
        // Allocate the normal array.
        this.normalData = [];
        // Allocate the triangle array.
        this.faceData = [];
        // Allocate indices of water locations.
        this.waterVertices = [];
        // Allocate an array for edges so we can draw a wireframe.
        this.edgeData = [];
        
        this.vertexColors = [];
        
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");

        this.shapeTerrain();
        console.log("Terrain: Sculpted terrain");
        this.calculateNormals();
        console.log("Terrain: Generated normals");
        // You can use this function for debugging your buffers:
        // this.printBuffers();
    }


    //-------------------------------------------------------------------------
    /**
     * Set the x,y,z coords of the ith vertex
     * @param {Object} v An array with length 3 containing x,y,z coordinates.
     * @param {number} i The index.
     */
    setVertex(v, i) {
        this.positionData[3*i] = v[0];
        this.positionData[3*i+1] = v[1];
        this.positionData[3*i+2] = v[2];
    }
    

    /**
     * Return the x,y,z coords of the ith vertex
     * @param {Object} v An array with length 3 containing x,y,z coordinates.
     * @param {number} i The index.
     */
    getVertex(v, i) {
        v[0] = this.positionData[3*i];
        v[1] = this.positionData[3*i+1];
        v[2] = this.positionData[3*i+2];
    }


    /**
     * Allocate the triangle arrays. 
     */    
    generateTriangles() {
        var deltaX = (this.maxX - this.minX) / this.div;
        var deltaY = (this.maxY - this.minY) / this.div;

        // Set up the vertex buffer
        for (var i = 0; i <= this.div; i++) {
            for (var j = 0; j <= this.div; j++) {
             this.positionData.push(this.minX+deltaX*j);
             this.positionData.push(this.minY+deltaY*i);
             this.positionData.push(0); // z = 0
                
             // Push points to normal
             this.normalData.push(0);
             this.normalData.push(0);
             this.normalData.push(0);
                
             this.vertexColors.push(0);
             this.vertexColors.push(0);
             this.vertexColors.push(0);
            }
        }
        i = 0;
        j = 0;
        
        this.setMinMaxHeight();
        
        // Prepare face buffer
        for (i = 0; i < this.div; i++) {
            for (j = 0; j < this.div; j++) {
                var v = i * (this.div + 1) + j;

                this.faceData.push(v);
                this.faceData.push(v+1);
                this.faceData.push(v+this.div+1);

                // Other triangle
                this.faceData.push(v+1);
                this.faceData.push(v+1+this.div+1);
                this.faceData.push(v+this.div+1);
            }
        }
        
        // Set up the WebGL buffers.
        this.numVertices = this.positionData.length/3;
        this.numFaces = this.faceData.length/3;

    }

    
    /**
     * Shapes the terrain by randomizing vertices and "flattening" a portion for water effect.
     */
    shapeTerrain() {
        this.partitionHeights(200, 0.005);
        this.addWater();
        this.calculateColors();

    }
    
    /**
    * Adjust vertices with random noise generation and partitions.
    * @param {number} N number of  times to partition.
    * @param {number} delta how much to change each vertex.
    */
    partitionHeights(N, delta)
    {
        for (var iter = 0; iter < N; iter++) {
            var norm = this.genRandNormalVec();
            
            var randm = glMatrix.vec3.create();
            var xdiff = this.maxX-this.minX;
            var ydiff = this.maxY-this.minY;
            randm[0] = this.minX + Math.random() * xdiff;
            randm[1] = this.minY + Math.random() * ydiff;

        for (var i = 0; i < this.numVertices; i++) {
            var adjusted = glMatrix.vec3.create();
            var temp = glMatrix.vec3.create();
            this.getVertex(adjusted, i);                 
            glMatrix.vec3.sub(temp, adjusted, randm); // temp = vertex - randm
            if (glMatrix.vec3.dot(temp, norm) >= 0) { // temp dot normal
                adjusted[2] += delta;
            } else {
                adjusted[2] -= delta;
            }
            this.setVertex(adjusted, i);
        }
    }
    this.setMinMaxHeight();
}
    

    addWater() {
        var lvl = this.minZ + .25 * (this.maxZ - this.minZ);
        for (var i = 0; i < this.numVertices; i++) {
            var vertex = glMatrix.vec3.create();
            var height = this.positionData[3*i+2]; // z coordinate
            if (height < lvl) {
                var vertex = glMatrix.vec3.create();
                this.getVertex(vertex,i);
                vertex[2] = lvl;
                var add = (Math.random()*Math.sin(Math.random()*10*vertex[0]*50.0)) + (Math.random()*Math.cos(vertex[1]*50.0));
                add = lvl-(Math.abs(add)/180);
                
                add =  Math.min(Math.max(add , this.minZ ), this.maxZ );
                vertex[2] = add;
                this.setVertex(vertex, i);
                this.numWaterVertices += 1;
                this.waterVertices.push(i);
            }
        }
    }
    
    /**
     * Set the x,y,z coords of the ith vertex
     * @param {number} i The index of a water vertex.
     * @param {number} currentTime The current time.
     */
    setWaterZ(i, currentTime) {
        var lvl = this.minZ + .17 * (this.maxZ - this.minZ);
        var t = currentTime;
        var vertex = glMatrix.vec3.create();
        this.getVertex(vertex,i);
        var x = vertex[0];
        var y = vertex[1];
        var z = 0;
        var scale = 10;
        z += (Math.sin(x * 1.0 / scale + t * 1.0) + Math.sin(x * 2.3 / scale + t * 1.5) + Math.sin(x * 3.3 / scale + t * 0.4)) / 3;
        z += (Math.sin(y * 0.2 / scale + t * 1.8) + Math.sin(y * 1.8 / scale + t * 1.8) + Math.sin(y * 2.8 / scale + t * 0.8)) / 3;
        vertex[2] = (z/2);
        this.setVertex(vertex,i);
    }
    
     /**
     * Change the x,y,z coords of the water
     * @param {number} currentTime The current time.
     */
    animateWater(currentTime) {
         for (var i = 0; i < this.numWaterVertices; i++) {
             var index = this.waterVertices[i];
             //this.setWaterZ(index, currentTime);
        }
    }
    
    
    /**
    * Return a unit normal vector for the plane
    */
    genRandNormalVec()
    {
        var normal = glMatrix.vec3.create();
        var rad = 2 * Math.PI * Math.random();
        normal[0] = Math.cos(rad);
        normal[1] = Math.sin(rad);
        return normal;
    }

    
        
    /**
     * Sums normals.
     * @param {number[]} indices indexes of the vertices.
     * @param {number[]} norm a normal vector with three values.
     */
    sumNormals(indices, norm) {
        for (var i = 0; i < indices.length; i++) {
            this.normalData[3*indices[i]] += norm[0];
            this.normalData[3*indices[i]+1] += norm[1];
            this.normalData[3*indices[i]+2] += norm[2];
        }
    }

    /**
     * Normalize the normals.
     */
    normalize()
    {
        for (var i = 0; i < this.numVertices; i++) {
            
            var norm = glMatrix.vec3.fromValues(this.normalData[3*i], this.normalData[3*i+1], this.normalData[3*i+2]);
            glMatrix.vec3.normalize(norm, norm);
            
            this.normalData[3*i] = norm[0];
            this.normalData[3*i+1] = norm[1];
            this.normalData[3*i+2] = norm[2];
        }
    }
    
    /**
     * To compute normals per-vertex on the mesh. 
     */
    calculateNormals()
    {
        for (var i = 0; i < this.numFaces; i++) {
            var norm = glMatrix.vec3.create();
            var indices = this.indicesFromVertex(i);
            var points = this.verticesFromIndices(indices);

            glMatrix.vec3.sub(points[1], points[1], points[0]);
            glMatrix.vec3.sub(points[2], points[2], points[0]);
            glMatrix.vec3.cross(norm, points[1], points[2]);
            
            this.sumNormals(indices, norm);
        }

        this.normalize();
        
    }
    
    /**
     * Calculate triangle colors. 
     */
    calculateColors() {
        for (var i = 0; i < this.numFaces; i++) {
            var indices = this.indicesFromVertex(i);
            var points = this.verticesFromIndices(indices);
            var v = glMatrix.vec3.fromValues(0.0,0.0,0.0);
            var h1 = Math.abs((points[0][2]-this.minZ) / (this.maxZ-this.minZ));
            this.faceColor(v,h1);
            var h2 = Math.abs((points[1][2]-this.minZ) / (this.maxZ-this.minZ));
            this.faceColor(v,h2);
            var h3 = Math.abs((points[2][2]-this.minZ) / (this.maxZ-this.minZ));
            this.faceColor(v,h3);
            
            for (var k = 0; k < indices.length; k++) {
                this.vertexColors[3*indices[k]] = v[0]/3;
                this.vertexColors[3*indices[k]+1] = v[1]/3;
                this.vertexColors[3*indices[k]+2] = v[2]/3;
            }

        }
        console.log(this.vertexColors.length);

    }
    
    /**
     * Return the r,g,b values for the height
     * @param {Object} v An array with length 3 containing x,y,z coordinates.
     * @param {number} h The height.
     */
    faceColor(v, h) {
        var w = this.minZ + .25 * (this.maxZ - this.minZ);
        w = Math.abs((w-this.minZ) / (this.maxZ-this.minZ));
        var r = 1.0-(1.0-h);
        var b = .4-h;
        var g = (r + b)/2.0;
        if (h <= w ) {
            //r = (r*h + .05)*.8;
            //b = ((b+(1.0-h))*(h*2.0))*.8; 
            //g = (g + g*h)*.8;
            r = 0.05;
            g = 0.25;
            b = 0.30;
        } else if (h < 0.35 && h >= .25) {
            g = g*(1.0+(1.0-r));
            r = (r+g)/2.5;
            b = (r + b)/3.5;
        } else if (h < 0.60) {
            b = .15;
            g = g*1.4;
        } else {
            b = .15;
            r = r*(1.0-(h/1.1));
            g = g*(1.0-(h/1.75));
            b = b*(1.0-(h/1.75));
        } 
        if (h >= .70) {
            r = r+(h);
            g = g+(h);
            b = b+(h);
        }
        v[0] = v[0]+r;
        v[1] = v[1]+g;
        v[2] = v[2]+b;
    }


    /**
     * Gets indices of the vertices of a triangle.
     * @param {number} i triangle's face index
     */
    indicesFromVertex(i) {
        return [this.faceData[3*i], this.faceData[3*i+1], this.faceData[3*i+2]];
    }
    
    /**
     * Get the coordinates of vertices which compose the triangle
     * @param {number[]} indices index the vertex in positionData
     */
    verticesFromIndices(indices) {
        var v1 = glMatrix.vec3.create();
        var v2 = glMatrix.vec3.create();
        var v3 = glMatrix.vec3.create();
        
        this.getVertex(v1, indices[0]);
        this.getVertex(v2, indices[1]);
        this.getVertex(v3, indices[2]);
        
        return [v1, v2, v3];
    }

    /**
     * Update the minimum and maximum height of all vertices.
     */
  setMinMaxHeight() {
        this.minZ = Infinity;
        this.maxZ = -Infinity;
        for (var i = 0; i < this.numVertices; i++) {
            var height = this.positionData[3*i+2];
            if (height > this.maxZ) {
                this.maxZ = height;   
            } else if (height < this.minZ) {
                this.minZ = height;
            }
        }
    }



    //-------------------------------------------------------------------------
    // Setup code (run once)
    /**
     * Generates line data from the faces in faceData for wireframe rendering.
     */
    generateLines() {
        for (var f = 0; f < this.faceData.length/3; f++) {
            // Calculate index of the face
            var fid = f*3;
            this.edgeData.push(this.faceData[fid]);
            this.edgeData.push(this.faceData[fid+1]);
            
            this.edgeData.push(this.faceData[fid+1]);
            this.edgeData.push(this.faceData[fid+2]);
            
            this.edgeData.push(this.faceData[fid+2]);
            this.edgeData.push(this.faceData[fid]);
        }
    }


    /**
     * Sets up the WebGL buffers and vertex array object.
     * @param {object} shaderProgram The shader program to link the buffers to.
     */
    setupBuffers(shaderProgram) {
        // Create and bind the vertex array object.
        this.vertexArrayObject = gl.createVertexArray();
        gl.bindVertexArray(this.vertexArrayObject);

        // Create the position buffer and load it with the position data.
        this.vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positionData),
                      gl.STATIC_DRAW);
        this.vertexPositionBuffer.itemSize = 3;
        this.vertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexPositionBuffer.numItems, " vertices.");

        // Link the position buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexPosition,
                               this.vertexPositionBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexPosition);
        
        // Specify normals to be able to do lighting calculations
        this.vertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalData),
                      gl.STATIC_DRAW);
        this.vertexNormalBuffer.itemSize = 3;
        this.vertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.vertexNormalBuffer.numItems, " normals.");
        
        // Link the normal buffer to the attribute in the shader program.
        gl.vertexAttribPointer(shaderProgram.locations.vertexNormal,
                               this.vertexNormalBuffer.itemSize, gl.FLOAT, 
                               false, 0, 0);
        gl.enableVertexAttribArray(shaderProgram.locations.vertexNormal);
    

        // Set up the buffer of indices that tells WebGL which vertices are
        // part of which triangles.
        this.triangleIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.faceData),
                      gl.STATIC_DRAW);
        this.triangleIndexBuffer.itemSize = 1;
        this.triangleIndexBuffer.numItems = this.faceData.length;
        console.log("Loaded ", this.triangleIndexBuffer.numItems, " triangles.");
    
        // Set up the index buffer for drawing edges.
        this.edgeIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.edgeData),
                      gl.STATIC_DRAW);
        this.edgeIndexBuffer.itemSize = 1;
        this.edgeIndexBuffer.numItems = this.edgeData.length;
        
        // Unbind everything; we want to bind the correct element buffer and
        // VAO when we want to draw stuff
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    

    //-------------------------------------------------------------------------
    // Rendering functions (run every frame in draw())
    /**
     * Renders the terrain to the screen as triangles.
     */
    drawTriangles() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.triangleIndexBuffer.numItems,
                        gl.UNSIGNED_INT,0);
    }
    

    /**
     * Renders the terrain to the screen as edges, wireframe style.
     */
    drawEdges() {
        gl.bindVertexArray(this.vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.edgeIndexBuffer);
        gl.drawElements(gl.LINES, this.edgeIndexBuffer.numItems,
                        gl.UNSIGNED_INT,0);   
    }


    //-------------------------------------------------------------------------
    // Debugging
    /**
     * Prints the contents of the buffers to the console for debugging.
     */
    printBuffers() {
        for (var i = 0; i < this.numVertices; i++) {
            console.log("v ", this.positionData[i*3], " ", 
                              this.positionData[i*3 + 1], " ",
                              this.positionData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numVertices; i++) {
            console.log("n ", this.normalData[i*3], " ", 
                              this.normalData[i*3 + 1], " ",
                              this.normalData[i*3 + 2], " ");
        }
        for (var i = 0; i < this.numFaces; i++) {
            console.log("f ", this.faceData[i*3], " ", 
                              this.faceData[i*3 + 1], " ",
                              this.faceData[i*3 + 2], " ");
        }  
    }

} // class Terrain