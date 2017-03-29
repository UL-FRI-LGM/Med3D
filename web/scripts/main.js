/**
 * Created by Primoz on 27.6.2016.
 */

var renderer;
var canvas;
var animationRequestId;

var scene;
var camera;
var pLight;

var scenePublisher;
var sceneSubscriber;

var MC = new M3D.MarchingCubes();

function initializeRenderer(inputCanvas) {
    canvas = inputCanvas;

    // Initialize renderer
    renderer = new M3D.MeshRenderer(canvas, M3D.WEBGL2);
    renderer.clearColor = "#C8C7C7";

    // Set path to shader files
    renderer.addShaderLoaderUrls("../../src/shaders");
}

function createDefaultEmptyScene() {
    // Crete new scene
    scene = new M3D.Scene();

    // Initialize lights and add them to the scene
    var aLight = new M3D.AmbientLight(new THREE.Color("#444444"), 1);
    var dLight = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.4);
    pLight = new M3D.PointLight(new THREE.Color("#FFFFFF"), 1);
    dLight.position = new THREE.Vector3(0, 0.5, 0.5);

    scene.add(aLight);
    scene.add(dLight);
    scene.add(pLight);

    // Camera initialization
    camera = new M3D.PerspectiveCamera(60, canvas.width / canvas.height, 1, 2000);
    camera.position = new THREE.Vector3(0, 0, 50);
}

// Scene client
function createSessionSubscriberScene(uuid, callback) {
    // TODO: Handle failure
    var onConnected = function (status, s, c) {

        if (status === 0) {
            // Everything ok
            scene = s[0];
            camera = c[0];
            camera.aspect = canvas.width / canvas.height;

            startRenderLoop();

            callback(true);
        }
        else if (status === 1) {
            sceneSubscriber.unsubscribe();
            sceneSubscriber = null;

            // Session was already terminated
            $("#applicationStatus").text("The requested session is not active anymore.");

            callback(false);
        }
        else {
            sceneSubscriber.unsubscribe();
            sceneSubscriber = null;

            // Something weird went wrong... fallback to normal scene
            $("#applicationStatus").text("Failed to subscribe to host. Unknown error.");

            callback(false);
        }
    };

    var onTerminated = function () {
        $("#applicationStatus").text("Session was terminated by the host.");

        // Mark session not active
        sessionUnsubscribeEvent()
    };

    var listener = new M3D.SceneSubscriberListener(onConnected, onTerminated);

    sceneSubscriber = new M3D.SceneSubscriber(listener);
    sceneSubscriber.subscribe(uuid);
}

function sessionUnsubscribe() {
    sceneSubscriber.unsubscribe();
    sceneSubscriber = null;

    for (var i = 0; i < scene.children.length; i++) {
        if (scene.children[i] instanceof M3D.PointLight) {
            pLight = scene.children[i];
            break;
        }
    }
}
//endregion

//region Scene host
function startSharingScene(callback) {
    if (!scene || !camera) {
        // TODO: Handle this
        console.log("Initialize the scene and camera before publishing.");
        return;
    }
    
    var onConnect = function(result) {
        if (result.status === 0) {
            callback({status: result.status, url: window.location.href.split("?")[0] + "?sessionUuid=" + result.session_uuid});
        }  
    };

    scenePublisher = new M3D.ScenePublisher(scene, camera, onConnect);
    scenePublisher.startPublishing();
}

function stopSharingScene() {
    if (scenePublisher) {
        scenePublisher.stopPublishing();
        scenePublisher = null;
    }
}
//endregion



var prevTime = -1, currTime;

// Main loop
function animate() {
    animationRequestId = requestAnimationFrame(animate);

    // Calculate delta time and update timestamps
    currTime = new Date();
    var dt = (prevTime !== -1) ? currTime - prevTime : 0;
    prevTime = currTime;

    // Do not update the scene in scene subscription is active
    if (!sceneSubscriber) {
        update(dt);
    }

    renderer.render(scene, camera);
}

// Scene update
function update(dt) {
    var transformation = Input.instance.update();

    camera.translateX(transformation.translation.x * dt * 0.01);
    camera.translateY(transformation.translation.y * dt * 0.01);
    camera.translateZ(transformation.translation.z * dt * 0.01);

    camera.rotateX(transformation.rotation.x * dt * 0.001);
    camera.rotateY(transformation.rotation.y  * dt * 0.001);
    camera.rotateZ(transformation.rotation.z * dt * 0.001);

    if (pLight) {
        pLight.position = camera.position;
    }

    if (scenePublisher) {
        scenePublisher.update();
    }
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
        if (camera) {
            camera.aspect = canvas.width / canvas.height;
        }
        renderer.updateViewport();
    }
}


