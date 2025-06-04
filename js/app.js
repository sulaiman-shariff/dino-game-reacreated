import * as THREE from "three";

import "./../css/app.scss";

import Stats from "stats.js";
import {
  loader,
  playerDefaultPosition,
  playerModelJump,
  playerModel1,
  playerModel2,
  playerModel3,
} from "./loader.js";
import { moving } from "./moving.js";
import { player, playerHitboxMesh } from "./player.js";
import { enemySpawner, enemies } from "./enemies.js";
import { Environment } from "./environment.js";
import {
  backMusicController,
  jumpMusicController,
  coinMusicController,
  collisionMusicController,
  warningMusicController,
} from "./sounds.js";

export let camera, scene, renderer, controls;
export let light;
export let canvas = document.querySelector("#gameCanvas");
export let mainLoaded = 0;
export let add = () => {
  if (mainLoaded < 20) mainLoaded++;
};

export let collissionDetected = false;
export let scoreValue = 0;
export let low = false;
export let isJump = false;
export let frame = 0;

setTimeout(() => {
  if (mainLoaded < 20) mainLoaded = 20;
}, 4000);
let scoreValueDisplay = document.querySelector("#scoreValue");

// GLOBAL STATES
let isPlaying = false;
let isCollapsed = false;

// global vars
let collapsedScreen = document.querySelector("#collapsedScreen");
let collapsedScreenScore = document.querySelector("#finalScore");
let collapsedScreenButton = document.querySelector("#restartButton");
collapsedScreenButton.addEventListener("click", () => {
  reset();
  collapsedScreen.style.display = "none";
});

let startScreen = document.querySelector(".startMenu");
let buttonStart = document.querySelector(".startGameButton");

let loadingBar = document.querySelector("#loadingBarValue");
let stopLoadingObjectsLoop = true;

// let stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
//document.body.appendChild(stats.dom);

const init = () => {
  // init all required environment

  // check for the highest score in the localstorage
  let bestValue = localStorage.getItem("score")
    ? localStorage.getItem("score")
    : "00000";
  // check how many 0 to add before to always have 5 digits
  document.querySelector("#bestValue").innerHTML = `${
    bestValue.length === 1
      ? "0000"
      : bestValue.length === 2
      ? "000"
      : bestValue.length === 3
      ? "00"
      : bestValue.length === 4
      ? "0"
      : ""
  }${bestValue}
`;

  // init camera
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    500
  );
  camera.position.set(
    12.812632627090226,
    15.972268469235177,
    -9.39261128834728
  );
  camera.rotation.set(
    -2.496329585729413,
    0.6314816254240349,
    2.723419319960275
  );

  // create scene
  scene = new THREE.Scene();

  // lights
  let DLight = new THREE.DirectionalLight(0xc19a4b, 0.5);
  let DLightTargetObject = new THREE.Object3D();
  DLight.position.set(-40, 60, -120);
  DLight.target = DLightTargetObject;
  DLightTargetObject.position.set(10, 2, 10);
  DLight.castShadow = true;
  DLight.shadow.radius = 2;
  // create shadows on objects
  DLight.castShadow = true;
  DLight.shadow.radius = 5;
  DLight.shadow.mapSize.width = 1024 * 1;
  DLight.shadow.mapSize.height = 1024 * 1;
  DLight.shadow.camera.scale.y = 10;
  DLight.shadow.camera.scale.x = 20;
  DLight.shadow.camera.near = 0;
  DLight.shadow.camera.far = 200;
  // ambient light(everywhere)
  let ALight = new THREE.AmbientLight(0xccb5ac, 1);

  scene.add(ALight);
  scene.add(DLightTargetObject);
  scene.add(DLight);

  // add fog
  scene.fog = new THREE.Fog(0xe7b251, 1, 125);

  // scene background color(environment)
  scene.background = new THREE.Color(0xe7b251);

  loader(); // all objects loaders

  renderer = new THREE.WebGLRenderer({
    antialias: true, // better quality
    canvas: canvas, // render to existing canvas
  });

  renderer.shadowMap.enabled = true; // enable shadows
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.BasicShadowMap;

  // just for testing

  // on window resize
  window.addEventListener("resize", onWindowResize, false);
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add key state tracking
const keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  KeyW: false,
  KeyS: false,
  Space: false
};

let lastKeyPressTime = 0;
const KEY_RESET_DELAY = 100; // ms

