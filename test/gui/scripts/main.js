/**
 * Created by Primoz on 27.6.2016.
 */

var renderer;
var canvas;

var scene;
var objects = [];
var camera;
var pLight;

var objLoader;
var keyboardInput;

var keyboardRotation = {x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};
var keyboardTranslation = {x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};

var navigatorRotation = {x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};
var navigatorTranslation = {x: 0, y: 0, z: 0, reset: function() { this.x = 0; this.y = 0; this.z = 0; }};

function initializeRenderer(inputCanvas) {
    canvas = inputCanvas;

    // Initialize renderer
    renderer = new M3D.MeshRenderer(canvas, M3D.WEBGL2);
    renderer.clearColor = "#C8C7C7";

    // Set path to shader files
    renderer.addShaderLoaderUrls("../../src/shaders");

    // Initialize object loader
    objLoader = new M3D.ObjLoader();


    keyboardInput = new M3D.KeyboardInput();
    keyboardInput.addListener(function (pressedKeys) {
        // ROTATIONS
        if (pressedKeys[65]) {  // A
            keyboardRotation.y = 1;
        }

        if (pressedKeys[68]) {  // D
            keyboardRotation.y = -1;
        }

        if (pressedKeys[87]) {  // W
            keyboardRotation.x = 1;
        }

        if (pressedKeys[83]) {  // S
            keyboardRotation.x = -1;
        }

        if (pressedKeys[81]) {  // Q
            keyboardRotation.z = 1;
        }

        if (pressedKeys[69]) {  // R
            keyboardRotation.z = -1;
        }


        // TRANSLATIONS
        if (pressedKeys[39]) {  // RIGHT - Right
            keyboardTranslation.x = 1;
        }

        if (pressedKeys[37]) {  // LEFT - Left
            keyboardTranslation.x = -1;
        }

        if (pressedKeys[40]) {  // DOWN - Backward
            keyboardTranslation.z = 1;
        }

        if (pressedKeys[38]) {  // UP - Forward
            keyboardTranslation.z = -1;
        }

        if (pressedKeys[82]) {  // Q - Upward
            keyboardTranslation.y = 1;
        }

        if (pressedKeys[70]) {  // F - Downward
            keyboardTranslation.y = -1;
        }
    });

    initializeScene();

    animate();
}

function initializeScene() {
    // Crete new scene
    scene = new M3D.Scene();

    // Initialize lights and add them to the scene
    var aLight = new M3D.AmbientLight(new THREE.Color("#444444"), 1);
    var dLight = new M3D.DirectionalLight(new THREE.Color("#FFFFF"), 1);
    //var dLight2 = new M3D.DirectionalLight(new THREE.Color("#FF0000"), 1);
    pLight = new M3D.PointLight(new THREE.Color("#FF0000"), 1);

    dLight.position = new THREE.Vector3(0, 0.5, 0.5);
    //dLight2.position = new THREE.Vector3(1, 0, 0);

    scene.add(aLight);
    scene.add(dLight);
    //scene.add(dLight2);
    scene.add(pLight);

    // Camera initialization
    camera = new M3D.PerspectiveCamera(1.483, canvas.width / canvas.height, 10, 10000);
    camera.position = new THREE.Vector3(0, 0, 200);

    objLoader.load("../models/untitled4.obj", function (obj) {
        objects = obj;
        for (var i = 0; i < obj.length; i++) {
            obj[i].position.z = 0;
            obj[i].material = new M3D.MeshPhongMaterial();
            obj[i].material.color = new THREE.Color("#33cc33");
            obj[i].material.specular = new THREE.Color("#999999");
            obj[i].geometry.drawWireframe = false;
            scene.add(obj[i]);
        }
    });


}

function resizeCanvas() {
    // Lookup the size the browser is displaying the canvas.
    var displayWidth  = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    if (canvas.width  != displayWidth ||
        canvas.height != displayHeight) {

        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;

        // Update camera aspect ratio and renderer viewport
        camera.aspect = canvas.width / canvas.height;
        renderer.updateViewport();
    }
}

var prevTime = -1, currTime;
function animate() {
    requestAnimationFrame(animate);

    // Calculate delta time and update timestamps
    currTime = new Date();
    var dt = (prevTime !== -1) ? currTime - prevTime : 0;
    prevTime = currTime;

    update(dt);

    renderer.render(scene, camera);
}

function update(dt) {
    keyboardTranslation.reset();
    keyboardRotation.reset();

    keyboardInput.update();

    // Accumulate keyboard and mouse input
    var translationX = keyboardTranslation.x + navigatorTranslation.x;
    translationX = (translationX > 1) ? 1 : (translationX < -1 ? -1 : translationX);
    var translationY = keyboardTranslation.y + navigatorTranslation.y;
    translationY = (translationY > 1) ? 1 : (translationY < -1 ? -1 : translationY);
    var translationZ = keyboardTranslation.z + navigatorTranslation.z;
    translationZ = (translationZ > 1) ? 1 : (translationZ < -1 ? -1 : translationZ);

    var rotationX = keyboardRotation.x + navigatorRotation.x;
    rotationX = (rotationX > 1) ? 1 : (rotationX < -1 ? -1 : rotationX);
    var rotationY = keyboardRotation.y + navigatorRotation.y;
    rotationY = (rotationY > 1) ? 1 : (rotationY < -1 ? -1 : rotationY);
    var rotationZ = keyboardRotation.z + navigatorRotation.z;
    rotationZ = (rotationZ > 1) ? 1 : (rotationZ < -1 ? -1 : rotationZ);

    camera.translateX(translationX * dt * 0.01);
    camera.translateY(translationY * dt * 0.01);
    camera.translateZ(translationZ * dt * 0.1);

    camera.rotateX(rotationX * dt * 0.0001);
    camera.rotateY(rotationY  * dt * 0.0001);
    camera.rotateZ(rotationZ * dt * 0.001);

    pLight.position = camera.position;
}

