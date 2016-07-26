/**
 * Created by Primoz on 20.7.2016.
 */

var renderingController = function($scope, SettingsService, InputService, TaskManagerService) {
    // Context
    var self = this;

    // Private renderer components
    this.renderer = null;
    this.camera = null;
    this.pLight = null;
    this.scene = null;

    this.animationRequestId = null;

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

        // Camera initialization
        self.camera = new M3D.PerspectiveCamera(60, width / height, 1, 2000);
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
            if (self.scene.children[i].type === "Group") {
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

    TaskManagerService.addResultSubscriber("ObjLoader", groupResultFun);
    TaskManagerService.addResultSubscriber("MHDLoader", groupResultFun);
    // endregion
};

app.controller('RenderingController', renderingController);