// handle keypress
const keyPressedHandler = (e) => {
  const now = performance.now();
  
  // If it's been too long since the last key press, reset states
  if (now - lastKeyPressTime > KEY_RESET_DELAY) {
    resetKeyStates();
  }
  lastKeyPressTime = now;

  // Update key state
  keyStates[e.code] = true;

  // duck
  if (e.code === "KeyS" || e.code === "ArrowDown") {
    // Force reset if we're in an invalid state
    if (isJump) {
      resetKeyStates();
      return;
    }
    if (playerModel1.position.x > 9) return;
    
    isJump = false;
    // hit box
    playerHitboxMesh.scale.y = 0.6;
    playerHitboxMesh.position.y = 5;
    low = true;

    // jump
  } else if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
    // Force reset if we're in an invalid state
    if (isJump || low) {
      resetKeyStates();
      return;
    }
    if (playerModel1.position.x > 9) return;

    jumpMusicController.play(); // jump sound

    isJump = true;
    playerHitboxMesh.position.y = 13;
    playerModelJump.position.y = 11;

    playerModel1.visible = false;
    playerModel2.visible = false;
    playerModel3.visible = false;
    playerModelJump.visible = true;

    // Dynamic jump duration based on speed multiplier
    let jumpDuration = 500 / (typeof speedManager !== 'undefined' ? speedManager.getSpeedMultiplier() : 1);
    setTimeout(() => {
      if (isJump) { // Only reset if we're still jumping
        playerHitboxMesh.position.y = 8;
        playerModelJump.position.y = 5;
        isJump = false;
        playerModelJump.visible = false;
        playerModel1.visible = true;
      }
    }, jumpDuration);
  }
};

// realease the key press
const keyUpHandler = (e) => {
  // Update key state
  keyStates[e.code] = false;

  if (e.code === "KeyS" || e.code === "ArrowDown") {
    setTimeout(() => {
      if (!isJump) { // Only reset if we're not jumping
        playerHitboxMesh.position.y = 8;
        playerHitboxMesh.scale.y = 1;
        low = false;
      }
    }, 100);
  }
};

// Add function to reset all key states
const resetKeyStates = () => {
  // Reset key states
  Object.keys(keyStates).forEach(key => {
    keyStates[key] = false;
  });
  
  // Force reset of game states
  isJump = false;
  low = false;
  
  // Reset player position and scale
  playerHitboxMesh.position.y = 8;
  playerHitboxMesh.scale.y = 1;
  
  // Reset player model visibility
  playerModelJump.visible = false;
  playerModel1.visible = true;
  playerModel2.visible = false;
  playerModel3.visible = false;
  
  // Force a keyup event for all relevant keys
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space'];
  keys.forEach(key => {
    const event = new KeyboardEvent('keyup', { code: key });
    window.dispatchEvent(event);
  });
};

// for collision detection
let eBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

// function to reset game after the collision
const reset = () => {
  isJump = false; // if collision was in the air

  eBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); // reset the hitbox
  enemies.length = 0; // clean enemies array

  scene.children = scene.children.filter((one) => one.name !== "enemy"); // left only not enemy children

  playerHitboxMesh.position.set(
    playerDefaultPosition.x,
    8,
    playerDefaultPosition.z
  );

  scoreValue = 0; // reset score value

  // check if there is a highscore from the localstorage
  let bestValue = localStorage.getItem("score")
    ? localStorage.getItem("score")
    : "00000";

  // add 0 at the beginning to have always 5 digits
  document.querySelector("#bestValue").innerHTML = `${
    bestValue.length === 1
      ? "0000"
      : bestValue.length === 2
      ? "000"
      : bestValue.length === 3
      ? "00"
      : bestValue.length === 4
      ? "0"
      : ""
  }${bestValue}`;

  // reset global state
  isCollapsed = false;
  isPlaying = true;

  renderer.render(scene, camera);

  // new initial respawn
  enemySpawner({ x: -150 });
  enemySpawner({ x: -210 });
  enemySpawner({ x: -260 });
  enemySpawner({ x: -310 });
  // restart the music
  backMusicController.play();

  // Reset controls inversion state
  controlsInversionManager.reset();
  // Reset speed state and banners
  if (typeof speedManager !== 'undefined') speedManager.reset();
};

