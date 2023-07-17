import * as THREE from 'https://cdn.skypack.dev/three@0.124.0';
import { RGBELoader  } from 'https://cdn.skypack.dev/three@0.124.0/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.124.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.124.0/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.124.0/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.124.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OBJLoader } from 'https://cdn.skypack.dev/three@0.134.0/examples/jsm/loaders/OBJLoader.js';

var renderer = new THREE.WebGLRenderer({ canvas : document.getElementById('canvas'), antialias:true});

// default bg canvas color
renderer.setClearColor(0x11151c);

//  use device aspect ratio
renderer.setPixelRatio(window.devicePixelRatio);

// set size of canvas within window
renderer.setSize(window.innerWidth, window.innerHeight);

var scene = new THREE.Scene();
// create a new RGBELoader to import the HDR
const hdrEquirect = new RGBELoader()
  // add your HDR //
	.setPath( 'https://raw.githubusercontent.com/miroleon/gradient_hdr_freebie/main/Gradient_HDR_Freebies/' )
	.load( 'ml_gradient_freebie_02.hdr', function () {

  hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
} );
scene.environment = hdrEquirect;

// add Fog to the scene - if too dark go lower with the second value
scene.fog = new THREE.FogExp2(0x11151c, 0.15);

// create a group to add your camera and object
// by creating a group, you can can work around the fact that three.js currently doesn't allow to add a rotation to the HDR
// when you add the camera and the object to the group, you can later animate the entire group
// you can then create a scene within the group, but then rotate the entire group, which simulates the rotation of the HDR
var group = new THREE.Group();
scene.add(group);

const pointlight = new THREE.PointLight (0x85ccb8, 2.5, 20);
pointlight.position.set (0,3,2);
group.add (pointlight);

const pointlight2 = new THREE.PointLight (0x9f85cc, 2.5, 20);
pointlight2.position.set (0,3,2);
group.add (pointlight2);

// create the camera
var camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 10;
// add the camera to the group
group.add(camera);

const loader = new THREE.TextureLoader();

const baseColorMap1 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map1_BaseColor.png');
const metallicMap1 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map1_Metallic.png');
const normalMap1 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map1_Normal.png');
const roughnessMap1 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map1_Roughness.png');
const aoMap1 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map1_ao.png');

const material1 = new THREE.MeshStandardMaterial({
  map: baseColorMap1,
  metalnessMap: metallicMap1,
  normalMap: normalMap1,
  roughnessMap: roughnessMap1,
  aoMap: aoMap1,
  envMap: hdrEquirect,
  envMapIntensity: 10
});

const baseColorMap2 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map2_BaseColor.png');
const metallicMap2 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map2_Metallic.png');
const normalMap2 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map2_Normal.png');
const roughnessMap2 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map2_Roughness.png');
const aoMap2 = loader.load('https://miroleon.github.io/daily-assets/porcelain/textures/Porcelain_Map2_ao.png');

const material2 = new THREE.MeshStandardMaterial({
  map: baseColorMap2,
  metalnessMap: metallicMap2,
  normalMap: normalMap2,
  roughnessMap: roughnessMap2,
  aoMap: aoMap2,
  envMap: hdrEquirect,
  envMapIntensity: 10
});

// Load the model
const objloader = new OBJLoader();
objloader.load(
    'https://raw.githubusercontent.com/miroleon/daily-assets/main/porcelain/source/Porcelain_Pose.obj',
 (object) => {
        object.children[0].material = material1;
        object.children[1].material = material2;
        object.scale.setScalar( 0.03 );
        object.position.set( 0, -3, 0 );
        group.add(object);
    },
);

// POST PROCESSING
// define the composer
let composer;
// define/add the RenderPass
const renderScene = new RenderPass( scene, camera );

// add the afterimagePass
const afterimagePass = new AfterimagePass();
// for my taste, anything between 0.85 and 0.95 looks good, but your milage may vary
afterimagePass.uniforms[ 'damp' ].value = 0.85;

// add the paramters for your bloom
// play around with the values to make it fit your scene
// note that you might want to consider the bi-directional effect between Fog and Bloom
const bloomparams = {
	exposure: 1,
	bloomStrength: 1,
	bloomThreshold: 0.1,
	bloomRadius: 1
};

// add a new UnrealBloomPass and add the values from the parameters above
const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = bloomparams.bloomThreshold;
bloomPass.strength = bloomparams.bloomStrength;
bloomPass.radius = bloomparams.bloomRadius;

// finally, create a new EffectComposer and add the different effects
composer = new EffectComposer( renderer );
composer.addPass( renderScene );
composer.addPass( afterimagePass );
composer.addPass( bloomPass );

// RESIZE
window.addEventListener( 'resize', onWindowResize );

var theta1 = 0;

// create a new update function for the animations
var update = function() {
  theta1 += 0.0025;

  // create a panning animation for the camera
  camera.position.x = Math.sin( theta1 ) * 8;
  camera.position.z = Math.cos( theta1 ) * 8;
  camera.position.y = 2.5*Math.cos( theta1 ) + 2;
  
  pointlight.position.x = Math.sin( theta1+1 ) * 11;
  pointlight.position.z = Math.cos( theta1+1 ) * 11;
  pointlight.position.y = 2*Math.cos( theta1-3 ) +3;
  
  pointlight2.position.x = -Math.sin( theta1+1 ) * 11;
  pointlight2.position.z = -Math.cos( theta1+1 ) * 11;
  pointlight2.position.y = 2*-Math.cos( theta1-3 ) -6;
  
  // rotate the group to simulate the rotation of the HDR
  group.rotation.y += 0.01;

  // keep the camera look at 0,0,0
	camera.lookAt( 0, 0.5, 0 );
}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
  update();
  composer.render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);