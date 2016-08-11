/**
 * Created by Primoz on 20.7.2016.
 */

var renderingController = function($scope, SettingsService, InputService, TaskManagerService, Annotations) {
    // Context
    var self = this;

    // Private renderer components
    this.renderer = null;
    this.camera = null;
    this.raycaster = null;
    this.pLight = null;
    this.scene = null;

    this.animationRequestId = null;

    // Annotations
    $scope.annotations = Annotations;
    this.annotationRenderGroup = new M3D.Group();

    this.createMarker = function () {
        var marker = {};

        marker.point = new M3D.Circle(0.35, 40);
        marker.point.setVerticesColors(new THREE.Color("#FFFFFF"), new THREE.Color("#FFFFFF"), 0.5, 0);
        marker.point.material.useVertexColors = true;
        marker.point.material.transparent = true;
        marker.point.material.side = M3D.FRONT_AND_BACK;

        marker.line = new M3D.Line([]);
        marker.line.frustumCulled = false;

        return marker;
    };


    $scope.newAnnotationClick = function () {

        var intersectionNormal = new THREE.Vector3();

        return function() {
            // Set raycaster parameters
            self.raycaster.setFromCamera(InputService.cursor.position, self.camera);

            // Fetch object intersections
            var intersects = self.raycaster.intersectObjects(self.scene.children, true);

            // Do not continue if there aren't any intersects
            if (intersects.length > 0) {
                // Check if marker needs to be created
                if ($scope.annotations.newAnnotation.marker === undefined) {
                    $scope.annotations.newAnnotation.marker = self.createMarker();
                }

                var marker = $scope.annotations.newAnnotation.marker;

                // Calculate intersected triangle normal
                intersectionNormal = intersectionNormal.crossVectors((new THREE.Vector3()).subVectors(intersects[0].triangle[1], intersects[0].triangle[0]), (new THREE.Vector3()).subVectors(intersects[0].triangle[2], intersects[0].triangle[0])).normalize();

                // Look at intersected triangle normal
                marker.point.position.set(0, 0, 0);
                marker.point.lookAt(intersectionNormal, new THREE.Vector3(0, 0, 1));

                marker.point.position = intersects[0].point.add(intersectionNormal.multiplyScalar(0.1));


            }
        }
    }();


    this.updateAnnotations = function () {

        var updateMarker = function (annItem) {

            // Calculate modal 3D position
            var modalPos = new THREE.Vector3(
                (annItem.position.offset.left / window.innerWidth) * 2 - 1,   //x
                -(annItem.position.offset.top / window.innerHeight) * 2 + 1,  //y
                0.5);

            modalPos.unproject(self.camera);

            var dir = modalPos.sub(self.camera.position).normalize();
            var distance = -0.2 / -Math.abs(dir.z);
            var pos = self.camera.position.clone().add(dir.multiplyScalar(distance));

            // Setup line
            annItem.marker.line.setPoints([annItem.marker.point.position.x, annItem.marker.point.position.y, annItem.marker.point.position.z, pos.x, pos.y, pos.z]);

            self.annotationRenderGroup.add(annItem.marker.point);
            self.annotationRenderGroup.add(annItem.marker.line);
        };

        return function() {
            self.annotationRenderGroup.clear();

            if ($scope.annotations.newAnnotation && $scope.annotations.newAnnotation.marker) {
                updateMarker($scope.annotations.newAnnotation);
            }

            for (var i = 0; i < $scope.annotations.list.length; i++) {
                var annItem = $scope.annotations.list[i];

                if (annItem.active) {
                    if (annItem.marker) {
                        updateMarker(annItem);
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
        var dLight = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.4);
        self.pLight = new M3D.PointLight(new THREE.Color("#FFFFFF"), 1);
        dLight.position = new THREE.Vector3(0, 0.5, 0.5);

        self.scene.add(aLight);
        self.scene.add(dLight);
        self.scene.add(self.pLight);
        self.scene.add(self.annotationRenderGroup)

        // Camera initialization
        self.camera = new M3D.PerspectiveCamera(70, width / height, 0.1, 2000);
        self.camera.position = new THREE.Vector3(0, 0, 50);
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
        self.renderer.render(self.scene, self.camera);
    };

    /**
     * Used for updating scene, camera and other animation related parameters. This is called every animation frame.
     * @param dt {number} Delta time since last update
     */
    this.update = function(dt) {
        var transformation = InputService.update();

        self.camera.translateX(transformation.translation.x * dt * 0.01);
        self.camera.translateY(transformation.translation.y * dt * 0.01);
        self.camera.translateZ(transformation.translation.z * dt * 0.01);

        self.camera.rotateX(transformation.rotation.x * dt * 0.001);
        self.camera.rotateY(transformation.rotation.y  * dt * 0.001);
        self.camera.rotateZ(transformation.rotation.z * dt * 0.001);

        self.camera.updateMatrixWorld();


        self.updateAnnotations();

        if (self.pLight) {
            self.pLight.position = self.camera.position;
        }
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
        // Store reference to renderer
        self.renderer = renderer;
        self.renderer.clearColor = "#C8C7C7";

        self.raycaster = new M3D.Raycaster();

        // Default option is to create new empty scene
        self.createEmptyScene(width, height);
    };

    $scope.resizeCanvas = function (width, height) {
        // Update camera aspect ratio and renderer viewport
        if (self.camera) {
            self.camera.aspect = width / height;
        }

        // Update renderer viewport
        self.renderer.updateViewport(width, height);
    };

    // region Content adding/removing
    $scope.sceneAddGroup = function(group) {
        self.scene.add(group);
    };

    $scope.sceneClearGroups = function() {
        for (var i = 0; i < self.scene.children.length; i++) {
            if (self.scene.children[i].type === "Group" && self.scene.children[i] !== self.annotationRenderGroup) {
                self.scene.remove(self.scene.children[i]);
            }
        }
    };
    // endregion

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

    // region TASK MANAGER SUBSCRIPTION
    var groupResultFun = function (group) {
        $scope.stopAnimation();
        $scope.sceneClearGroups();
        self.renderer.clearCache();

        $scope.sceneAddGroup(group);
        $scope.startAnimation();
    };

    TaskManagerService.addResultCallback("ObjLoader", groupResultFun);
    TaskManagerService.addResultCallback("MHDLoader", groupResultFun);
    // endregion
};

app.controller('RenderingController', renderingController);