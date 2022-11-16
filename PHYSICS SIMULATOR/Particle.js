/**
 * @file Particle.js
 * @description An abstract structure of a particle
 * @author Alex Capps <amcapps2@illinois.edu>
 */

// Gravity
var gravity = 9.8;

// Time increment
var inc = 0.07;

// Force (Drag)
var drag = 0.1;

// Bounce amt
var bounce = 0.90;

/**
 * Update gravity, drag and bouncing factors
 */
function updateParameters() {
  gravity = parseFloat(document.getElementById("gravity").value);
  document.getElementById("gravityValue").innerHTML = gravity;
  drag = parseFloat(document.getElementById("drag").value);
  document.getElementById("dragValue").innerHTML = drag;
  bounce = parseFloat(document.getElementById("bounce").value);
  document.getElementById("bounceValue").innerHTML = bounce;
}

class Particle {
  /**
   * The constructor
   */
  constructor() {
    // Position
    this.p = vec3.create();
    vec3.random(this.p);
    // Velocity
    this.v = vec3.create();
    vec3.random(this.v);
    // Acceleration
    this.a = [0, -0.1 * gravity, 0];
    // Radius
    this.r = 0.05 + Math.random() * 0.05;
    // Color
    this.R = Math.random();
    this.G = Math.random();
    this.B = Math.random();
  }

  /**
   * Update the position using the current velocity and Euler integration
   */
  updatePosition() {
    var increment = vec3.create();
    vec3.scale(increment, this.v, inc);
    vec3.add(this.p, this.p, increment);

    for (var i = 0; i < 3; i++) {
      if (this.p[i] < -1) {
        this.p[i] = -1;
        this.v[i] = -this.v[i] * bounce;
      }
      if (this.p[i] > 1) {
        this.p[i] = 1;
        this.v[i] = -this.v[i] * bounce;
      }
    }
  }

  /**
   * Update the velocity using the acceleration and Euler integration and drag
   */
  updateVelocity() {
    vec3.scale(this.v, this.v, Math.pow((1 - drag), inc));
    var increment = vec3.create();
    vec3.scale(increment, this.a, inc);
    vec3.add(this.v, this.v, increment);
  }

  /**
   * Update the acceleration using the forces of gravity
   */
  updateAcceleration() {
    this.a = [0, -0.1 * gravity, 0];
  }
}