// main animate function ( game loop )
const animate = () => {
  requestAnimationFrame(animate);

  frame++;

  // stats.begin();

  if (!isPlaying || isCollapsed) return;

  // check + movement for all the elements
  moving();

  // update the score
  scoreValueDisplay.innerHTML = `${
    scoreValue.toFixed(0).length === 1
      ? "0000"
      : scoreValue.toFixed(0).length === 2
      ? "000"
      : scoreValue.toFixed(0).length === 3
      ? "00"
      : scoreValue.toFixed(0).length === 4
      ? "0"
      : ""
  }${scoreValue.toFixed(0)}`;
  scoreValue += 0.3;

  // Check for score-based inversion
  controlsInversionManager.checkScore();

  if (
    (scoreValue.toFixed(0) * 1) % 100 === 0 &&
    scoreValue.toFixed(0) * 1 !== 0
  )
    coinMusicController.play(); // coin sound on every 100 points

  // collision check
  if (enemies.length) {
    enemies.map((e) => {
      let pBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
      pBox.setFromObject(playerHitboxMesh); // from the player
      eBox.setFromObject(e.one ? e.one : e); // from the current enemy

      if (eBox.intersectsBox(pBox)) {
        // pause back music and play hit sound
        backMusicController.pause();
        collisionMusicController.play();
        // display collapsedScreen
        collapsedScreen.style.display = "block";
        collapsedScreenScore.innerHTML = `Score:${scoreValue.toFixed(0)}`;

        // change state
        isCollapsed = true;
        isPlaying = false;

        // get score from the localStorage
        let score = localStorage.getItem("score");

        // if there is a value and that value is less than current
        if (score * 1 < scoreValue) {
          localStorage.setItem("score", scoreValue.toFixed(0));
        }
      }
    });
  }

  renderer.render(scene, camera);

  // stats.end();
};

// to start the game( menu )
buttonStart.addEventListener("click", () => {
  startScreen.style.display = "none";
  isPlaying = true;

  backMusicController.play();

  // spawn the enemies
  enemySpawner({ x: -150 });
  enemySpawner({ x: -210 });
  enemySpawner({ x: -260 });
  enemySpawner({ x: -310 });
});

// key events
document.addEventListener("keydown", keyPressedHandler);
document.addEventListener("keyup", keyUpHandler);

// function(loop) to check if all objects was loaded and then start the game
const loadingObjects = () => {
  if (!stopLoadingObjectsLoop) return;

  loadingBar.style.width = `${mainLoaded * 5.3}%`; // loading bar fullfill based on number of objects loaded

  if (mainLoaded === 20) {
    // replace loading bar with start button
    buttonStart.style.display = "block";
    document.querySelector("#loadingBarValue").style.display = "none";

    // init environment
    Environment();

    // init player
    player();

    // stop current loop
    stopLoadingObjectsLoop = false;
  }
  requestAnimationFrame(loadingObjects);
};

loadingObjects(); // start check loop
init(); // init scene
animate(); // start game loop (blocked before all objects are loaded)

// --- Controls Inversion Feature ---
class ControlsInversionManager {
  constructor() {
    // State
    this.state = 'NORMAL_PLAY';
    this.timers = [];
    this.inversionCount = 0;
    this.totalPlayTime = 0;
    this.inversionActive = false;
    this.paused = false;
    this.pauseTimestamp = null;
    this.remainingTimes = {};
    this.inversionStartTimestamp = null;
    this.inversionDuration = 0;
    this.cooldownMin = 15; // Minimum 15s gap between inversions
    this.cooldownMax = 30; // Maximum 30s gap between inversions
    this.firstInversionScore = 300; // First inversion at score 100
    this.inversionMin = 8; // Minimum 8s inversion duration
    this.inversionMax = 15; // Maximum 15s inversion duration
    this.lastTimestamp = null;
    this.pendingStateChange = null;
    this._setupUI();
    this._bindPauseResume();
    this._bindGameOver();
    this._bindGameStart();
  }

  _setupUI() {
    this.warningBanner = document.getElementById('inversionWarningBanner');
    this.indicator = document.getElementById('inversionIndicator');
    this.revertBanner = document.getElementById('revertWarningBanner');
    this.normalBanner = document.getElementById('controlsNormalBanner');
    this.gameCanvas = document.getElementById('gameCanvas');
  }

  _bindPauseResume() {
    // Listen for pause/resume (isPlaying/isCollapsed)
    const origAnimate = animate;
    const self = this;
    window.animate = function() {
      if (!isPlaying || isCollapsed) {
        if (!self.paused) self.pause();
      } else {
        if (self.paused) self.resume();
      }
      origAnimate();
    };
  }

