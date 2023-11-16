import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { RGBELoader  } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/FBXLoader.js';

// DECLARE COMPOSER, MIXER
let composer;
let body_01_mixer, eyes_01_mixer;

// SET RENDERER
var renderer = new THREE.WebGLRenderer({ canvas : document.getElementById('canvas'), antialias: true});

// SET UP CLOCK FOR THE ANIMATION LATER
const clock = new THREE.Clock();

// SET BACKGROUND COLOUR
renderer.setClearColor(0x11151c);

// USE THE DEVICE'S ASPECT RATIO
renderer.setPixelRatio(window.devicePixelRatio);

// SET THE RENDERER SIZE TO THE SIZE OF THE INNER WINDOW
renderer.setSize(window.innerWidth, window.innerHeight);

// CREATE NEW SCENE
var scene = new THREE.Scene();

// create a new RGBELoader to import the HDR
const hdrEquirect = new RGBELoader()
  // add your HDR //
	.setPath( 'https://raw.githubusercontent.com/miroleon/gradient_hdr_freebie/main/Gradient_HDR_Freebies/' )
	.load( 'ml_gradient_freebie_01.hdr', function () {
    
    // ALTERNATIVE GRADIENT
    // .load( 'ml_gradient_freebie_02.hdr', function () {

  hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
} );
scene.environment = hdrEquirect;

// CREATE CAMERA AND SET POSITION
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000 );

// CAMERA POSITION ONLY WORKS IF IT ISN'T OVERWRITTEN BY THE ANIMATION (RIGHT NOW IT DOESN'T HAVE AN EFFECT)
camera.position.z = 20;
camera.position.y = 40;

// MATERIAL FOR THE BLOB WHICH USES THE HDR TO GET IT'S COLOUR THROUGH REFLECTIONS
var blob_mat = new THREE.MeshPhysicalMaterial({
  
  // WHITE COLOUR TO GET MORE REFLECTIONS
  color: 0xffffff,
  
  // ROUGHNESS TO GIVE THE MATERIAL A SOFT PLASTIC LOOK
  roughness: 0.3,
  
  // NO MATELNESS IN ORDER NOT TO MAKE THE MATERIAL TO SHINY
  metalness: 0,
  
  // USE THE HDR AS THE ENVIRONMENT MAP
  envMap: hdrEquirect,
  
  // DECLARE HOW MUCH OF AN EFFECT THE HDR HAS ON THE MATERIAL
  envMapIntensity: 0.5
});

// UNI MATERIAL FOR THE EYES - THE EMISSIVENESS MAKES THAT THE MATERIAL DOESN'T REACT TO OTHER LIGHTS
var uni_mat = new THREE.MeshPhysicalMaterial({
// USE THE HDR AS THE ENVIRONMENT MAP
envMap: hdrEquirect,
  
// BUT MAKE IT HAVE NO IMPACT ON THE MATERIAL
envMapIntensity: 0,

// SET THE EMSSIVE COLOUR TO THE BACKGROUND COLOUR SO THAT IT BLENDS IN
emissive: 0x11151c
});

// SET SCALE FOR THE IMPORTED OBJECTS
var scale = 0.03;

// LOAD THE BLOB
const loader = new FBXLoader();
const body_01 = await loader.loadAsync( 'https://miroleon.github.io/daily-assets/body_03.fbx');

// ADD AN ANIMATION MIXER TO LOAD THE FILE'S ANIMATION
body_01_mixer = new THREE.AnimationMixer( body_01 );
const body_01_action = body_01_mixer.clipAction( body_01.animations[ 0 ] );
body_01_action.play();

body_01.traverse( function ( child ) {
	if ( child.isMesh ) {
    
    // ADD THE MATERIAL TO THE 3D MODEL
    child.material = blob_mat;
}
});

// SET POSITION
body_01.position.set( 0, -5, 0);

// USE THE SCALE FROM ABOVE
body_01.scale.setScalar( scale );

// ADD THE BLOB'S BODY TO THE SCENE
scene.add( body_01 );

// LOAD THE BLOB'S EYES (SEPARATE TO GIVE IT DIFFERENT MATERIALS MORE EASILY)
const eyes_01 = await loader.loadAsync( 'https://miroleon.github.io/daily-assets/eyes_03.fbx');

// ADD AN ANIMATION MIXER TO LOAD THE FILE'S ANIMATION
eyes_01_mixer = new THREE.AnimationMixer( eyes_01 );
const eyes_01_action = eyes_01_mixer.clipAction( eyes_01.animations[ 0 ] );
eyes_01_action.play();

eyes_01.traverse( function ( child ) {
	if ( child.isMesh ) {
    
    // ADD THE MATERIAL TO THE 3D MODEL
    child.material = uni_mat;
}
});

// SET POSITION
eyes_01.position.set( 0, -5, 0);

// USE THE SCALE FROM ABOVE
eyes_01.scale.setScalar( scale );

// ADD THE BLOB'S EYES TO THE SCENE
scene.add( eyes_01 );

// ADD FOG TO THE SCENE
// REGULAR 'FOG' TO FADE TO THE BACKGROUND COLOUR (NOT NECESSARY HERE)
// scene.fog = new THREE.Fog( 0x11151c, 1, 100 );

// 'FOGEXP2' FOR CONTROLLING FOG DENSITY (IMPROTANTLY PLAYS TOGETHER WITH THE BLOOM LATER)
// MORE DENSITY = DARKER
// FIRST VALUE IS FOG COLOUR, SECOND VALUE IS FOG DENSITY
// FOG DESNITY ALSO DEPENDS ON THE DISTANCE BETWEEN CAMERA AND OBJECT (JUST AS IRL)
scene.fog = new THREE.FogExp2(0x11151c, 0.005);


