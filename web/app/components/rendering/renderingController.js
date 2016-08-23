/**
 * Created by Primoz on 20.7.2016.
 */

app.factory('PublicRenderData', function(){
    return {
        contentRenderGroup: null,
        canvasDimensions: {width: 1280, height: 1024},

        // Camera management
        activeCamera: null,
        cameras: [],
        sharedCameras: {},

        // Function binder
        replaceRenderContent: null,
        setActiveCamera: null
    };
});


var renderingController = function($scope, SettingsService, InputService, TaskManagerService, Annotations, PublicRenderData, SharingService) {
    // Context
    var self = this;

    // Private renderer components
    this.renderer = null;
    this.raycaster = null;
    this.scene = null;

    this.animationRequestId = null;

    // Public rendering data (used in scene sharing)
    $scope.publicRenderData = PublicRenderData;
    $scope.publicRenderData.contentRenderGroup = new M3D.Group();
    $scope.publicRenderData.replaceRenderContent = function (...objects) {
        $scope.stopAnimation();
        $scope.publicRenderData.contentRenderGroup.clear();
        self.renderer.clearCache();
        $scope.$apply($scope.annotations.clear);

        // Add new render content
        for (var i = 0; i < objects.length; i++) {
            $scope.publicRenderData.contentRenderGroup.add(objects[i]);
        }
        $scope.startAnimation();
    };
    $scope.publicRenderData.setActiveCamera = function (camera) {
        $scope.publicRenderData.activeCamera = camera;
        $scope.publicRenderData.activeCamera.aspect = $scope.publicRenderData.canvasDimensions.width / $scope.publicRenderData.canvasDimensions.height;
    };




    // Annotations
    $scope.annotations = Annotations;
    this.annotationRenderGroup = new M3D.Group();

    this.createMarker = function () {
        var marker = {};

        marker.point = new M3D.Circle(0.35, 40);
        marker.point.setVerticesColors(new THREE.Color("#FFFFFF"), new THREE.Color("#FFFFFF"), 0.3, 0);
        marker.point.material.useVertexColors = true;
        marker.point.material.transparent = true;
        marker.point.material.side = M3D.FRONT_AND_BACK;
        marker.point.position.set(0, 0, 0);

        marker.line = new M3D.Line([]);
        marker.line.frustumCulled = false;

        return marker;
    };

    $scope.newAnnotationClick = function () {

        var intersectionNormal = new THREE.Vector3();

        return function() {
            // Set raycaster parameters
            self.raycaster.setFromCamera(InputService.cursor.position, $scope.publicRenderData.activeCamera);

            // Fetch object intersections
            var intersects = self.raycaster.intersectObjects($scope.publicRenderData.contentRenderGroup.children, true);

            // Do not continue if there aren't any intersects
            if (intersects.length > 0) {
                // Check if marker needs to be created
                if ($scope.annotations.newAnnotation.marker === undefined) {
                    $scope.annotations.newAnnotation.marker = self.createMarker();
                }

                var marker = $scope.annotations.newAnnotation.marker;

                // Calculate intersected triangle normal
                intersectionNormal = intersectionNormal.crossVectors((new THREE.Vector3()).subVectors(intersects[0].triangle[1], intersects[0].triangle[0]), (new THREE.Vector3()).subVectors(intersects[0].triangle[2], intersects[0].triangle[0])).normalize();

                // Store marker position and normal
                $scope.annotations.newAnnotation.markerMeta = { position: marker.point.position, normal: intersectionNormal.clone() };

                // Look at intersected triangle normal
                marker.point.position = new THREE.Vector3(0, 0, 0);
                marker.point.lookAt(intersectionNormal, new THREE.Vector3(0, 0, 1));
                marker.point.position = intersects[0].point.add(intersectionNormal.multiplyScalar(0.1));
            }
        }
    }();

    this.updateAnnotations = function () {

        var updateMarker = function (annItem) {

            // Calculate modal 3D position
            var modalPos = new THREE.Vector3(
                (annItem.windowPosition.offset.left / window.innerWidth) * 2 - 1,   //x
                -(annItem.windowPosition.offset.top / window.innerHeight) * 2 + 1,  //y
                0.5);

            modalPos.unproject($scope.publicRenderData.activeCamera);

            var dir = modalPos.sub($scope.publicRenderData.activeCamera.position).normalize();
            var distance = -0.2 / -Math.abs(dir.z);
            var pos = $scope.publicRenderData.activeCamera.position.clone().add(dir.multiplyScalar(distance));

            // Check if marker exists
            if (annItem.marker === undefined) {
                annItem.marker = self.createMarker();

                // Setup marker parameters
                annItem.marker.point.lookAt(annItem.markerMeta.normal, new THREE.Vector3(0, 0, 1));
                annItem.marker.point.position = annItem.markerMeta.position.clone();
            }

            // Setup line
            annItem.marker.line.setPoints([annItem.marker.point.position.x, annItem.marker.point.position.y, annItem.marker.point.position.z, pos.x, pos.y, pos.z]);

            // Add pins to draw group
            self.annotationRenderGroup.add(annItem.marker.point);
            self.annotationRenderGroup.add(annItem.marker.line);
        };

        return function() {
            self.annotationRenderGroup.clear();

            // New annotation
            if ($scope.annotations.newAnnotation && $scope.annotations.newAnnotation.marker) {
                updateMarker($scope.annotations.newAnnotation);
            }

            // Own annotations
            for (var i = 0; i < $scope.annotations.list.length; i++) {
                var annItem = $scope.annotations.list[i];

                if (annItem.active && annItem.markerMeta !== undefined) {
                    updateMarker(annItem);
                }
            }

            // Shared annotations
            for (var userId in $scope.annotations.sharedList) {
                var annList = $scope.annotations.sharedList[userId].list;

                for (var i = 0; i < annList.length; i++) {
                    if (annList[i].active && annList[i].markerMeta !== undefined) {
                        updateMarker(annList[i]);
                    }
                }
            }
        }
    }();

    // region PRIVATE
    /**
     * Creates new empty scene, camera and sets up the lightning.
     * @param width {number} current canvas width
     * @param height {number} current canvas height
     */
    this.createEmptyScene = function(width, height) {
        // Create new scene
        self.scene = new M3D.Scene();

        // Initialize lights and add them to the scene
        var aLight = new M3D.AmbientLight(new THREE.Color("#444444"), 1);
        var dLightFir = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.6);
        var dLightSec = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.6);
        var dLightThi = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.6);
        dLightFir.position = new THREE.Vector3(0, -1, 0);
        dLightSec.position = new THREE.Vector3(0.333, 0.333, -0.334);
        dLightThi.position = new THREE.Vector3(-0.333, 0.333, 0.334);

        self.scene.add(aLight);
        self.scene.add(dLightFir);
        self.scene.add(dLightSec);
        self.scene.add(dLightThi);
        self.scene.add($scope.publicRenderData.contentRenderGroup);
        self.scene.add(self.annotationRenderGroup);

        // Camera initialization
        var initCamera = new M3D.PerspectiveCamera(60, width / height, 0.1, 2000);
        initCamera.position = new THREE.Vector3(0, 0, 200);

        $scope.publicRenderData.cameras.push(initCamera);
        $scope.publicRenderData.activeCamera = initCamera


    };

    /**
     * Main animation loop. It's job is to call crucial animation functions like updating, rendering..
     */
    var prevTime = -1, currTime;
    this.animate = function() {
        self.animationRequestId = requestAnimationFrame(self.animate);

        // Calculate delta time and update timestamps
        currTime = new Date();
        var dt = (prevTime !== -1) ? currTime - prevTime : 0;
        prevTime = currTime;

        // Update camera and scene
        self.update(dt);

        // Render the scene
        self.renderer.render(self.scene,  $scope.publicRenderData.activeCamera);
    };

    /**
     * Used for updating scene, camera and other animation related parameters. This is called every animation frame.
     * @param dt {number} Delta time since last update
     */
    this.update = function(dt) {
        var transformation = InputService.update();

        // If own camera update it's position based on the input
        if ($scope.publicRenderData.cameras.indexOf($scope.publicRenderData.activeCamera) >= 0) {
            $scope.publicRenderData.activeCamera.translateX(transformation.translation.x * dt * 0.01);
            $scope.publicRenderData.activeCamera.translateY(transformation.translation.y * dt * 0.01);
            $scope.publicRenderData.activeCamera.translateZ(transformation.translation.z * dt * 0.01);

            $scope.publicRenderData.activeCamera.rotateX(transformation.rotation.x * dt * 0.001);
            $scope.publicRenderData.activeCamera.rotateY(transformation.rotation.y * dt * 0.001);
            $scope.publicRenderData.activeCamera.rotateZ(transformation.rotation.z * dt * 0.001);
        }

        // Always update world matrix
        $scope.publicRenderData.activeCamera.updateMatrixWorld();

        // Annotation render group update
        self.updateAnnotations();

        // Update scene sharing
        SharingService.update();
    };
    // endregion

    // region PUBLIC
    /**
     * Initializes and stores the renderer received from the directive.
     * @param renderer {M3D.Renderer} Mesh renderer created by the canvasDirective
     * @param width {number} canvas width
     * @param height {number} canvas height
     */
    $scope.init = function (renderer, width, height) {
        $scope.publicRenderData.canvasDimensions = {width: width, height: height};

        // Store reference to renderer
        self.renderer = renderer;
        self.renderer.clearColor = "#C8C7C7";

        self.raycaster = new M3D.Raycaster();

        // Default option is to create new empty scene
        self.createEmptyScene(width, height);
    };

    $scope.resizeCanvas = function (width, height) {
        $scope.publicRenderData.canvasDimensions = {width: width, height: height};

        // Update camera aspect ratio and renderer viewport
        if ($scope.publicRenderData.activeCamera) {
            $scope.publicRenderData.activeCamera.aspect = width / height;
        }

        // Update renderer viewport
        self.renderer.updateViewport(width, height);
    };

    // region Animation control
    $scope.startAnimation = function () {
        if (!animationRequestId) {
            self.animate();
        }
    };

    $scope.stopAnimation = function () {
        if (self.animationRequestId) {
            cancelAnimationFrame(self.animationRequestId);
            self.animationRequestId = null;
        }
    };
    // endregion
    // endregion

    TaskManagerService.addResultCallback("ObjLoader", $scope.publicRenderData.replaceRenderContent);
    TaskManagerService.addResultCallback("MHDLoader", $scope.publicRenderData.replaceRenderContent);
    // endregion
};

app.controller('RenderingController', renderingController);