//region Group management (all new objects should be added to the scene via groups)
function sceneAddGroup(group) {
    scene.add(group);
}

function sceneClearGroups() {
    for (var i = 0; i < scene.children.length; i++) {
        if (scene.children[i].type === "Group") {
            scene.remove(scene.children[i]);
        }
    }
}
//endregion

//region Animation controls
function startAnimation() {
    if (!animationRequestId) {
        animate();
    }
}

function stopAnimation() {
    if (animationRequestId) {
        cancelAnimationFrame(animationRequestId);
        animationRequestId = undefined;
    }
}
//endregion




// Obj loading
function loadObjFromFile(file) {
    $("#applicationStatus").text("Loading file " + file.name + ": 0%");
    var objLoader = new M3D.ObjLoader();

    var onLoad = function(data) {
        stopRenderLoop();
        sceneClearGroups();
        renderer.clearCache();

        var group = new M3D.Group();

        for (var i = 0; i < data.length; i++) {
            data[i].position.z = 0;
            data[i].material = new M3D.MeshPhongMaterial();
            data[i].material.specular = new THREE.Color("#777777");
            data[i].material.color = new THREE.Color("#FF0000");
            group.add(data[i]);
        }

        sceneAddGroup(group);
        startRenderLoop();
        $("#applicationStatus").text("Obj file successfully loaded.");
    };

    var onProgress = function(event) {
        $("#applicationStatus").text("Loading file " + file.name + ": " + event.loaded / event.total * 100 + "%");
    };

    objLoader.loadFile(file, onLoad, onProgress);
}

//region Marching cubes
function execMarchingCubes(input) {
    var start = new Date().getTime();
    var nThreads = 8;

    var onLoad = function(data) {
        var end = new Date().getTime();

        $("#applicationStatus").text("Marching cubes finished. Execution time: " + ((end - start)/1000).toFixed(2) + "s, on " + nThreads + " threads.");

        try {
            stopRenderLoop();
            sceneClearGroups();
            renderer.clearCache();

            var group = new M3D.Group();

            for (var i = 0; i < data.length; i++) {
                var bufferGeometry = new M3D.Geometry();
                bufferGeometry.vertices = new M3D.BufferAttribute(data[i], 3);
                bufferGeometry.computeVertexNormals();

                mesh = new M3D.Mesh(bufferGeometry, new M3D.MeshPhongMaterial());
                mesh.material = new M3D.MeshPhongMaterial();
                mesh.material.specular = new THREE.Color("#777777");
                mesh.material.color = new THREE.Color("#FF0000");
                mesh.scale = new THREE.Vector3(100, 100, 100);

                group.add(mesh);
            }


            sceneAddGroup(group);
            startRenderLoop();
        }
        catch (e) {
            console.error(e);
            $("#applicationStatus").text("Something went wrong while trying to add the mesh to the scene.");
        }
    };

    var onProgress = function(progressPercentage) {
        $("#applicationStatus").text("Marching cubes progress: " + progressPercentage.toFixed(1) + "%");
    };

    var onError = function(errorMsg) {
        $("#applicationStatus").text(errorMsg);
    };

    MC.extractMesh(input.meta, input.values, nThreads, onLoad, onProgress, onError);
}

function loadMhdVolumeFromFile(mhdFile, rawFile, isoValue) {
    var reader = new M3D.MHDReader(function(rez) {
        if (rez.status.code !== 0) {
            $("#applicationStatus").text("MHD volume reading failed with code " + rez.status.code + ". " + rez.status.msg);
            return;
        }
        else {
            $("#applicationStatus").text("Successfully read MHD volume. Starting Marching cubes.");
        }

        var dim = rez.meta.dimensions;
        var voxelDim = rez.meta.elementSpacing;

        execMarchingCubes({meta: {dimensions: {x: dim[0], y: dim[1], z: dim[2]}, voxelDimensions: {x: voxelDim[0], y: voxelDim[1], z: voxelDim[2]}, isoLevel: isoValue}, values: rez.data})
    });

    $("#applicationStatus").text("Reading MHD volume.");
    reader.fileLoad(mhdFile, rawFile);
}
//endregion


