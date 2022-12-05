import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"

//Like a "level". Lets you place objects.
const app = new THREE.Scene();

//What the client can see.
const viewport = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)

//This is what actually does the rendering for the app.
const render = new THREE.WebGLRenderer({
  canvas: document.querySelector('#app')
})

//GLTF allows for rendering of 3D models. This can be used to load them.
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

//Anything further is way better explained by the docs (https://threejs.org/docs/index.html) or intellisense (if you are using visual studio code).

//Position viewport
viewport.position.setZ(5)

//Setup render
render.setPixelRatio(window.devicePixelRatio)
render.setSize(window.innerWidth,window.innerHeight)

//Global light, never changes, static.
const light = new THREE.AmbientLight( 0xFFFFFF, .1 );
app.add( light );

//Light comes out from all directions, does shadows.
const sunLight = new THREE.PointLight( 0xFFFFFF, .3 )
sunLight.position.z=300
app.add( sunLight )

//Bloom Credit: https://www.youtube.com/watch?v=ZtK70Tb9uqg
//Adds a pass over the renderer to load bloom. This replaces render.render() with
//composer.render().
const renderPass = new RenderPass(app, viewport)
const composer = new EffectComposer(render)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  .75,
  1.0,
  0.1
)
composer.addPass(renderPass)
composer.addPass(bloomPass)

//Texture by: https://www.solarsystemscope.com/textures/
//Create giant sphere in world to place sky texture on the inside of.
const sky = new THREE.Mesh( 
  new THREE.SphereGeometry( 3000, 256, 128), 
  new THREE.MeshStandardMaterial( { map: textureLoader.load( './textures/sky/8k_stars.jpg' ), side: THREE.BackSide } ) 
  )
//Increases brightness of stars.
sky.material.color.setRGB(2,2,2)
app.add( sky )

//Uses emssive to cast large bloom. Textures don't show up well on this.
//Placed on day side of the earth.
const sun = new THREE.Mesh(
  new THREE.SphereGeometry( 250, 128, 64),
  new THREE.MeshStandardMaterial( { emissive: 0xFFFF00 } ) 
)
sun.position.setZ(1000)
app.add( sun )

//Textures by: https://www.shadedrelief.com/natural3/pages/textures.html
//Day side of the sphere.
const earthDay = new THREE.Mesh(new THREE.SphereGeometry( 26, 64, 32),new THREE.MeshStandardMaterial({map: textureLoader.load( './textures/earth/2_no_clouds_8k.jpg' )}))
//Placed with a slight offset from center to allow day to show on other side.
earthDay.position.setZ(-95)
app.add( earthDay )

//Night side of sphere.
const earthNight = new THREE.Mesh(new THREE.SphereGeometry( 26, 64, 32),new THREE.MeshStandardMaterial({map: textureLoader.load( './textures/earth/5_night_8k.jpg' )}))
//See earthDay comment for more info.
earthNight.position.setZ(-96)
//Lightens the night side.
earthNight.material.color.setRGB(7,7,7)
app.add( earthNight )

//Placed at center of Day and Night with a slightly bigger size.
const earthClouds = new THREE.Mesh(new THREE.SphereGeometry( 28, 64, 32),new THREE.MeshPhongMaterial({map: textureLoader.load( './textures/earth/Earth-clouds.png' ),transparent: true}))
earthClouds.position.setZ(-95.5)
app.add( earthClouds )

//Placed on night side of the earth.
const moon = new THREE.Mesh(new THREE.SphereGeometry( 10, 64, 32),new THREE.MeshStandardMaterial({map: textureLoader.load( './textures/moon/8k_moon.jpg' )}))
moon.position.setZ(-240)
app.add(moon)

//Controls
var rotateWithMouse = null

function setMouse(ev,bool) {
  rotateWithMouse = bool
}

function mouseMove(ev) {
  if (!rotateWithMouse) {
    return
  }
  //Move earthDay and earthClouds to mouse pos.
  //Night is set to day rotation in render loop.
  earthClouds.rotation.y=ev.clientX/100
  earthDay.rotation.y=ev.clientX/100
}

//Pulls event from browser.
window.addEventListener("pointerdown", (ev) => {setMouse(ev,true)})
window.addEventListener("pointerup", (ev) => {setMouse(ev,false)})
window.addEventListener('mousemove', (ev) => {mouseMove(ev)})

//Allows duck to rotate around earth. Group is set in the center of the earth.
//When a group is rotated the entire group spins from its center point.
//This gives us a perfect circle.
const duckSpinner = new THREE.Group()
duckSpinner.position.setZ(-95.5)
duckSpinner.add(viewport)
viewport.position.setZ(100)

//https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/Duck/glTF
var duck;
loader.load('./models/Duck.gltf', function (gltf) {
  setInterval(() => {
    gltf.scene.rotation.y+=.007
  }, 10);
  //Randomly give the duck a new rotation on each refresh.
  if (Math.random() > .5) {
    var mult = 1
  }else{
    var mult = -1
  }
  gltf.scene.rotation.x=Math.random()/2*mult
  gltf.scene.rotation.y=Math.random()/2*mult
  gltf.scene.rotation.z=Math.random()/2*mult

  //Set the ducks position based on screen size.
  gltf.scene.position.y=-1
  gltf.scene.position.x=3
  if (window.innerWidth < 1200) {
    gltf.scene.position.y=-3
    gltf.scene.position.x=0
  }

  //Set duck at 0,0. See comment above on duck spinner for more info.
  gltf.scene.position.setZ(95.5)

  //Note: Duck variable may be undefined until loaded.
  duck = gltf.scene;
  duckSpinner.add(gltf.scene)
})

//Groups must be added to app together instead of each individual object.
app.add(duckSpinner)

//Fix rendering when window is resized.
window.addEventListener(
  "resize",
  () => {
    viewport.aspect = window.innerWidth / window.innerHeight
    viewport.updateProjectionMatrix()
    render.setSize(window.innerWidth, window.innerHeight)
    if (window.innerWidth < 1200) {
      duck.position.y=-3
      duck.position.x=0
    }else{
      duck.position.y=-1
      duck.position.x=3
    }
  },
  false
)

//Render loop. Ran each frame.
function loop() {
  requestAnimationFrame(loop)

  //If not user mouse or finger down.
  if (!rotateWithMouse) {
    earthClouds.rotation.y+=0.002
    earthDay.rotation.y+=0.0015
  }

  //Rotations
  earthNight.rotation.y=earthDay.rotation.y
  moon.rotation.y+=0.0015/27
  duckSpinner.rotation.y+=0.003
  sky.rotation.y+=0.0001

  //Render bloom
  composer.render()
}
loop()