  _bindGameOver() {
    // Reset inversion on game over
    const origReset = reset;
    const self = this;
    window.reset = function() {
      self.reset();
      origReset();
    };
  }

  _bindGameStart() {
    // Start inversion logic on game start
    const origStart = buttonStart.onclick || (()=>{});
    const self = this;
    buttonStart.onclick = function() {
      self.start();
      if (typeof origStart === 'function') origStart();
    };
  }

  _clearTimers() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  _setTimer(fn, ms) {
    const t = setTimeout(fn, ms);
    this.timers.push(t);
    return t;
  }

  _showBanner(banner, text, duration, animationClass = null) {
    banner.textContent = text;
    banner.style.display = 'block';
    if (animationClass) banner.classList.add(animationClass);
    if (duration) {
      setTimeout(() => {
        banner.style.display = 'none';
        if (animationClass) banner.classList.remove(animationClass);
      }, duration);
    }
  }

  _hideBanner(banner, animationClass = null) {
    banner.style.display = 'none';
    if (animationClass) banner.classList.remove(animationClass);
  }

  _setInversionBorder(on) {
    if (on) {
      this.gameCanvas.classList.add('inversion-border');
    } else {
      this.gameCanvas.classList.remove('inversion-border');
    }
  }

  _clearInputBuffer() {
    // Only clear input buffer when explicitly needed (like on game reset)
    ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'].forEach(code => {
      const e = new KeyboardEvent('keyup', {code});
      window.dispatchEvent(e);
    });
  }

  _getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  _difficultyScale() {
    if (this.inversionCount >= 5) {
      this.inversionMin = 8; // Keep minimum at 8s
      this.inversionMax = 12; // Slightly reduce maximum duration after 5 inversions
    }
  }

  start() {
    this.reset();
    this.lastTimestamp = performance.now();
  }

  reset() {
    this._clearTimers();
    this.state = 'NORMAL_PLAY';
    this.inversionActive = false;
    this.inversionCount = 0;
    this.totalPlayTime = 0;
    this.paused = false;
    this.pauseTimestamp = null;
    this.remainingTimes = {};
    this.inversionStartTimestamp = null;
    this.inversionDuration = 0;
    this._hideBanner(this.warningBanner);
    this._hideBanner(this.indicator);
    this._hideBanner(this.revertBanner);
    this._hideBanner(this.normalBanner);
    this._setInversionBorder(false);
    
    // Schedule the first inversion after reset
    this._scheduleNextInversion(true);
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.pauseTimestamp = performance.now();
    // Save remaining times for all timers
    this.remainingTimes = {};
    for (const t of this.timers) {
      clearTimeout(t);
    }
    this.timers = [];
    // No precise way to get remaining time for setTimeout, so this is a limitation
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    const now = performance.now();
    if (this.state === 'NORMAL_PLAY') {
      this._scheduleNextInversion();
    } else if (this.state === 'PENDING_INVERSION_WARNING') {
      this._showInversionWarning();
    } else if (this.state === 'INVERTED_PLAY') {
      this._startInversion(this.inversionDuration - ((now - this.inversionStartTimestamp) / 1000));
    } else if (this.state === 'PENDING_REVERT_WARNING') {
      this._showRevertWarning();
    }
  }

  _scheduleNextInversion(isFirst = false) {
    this._difficultyScale();
    let delay;
    
    if (isFirst) {
      // For first inversion, check score in the game loop
      this.state = 'WAITING_FOR_SCORE';
      return;
    } else {
      // For subsequent inversions, use random cooldown between 15-30 seconds
      delay = this._getRandom(this.cooldownMin, this.cooldownMax);
      const warningLeadTime = 1;
      const warningDelay = (delay - warningLeadTime) * 1000;
      this.state = 'NORMAL_PLAY';
      this._setTimer(() => this._showInversionWarning(), warningDelay);
    }
  }

  _showInversionWarning() {
    this.state = 'PENDING_INVERSION_WARNING';
    this._showBanner(this.warningBanner, 'WARNING: Controls Inverting Soon!', 750, null);
    warningMusicController.play(); // Play warning sound
    setTimeout(() => {
      this._hideBanner(this.warningBanner);
    }, 750);
    setTimeout(() => {
      this._startInversion();
    }, 1000);
  }

  _showRevertWarning() {
    this.state = 'PENDING_REVERT_WARNING';
    this._showBanner(this.revertBanner, 'CONTROLS RETURNING SOON', null, null);
    warningMusicController.play(); // Play warning sound
  }

  _endInversion() {
    this.state = 'NORMAL_PLAY';
    this.inversionActive = false;
    this._hideBanner(this.indicator);
    this._hideBanner(this.revertBanner);
    this._setInversionBorder(false);
    this._showBanner(this.normalBanner, 'CONTROLS NORMAL', 500, null);
    setTimeout(() => {
      this._hideBanner(this.normalBanner);
    }, 500);
    this._scheduleNextInversion();
  }

  _startInversion(duration = null) {
    this.state = 'INVERTED_PLAY';
    this.inversionActive = true;
    this.inversionCount++;
    this._showBanner(this.indicator, 'CONTROLS INVERTED', null, null);
    this._setInversionBorder(true);
    this.inversionDuration = duration || this._getRandom(this.inversionMin, this.inversionMax);
    this.inversionStartTimestamp = performance.now();
    
    // Schedule revert warning and end of inversion
    const revertWarningDelay = (this.inversionDuration - 2) * 1000;
    this._setTimer(() => {
      if (this.state === 'INVERTED_PLAY') { // Only show revert warning if still inverted
        this._showRevertWarning();
      }
    }, revertWarningDelay);
    
    // Schedule end of inversion
    this._setTimer(() => {
      if (this.state === 'INVERTED_PLAY' || this.state === 'PENDING_REVERT_WARNING') {
        this._endInversion();
      }
    }, this.inversionDuration * 1000);
  }

  isInverted() {
    return this.inversionActive;
  }

  // Add new method to check score
  checkScore() {
    if (this.state === 'WAITING_FOR_SCORE' && scoreValue >= this.firstInversionScore) {
      this._showInversionWarning();
    }
  }
}