// POST PROCESSING
// ADD A RENDERPASS TO COMBINE THE POST PROCESSING WITH THE SCENE WE CREATED ABOVE
const renderScene = new RenderPass( scene, camera );

// ADD AFTERIMAGE TO ADD THIS RETRO DRAG OF LIGHT IN THE ANIMATION
const afterimagePass = new AfterimagePass();

// DON'T GO TOO HIGH WITH THE 'DAMP' OR IT WILL BREAK THE SCENE
afterimagePass.uniforms[ 'damp' ].value = 0.85;

// ADD YOUR BLOOM PARAMETERS HERE FOR BETTER OVERSIGHT
const bloomparams = {
  
  // BLOOM STRENGTH
	bloomStrength: 1.35,
  
  //IF THE THRESHOLD VALUE IS TOO LOW THE WHOLE SCENE WILL TAKE THE COLOUR OF THE BLOOM
	bloomThreshold: 0.1,
  
  // VALUES HIGHER THAN 1 FOR THE BLOOM RADIUS TEND TO BREAK THE LOOK
	bloomRadius: 1,
};

// ADD THE BLOOMPASS AND THE PARAMTERS FROM ABOVE
const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ));
bloomPass.threshold = bloomparams.bloomThreshold;
bloomPass.strength = bloomparams.bloomStrength;
bloomPass.radius = bloomparams.bloomRadius;

// ADD THE POST PROCESSING TO THE COMPOSER
composer = new EffectComposer( renderer );
composer.addPass( renderScene );
composer.addPass( afterimagePass );
composer.addPass( bloomPass );

// RESIZE
window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

let currentScroll = 0;
let targetScroll = 0;
let ease = 0.00025;

let theta1 = 0;
let theta2 = 0;
let theta3 = 0;

// Add this flag to control the animation loop
let animationActive = true;
// Add this flag to control whether an animation frame has been requested
let animationFrameRequested = false;

window.addEventListener('scroll', () => {
  targetScroll = window.pageYOffset;
  updateScroll();

  const scrollArea = document.querySelector('.scroll-area');
  const scrollAreaRect = scrollArea.getBoundingClientRect();
  const canvasContainer = document.querySelector('.canvas-container');
  const textContainer = document.querySelector('.text-container')
  
  // Check if the "scroll-area" div has scrolled out of view
  if (scrollAreaRect.bottom <= window.innerHeight) {
    // Hide the canvas    
    canvasContainer.style.opacity = '0';
    textContainer.style.opacity = '0';
    
    // Stop the animation loop
    animationActive = false;
    // Reset the animation frame requested flag
    animationFrameRequested = false;
    
  } else {
    // Resume the animation loop and show the canvas if needed
    animationActive = true;
    
    canvasContainer.style.opacity = '1';
    textContainer.style.opacity = '1';
    
    // Only request a new animation frame if one hasn't already been requested
    if (!animationFrameRequested) {
      requestAnimationFrame(animate);
      animationFrameRequested = true;
    }
  }
});

function updateScroll() {
  currentScroll += (targetScroll - currentScroll) * ease;
  
  theta2 = currentScroll * 0.07;
  theta3 = currentScroll * 0.035;
  
  setTimeout(updateScroll, 1000 / 60);
}

// DECLARE ALL THAT YOU WANT TO UDPATE CONTINUOUSLY IN THE UPDATE FUNCTION AND CALL IT LATER IN THE ANIMATE FUNCTION
var update = function() {
  // MAKE THE THETA1 COUNT UP BY USING += SO THAT THE SIN AND COS FUNCTIONS DRAW A GRAPH
  // ALTERNATIVELY YOU COULD ALSO USE THE CLOCK HERE
  theta1 += 0.005+(window.pageYOffset*0.0000025);
  
  // BY USING THE SIN ON THE X AXIS AND THE COS ON THE Z AXIS, WE MOVE AROUND THE OBJECT IN A CIRCLE
  camera.position.x = -Math.sin(theta1+1)*(45+theta2);
  camera.position.z = -Math.cos(theta1+1)*(45+theta2);
  
  // UP AND DOWN MOVEMENT OF THE CAMERA
  camera.position.y = 20*Math.cos(theta1+1)+20+(theta3);
  
  // IN ORDER FOR THE CAMERA TO MOVE AROUND THE OBJECT BUT STILL LOOK AT IT AT EVERY FRAME WE NEED TO ADD THE camera.lookAt INSIDE OF THE UPDATE FUNCTION
	camera.lookAt( 0, 5, 0 );
}

// HANDLE YOUR ANIMATION HERE
function animate() {
  // Check the flag before running the animation
  if (animationActive) {
  // USE THE CLOCK'S DELTA TO GET A CONTINOUS UPWARD COUNTING
  const delta = clock.getDelta();
  
  // USE THE MIXER'S UPDATE FUNCTION TO KEEP THE ANIMATION RUNNING CONTINOUSLY (BY DIVIDING OR MULTIPLYING THE DELTA VALUE WE CAN MAKE THE ANIMATION RUN SLOWER OR FASTER)
  if ( body_01_mixer ) body_01_mixer.update( delta/2 );
  if ( eyes_01_mixer ) eyes_01_mixer.update( delta/2 );
  
  // CALL THE UPDATE FUNCTION FROM ABOVE
  update();
  
  // UPDATE THE COMPOSER
  composer.render();
  
  // REQUEST THE CURRENT ANIMATION FRAME
  requestAnimationFrame(animate);
  }
}


  // REQUEST THE CURRENT ANIMATION FRAME OUTSIDE OF THE ANIMATION FUNCTION
requestAnimationFrame(animate);