// --- Speed Surge & Brake Feature ---
class SpeedManager {
  constructor() {
    // State
    this.state = 'NORMAL_PLAY';
    this.timers = [];
    this.obstaclesCleared = 0;
    this.baselineSpeed = 0.5; // Base speed for movement
    this.currentSpeed = this.baselineSpeed;
    this.surgeMultiplier = 1.25;
    this.brakeMultiplier = 0.5;
    this.paused = false;
    this.pauseTimestamp = null;
    this.remainingTimes = {};
    this.pendingStateChange = null;
    this.surgePendingTimeout = null;
    this.surgePendingLock = false;
    this._setupUI();
    this._bindPauseResume();
    this._bindGameOver();
    this._bindGameStart();
  }

  _setupUI() {
    // Create UI elements
    this.surgeBanner = document.createElement('div');
    this.surgeBanner.id = 'surgeBanner';
    this.surgeBanner.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 40px;
      color: cyan;
      font-size: 32px;
      font-weight: bold;
      display: none;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 1000;
      background: rgba(0,0,0,0.4);
      padding: 14px 28px;
      border-radius: 8px;
      border: 2px solid cyan;
      pointer-events: none;
    `;
    document.body.appendChild(this.surgeBanner);

    this.brakeBanner = document.createElement('div');
    this.brakeBanner.id = 'brakeBanner';
    this.brakeBanner.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 40px;
      color: darkblue;
      font-size: 32px;
      font-weight: bold;
      display: none;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 1000;
      background: rgba(0,0,0,0.4);
      padding: 14px 28px;
      border-radius: 8px;
      border: 2px solid darkblue;
      pointer-events: none;
    `;
    document.body.appendChild(this.brakeBanner);

    this.normalBanner = document.createElement('div');
    this.normalBanner.id = 'normalBanner';
    this.normalBanner.style.cssText = `
      position: fixed;
      bottom: 40px;
      right: 40px;
      color: #00ff00;
      font-size: 32px;
      font-weight: bold;
      display: none;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      z-index: 1000;
      background: rgba(0,0,0,0.4);
      padding: 14px 28px;
      border-radius: 8px;
      border: 2px solid #00ff00;
      pointer-events: none;
    `;
    document.body.appendChild(this.normalBanner);

    this.scoreFlash = document.createElement('div');
    this.scoreFlash.id = 'scoreFlash';
    this.scoreFlash.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    `;
    document.querySelector('#scoreValue').parentElement.style.position = 'relative';
    document.querySelector('#scoreValue').parentElement.appendChild(this.scoreFlash);
  }

  _bindPauseResume() {
    const origAnimate = animate;
    const self = this;
    window.animate = function() {
      if (!isPlaying || isCollapsed) {
        if (!self.paused) self.pause();
      } else {
        if (self.paused) self.resume();
      }
      origAnimate();
    };
  }

  _bindGameOver() {
    const origReset = reset;
    const self = this;
    window.reset = function() {
      self.reset();
      origReset();
    };
  }

  _bindGameStart() {
    const origStart = buttonStart.onclick || (()=>{});
    const self = this;
    buttonStart.onclick = function() {
      self.start();
      if (typeof origStart === 'function') origStart();
    };
  }

  _clearTimers() {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }

  _setTimer(fn, ms) {
    const t = setTimeout(fn, ms);
    this.timers.push(t);
    return t;
  }

  _showBanner(banner, text, duration, animationClass = null) {
    banner.textContent = text;
    banner.style.display = 'block';
    if (animationClass) banner.classList.add(animationClass);
    
    // Add fade-in animation
    banner.style.opacity = '0';
    banner.style.transition = 'opacity 0.3s ease-in-out';
    setTimeout(() => {
      banner.style.opacity = '1';
    }, 10);

    if (duration) {
      setTimeout(() => {
        // Add fade-out animation
        banner.style.opacity = '0';
        setTimeout(() => {
          banner.style.display = 'none';
          if (animationClass) banner.classList.remove(animationClass);
        }, 300);
      }, duration);
    }
  }

  _hideBanner(banner, animationClass = null) {
    if (banner.style.display === 'block') {
      banner.style.opacity = '0';
      setTimeout(() => {
        banner.style.display = 'none';
        if (animationClass) banner.classList.remove(animationClass);
      }, 300);
    } else {
      banner.style.display = 'none';
      if (animationClass) banner.classList.remove(animationClass);
    }
  }

  _flashScore() {
    this.scoreFlash.style.opacity = '1';
    this.scoreFlash.style.display = 'block';
    setTimeout(() => {
      this.scoreFlash.style.opacity = '0';
      setTimeout(() => {
        this.scoreFlash.style.display = 'none';
      }, 200);
    }, 500);
  }

  start() {
    this.reset();
  }

  reset() {
    this._clearTimers();
    this.state = 'NORMAL_PLAY';
    this.obstaclesCleared = 0;
    this.currentSpeed = this.baselineSpeed;
    this.paused = false;
    this.pauseTimestamp = null;
    this.remainingTimes = {};
    if (this.surgePendingTimeout) {
      clearTimeout(this.surgePendingTimeout);
      this.surgePendingTimeout = null;
      this.surgePendingLock = false;
    }
    this._hideBanner(this.surgeBanner);
    this._hideBanner(this.brakeBanner);
    this._hideBanner(this.normalBanner);
    this._clearKeyStates();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.pauseTimestamp = performance.now();
    this.remainingTimes = {};
    for (const t of this.timers) {
      clearTimeout(t);
    }
    this.timers = [];
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    const now = performance.now();
    if (this.state === 'PENDING_SURGE_WARNING') {
      this._showPendingSurgeWarning();
    } else if (this.state === 'SURGED') {
      this._startSurge(this.remainingTimes.surge);
    } else if (this.state === 'BRAKING') {
      this._startBrake(this.remainingTimes.brake);
    }
  }

  onObstacleCleared() {
    if (this.state !== 'NORMAL_PLAY') return;
    this.obstaclesCleared++;
    if (
      this.obstaclesCleared % 3 === 0 && Math.random() < 0.33 && !this.surgePendingLock
    ) {
      this.surgePendingLock = true;
      this.surgePendingTimeout = setTimeout(() => {
        this._showPendingSurgeWarning();
        this.surgePendingLock = false;
        this.surgePendingTimeout = null;
      }, 500);
    }
  }

  _clearKeyStates() {
    resetKeyStates();
    // Add a small delay before allowing new key presses
    setTimeout(() => {
      lastKeyPressTime = performance.now();
    }, 50);
  }

  _showPendingSurgeWarning() {
    this.state = 'PENDING_SURGE_WARNING';
    this._flashScore();
    warningMusicController.play();
    this._clearKeyStates();
    this._setTimer(() => {
      this.scoreFlash.style.opacity = '0';
      this.scoreFlash.style.display = 'none';
      this._deferOrRun(() => this._startSurge());
    }, 500);
  }

  _startSurge(duration = 5000) {
    this.state = 'SURGED';
    this.currentSpeed = this.baselineSpeed * this.surgeMultiplier;
    this._showBanner(this.surgeBanner, 'SPEED SURGE', null);
    // Pulsating underline effect
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
      if (this.state !== 'SURGED') {
        clearInterval(pulseInterval);
        return;
      }
      this.surgeBanner.style.textDecoration = pulseCount % 2 === 0 ? 'underline' : 'none';
      pulseCount++;
    }, 250);
    this._setTimer(() => {
      clearInterval(pulseInterval);
      this._hideBanner(this.surgeBanner);
      this._deferOrRun(() => this._startBrake());
    }, duration);
  }

  _startBrake(duration = 3000) {
    this.state = 'BRAKING';
    this.currentSpeed = this.baselineSpeed * this.brakeMultiplier;
    this._showBanner(this.brakeBanner, 'SPEED BRAKE', null);
    this._setTimer(() => {
      this._hideBanner(this.brakeBanner);
      this._deferOrRun(() => this._revertToNormal());
    }, duration);
  }

  _revertToNormal() {
    this.state = 'NORMAL_PLAY';
    this.currentSpeed = this.baselineSpeed;
    this._showBanner(this.normalBanner, 'SPEED NORMAL', 500);
    this._clearKeyStates(); // Clear key states when returning to normal
  }

  getSpeedMultiplier() {
    return this.currentSpeed / this.baselineSpeed;
  }

  // Helper to defer state change if jumping
  _deferOrRun(fn) {
    if (window.isJump) {
      this.pendingStateChange = fn;
      // Listen for jump end
      if (!this._jumpListenerAttached) {
        this._jumpListenerAttached = true;
        const checkJumpEnd = () => {
          if (!window.isJump) {
            this._jumpListenerAttached = false;
            if (this.pendingStateChange) {
              this.pendingStateChange();
              this.pendingStateChange = null;
            }
          } else {
            requestAnimationFrame(checkJumpEnd);
          }
        };
        requestAnimationFrame(checkJumpEnd);
      }
    } else {
      fn();
    }
  }
}

// Singleton instance
const speedManager = new SpeedManager();
export { speedManager };

// Singleton instance
const controlsInversionManager = new ControlsInversionManager();

// Patch key handlers to support inversion
const origKeyPressedHandler = keyPressedHandler;
const origKeyUpHandler = keyUpHandler;
function invertedKeyPressedHandler(e) {
  // Swap left/right and up/down if inverted
  let code = e.code;
  if (controlsInversionManager.isInverted()) {
    if (code === 'ArrowLeft') code = 'ArrowRight';
    else if (code === 'ArrowRight') code = 'ArrowLeft';
    else if (code === 'KeyA') code = 'KeyD';
    else if (code === 'KeyD') code = 'KeyA';
    else if (code === 'ArrowUp') code = 'ArrowDown';
    else if (code === 'ArrowDown') code = 'ArrowUp';
    else if (code === 'KeyW') code = 'KeyS';
    else if (code === 'KeyS') code = 'KeyW';
    // Jump/duck logic: leave jump/duck unchanged as per spec
  }
  // Create a new event with swapped code
  const newEvent = new KeyboardEvent(e.type, { ...e, code });
  origKeyPressedHandler(newEvent);
}
function invertedKeyUpHandler(e) {
  let code = e.code;
  if (controlsInversionManager.isInverted()) {
    if (code === 'ArrowLeft') code = 'ArrowRight';
    else if (code === 'ArrowRight') code = 'ArrowLeft';
    else if (code === 'KeyA') code = 'KeyD';
    else if (code === 'KeyD') code = 'KeyA';
    else if (code === 'ArrowUp') code = 'ArrowDown';
    else if (code === 'ArrowDown') code = 'ArrowUp';
    else if (code === 'KeyW') code = 'KeyS';
    else if (code === 'KeyS') code = 'KeyW';
  }
  const newEvent = new KeyboardEvent(e.type, { ...e, code });
  origKeyUpHandler(newEvent);
}
document.removeEventListener('keydown', keyPressedHandler);
document.removeEventListener('keyup', keyUpHandler);
document.addEventListener('keydown', invertedKeyPressedHandler);
document.addEventListener('keyup', invertedKeyUpHandler);
// --- End Controls Inversion Feature ---
