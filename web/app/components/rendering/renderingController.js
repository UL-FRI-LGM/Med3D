/**
 * Created by Primoz on 20.7.2016.
 */

let renderingController = function($scope, SettingsService, InputService, TaskManagerService, Annotations, PublicRenderData, SharingService) {
    // Context
    let self = this;

    // Private renderer components
    this.renderer = null;
    this.renderQueue = null;
    this.raycaster = null;
    this.scene = null;

    // This ID is used for stopping and starting animation loop
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


    /**
     * Initializes and stores the renderer instance created by the canvas directive.
     * @param renderer {M3D.Renderer} Mesh renderer created by the canvasDirective
     * @param width {number} canvas width
     * @param height {number} canvas height
     */
    $scope.init = function (renderer, canvas) {
        $scope.publicRenderData.canvasDimensions = {width: canvas.clientWidth, height: canvas.clientHeight};
        InputService.initializeCanvasMouseTracking(canvas);

        // Store reference to renderer
        self.renderer = renderer;

        self.raycaster = new M3D.Raycaster();

        self.initializeRenderQueues();
    };

    /**
     * Handle function used to propagate canvas resize event from canvas directive to the renderer so that viewport and camera
     * aspect ratio can be corrected.
     * @param width New width of the canvas.
     * @param height New height of the canvas
     */
    $scope.resizeCanvas = function (width, height) {
        $scope.publicRenderData.canvasDimensions = {width: width, height: height};
    };

    /**
     * Starts rendering loop if it's not running already.
     */
    $scope.startAnimation = function () {
        if (!animationRequestId) {
            self.animate();
        }

        $scope.$apply(function () {
            $scope.publicRenderData.renderingInProgress = true;
        });
    };

    /**
     * Stops rendering loop.
     */
    $scope.stopAnimation = function () {
        if (self.animationRequestId) {
            cancelAnimationFrame(self.animationRequestId);
            self.animationRequestId = null;
        }

        $scope.$apply(function () {
            $scope.publicRenderData.renderingInProgress = false;
        });
    };


    // region Annotations
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


    // endregion


    // region RENDER PASSES
    let prevTime = -1, currTime;
    let MainRenderPass = new M3D.RenderPass(
        // Rendering pass type
        M3D.RenderPass.BASIC,

        // Initialize function
        function(textureMap, additionalData) {
            // Create new scene
            self.scene = new M3D.Scene();

            // Initialize lights and add them to the scene
            let aLight = new M3D.AmbientLight(new THREE.Color("#444444"), 1);
            let dLightFirst = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.6);
            let dLightSecond = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.6);
            let dLightThird = new M3D.DirectionalLight(new THREE.Color("#FFFFFF"), 0.6);
            dLightFirst.position = new THREE.Vector3(0, -1, 0);
            dLightSecond.position = new THREE.Vector3(0.333, 0.333, -0.334);
            dLightThird.position = new THREE.Vector3(-0.333, 0.333, 0.334);

            self.scene.add(aLight);
            self.scene.add(dLightFirst);
            self.scene.add(dLightSecond);
            self.scene.add(dLightThird);
            self.scene.add($scope.publicRenderData.contentRenderGroup);
            self.scene.add(self.annotationRenderGroup);

            // Camera initialization
            let camera = new M3D.PerspectiveCamera(60, $scope.publicRenderData.canvasDimensions.width / $scope.publicRenderData.canvasDimensions.height, 0.1, 2000);
            camera.position = new THREE.Vector3(0, 0, 200);

            // Add camera to public render data
            $scope.publicRenderData.cameras.push(camera);
            $scope.publicRenderData.activeCamera = camera;


            // HELPER VARIABLES
            this.__axisDiffVec = new THREE.Vector3();
            this.__rotDiffVec = new THREE.Vector3();
        },

        // Preprocess function
        function (textureMap, additionalData) {
            // Update camera aspect ratio and renderer viewport
            $scope.publicRenderData.activeCamera.aspect = $scope.publicRenderData.canvasDimensions.width/ $scope.publicRenderData.canvasDimensions.height;

            // Update renderer viewport
            this.viewport = $scope.publicRenderData.canvasDimensions;
            self.renderer.clearColor = "#C8C7C7FF";

            // Calculate delta time and update timestamps
            currTime = new Date();
            let dt = (prevTime !== -1) ? currTime - prevTime : 0;
            prevTime = currTime;

            // Pass delta time to following render passes
            additionalData['dt'] = dt;

            // UPDATE CAMERA AND SCENE DATA
            let transformation = InputService.update();

            // Only update camera if no annotation is selected
            if ($scope.annotations.selectedDrawnAnnotation === undefined) {
                // If own camera and update it's position based on the input
                if ($scope.publicRenderData.cameras.indexOf($scope.publicRenderData.activeCamera) >= 0) {
                    $scope.publicRenderData.activeCamera.translateX(transformation.translation.x * dt * 0.01);
                    $scope.publicRenderData.activeCamera.translateY(transformation.translation.y * dt * 0.01);
                    $scope.publicRenderData.activeCamera.translateZ(transformation.translation.z * dt * 0.01);

                    $scope.publicRenderData.activeCamera.rotateX(transformation.rotation.x * dt * 0.001);
                    $scope.publicRenderData.activeCamera.rotateY(transformation.rotation.y * dt * 0.001);
                    $scope.publicRenderData.activeCamera.rotateZ(transformation.rotation.z * dt * 0.001);
                }
            }
            else {
                // If the annotation is selected. Animate translate/rotate camera to match the annotation position

                this.__axisDiffVec.subVectors($scope.annotations.selectedDrawnAnnotation.cameraPosition, $scope.publicRenderData.activeCamera.position);
                this.__rotDiffVec.subVectors($scope.annotations.selectedDrawnAnnotation.cameraRotation, $scope.publicRenderData.activeCamera.rotation.toVector3());



                if (this.__axisDiffVec.length() !== 0 || this.__rotDiffVec.length() !== 0) {
                    // Translate the camera to match the annotation position
                    if (this.__axisDiffVec.length() < 0.02) {
                        $scope.publicRenderData.activeCamera.positionX += this.__axisDiffVec.x;
                        $scope.publicRenderData.activeCamera.positionY += this.__axisDiffVec.y;
                        $scope.publicRenderData.activeCamera.positionZ += this.__axisDiffVec.z;
                    }
                    else {
                        this.__axisDiffVec.multiplyScalar(dt * 0.002);

                        if (this.__axisDiffVec.length() < 0.02) {
                            this.__axisDiffVec.multiplyScalar(0.02 / this.__axisDiffVec.length());
                        }

                        $scope.publicRenderData.activeCamera.positionX += this.__axisDiffVec.x;
                        $scope.publicRenderData.activeCamera.positionY += this.__axisDiffVec.y;
                        $scope.publicRenderData.activeCamera.positionZ += this.__axisDiffVec.z;
                    }

                    // Rotate the camera to match the annotation rotation
                    if (this.__rotDiffVec.length() < 0.001) {
                        $scope.publicRenderData.activeCamera.rotationX += this.__rotDiffVec.x;
                        $scope.publicRenderData.activeCamera.rotationY += this.__rotDiffVec.y;
                        $scope.publicRenderData.activeCamera.rotationZ += this.__rotDiffVec.z;
                    }
                    else {
                        this.__rotDiffVec.multiplyScalar(dt * 0.003);

                        if (this.__rotDiffVec.length() < 0.001) {
                            this.__rotDiffVec.multiplyScalar(0.001 / this.__rotDiffVec.length());
                        }

                        $scope.publicRenderData.activeCamera.rotationX += this.__rotDiffVec.x;
                        $scope.publicRenderData.activeCamera.rotationY += this.__rotDiffVec.y;
                        $scope.publicRenderData.activeCamera.rotationZ += this.__rotDiffVec.z;
                    }

                    additionalData['cameraInPositionDA'] = false;
                }
                else {
                    additionalData['cameraInPositionDA'] = true;
                }
            }

            // Always update world matrix
            $scope.publicRenderData.activeCamera.updateMatrixWorld();

            // Annotation render group update
            self.updateAnnotations();

            return {scene: self.scene, camera: $scope.publicRenderData.activeCamera};
        },

        // Target
        M3D.RenderPass.TEXTURE,
        // Viewport
        $scope.publicRenderData.canvasDimensions,
        // Bind depth texture to this ID
        "MainRenderDepth",
        [{id: "MainRenderTex", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );


    let DrawingRenderPass = new M3D.RenderPass(
        M3D.RenderPass.TEXTURE_MERGE,
        // Initialize function
        function(textureMap, additionalData) {
            additionalData['DrawingShaderMaterial'] = new M3D.CustomShaderMaterial("drawOnTexture");

            // Mouse start and end position
            additionalData['mouseA'] = new THREE.Vector2(Infinity, Infinity);
            additionalData['mouseB'] = new THREE.Vector2(Infinity, Infinity);
            additionalData['prevMouseState'] = false;
            additionalData['mouseTexPos'] = new THREE.Vector2();

            textureMap['HelperTexture'] = new M3D.Texture();
            textureMap['HelperTexture'].applyConfig(M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG);

            textureMap['DrawingTextureA'] = null;
            textureMap['DrawingTextureB'] = null;
        },
        // Preprocess function
        function (textureMap, additionalData) {

            if ($scope.annotations.selectedDrawnAnnotation === undefined || !additionalData['cameraInPositionDA']) {
                textureMap['DrawingTextureA'] = null;
                textureMap['DrawingTextureB'] = null;
                return null;
            }
            else if (textureMap['DrawingTextureA'] == null) {
                textureMap['DrawingTextureA'] = $scope.annotations.selectedDrawnAnnotation.texture;
                textureMap['DrawingTextureB'] = textureMap['HelperTexture'];
            }

            let mouseTexPos = additionalData['mouseTexPos'];
            mouseTexPos.set((InputService.cursor.position.x + 1) / 2, (InputService.cursor.position.y + 1) / 2);

            this.viewport = $scope.publicRenderData.canvasDimensions;
            self.renderer.clearColor = "#00000000";

            let drawingShaderMaterial = additionalData['DrawingShaderMaterial'];
            let draw = InputService.cursor.down;

            let mouseA = additionalData['mouseA'];
            let mouseB = additionalData['mouseB'];

            let normalisedThickness = ($scope.publicRenderData.lineThickness / this.viewport.width);

            // Check if this is first iteration after mouse press
            if (!additionalData['prevMouseState'] && InputService.cursor.down) {
                mouseA.copy(mouseTexPos);
                mouseB.copy(mouseTexPos);
            }
            else if (InputService.cursor.down && mouseA.distanceTo(mouseTexPos) > normalisedThickness) {
                mouseA.copy(mouseB);
                mouseB.copy(mouseTexPos);
            }
            else {
                draw = false;
            }

            // Set uniforms
            drawingShaderMaterial.setUniform("draw", draw);
            drawingShaderMaterial.setUniform("thickness", normalisedThickness);
            drawingShaderMaterial.setUniform("hardness", $scope.publicRenderData.lineHardness);
            drawingShaderMaterial.setUniform("brushColor", $scope.publicRenderData.lineColor.toArray());
            drawingShaderMaterial.setUniform("mouseA", mouseA.toArray());
            drawingShaderMaterial.setUniform("mouseB", mouseB.toArray());


            // Store mouse state
            additionalData['prevMouseState'] = InputService.cursor.down;


            let temp = textureMap['DrawingTextureA'];
            textureMap['DrawingTextureA'] = textureMap['DrawingTextureB'];
            textureMap['DrawingTextureB'] = temp;

            return {material: drawingShaderMaterial, textures: [textureMap['DrawingTextureB']]};
        },
        M3D.RenderPass.TEXTURE,
        $scope.publicRenderData.canvasDimensions,
        null,
        [{id: "DrawingTextureA", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );


    let OverlayRenderPass = new M3D.RenderPass(
        M3D.RenderPass.TEXTURE_MERGE,
        // Initialize function
        function(textureMap, additionalData) {
            /**
             * TEXTURE BLENDING glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
             */
            additionalData['OverlayTextureMaterial'] = new M3D.CustomShaderMaterial("overlayTextures");
        },
        // Preprocess function
        function (textureMap, additionalData) {
            // Update renderer viewport
            this.viewport = $scope.publicRenderData.canvasDimensions;

            let textures = [textureMap["MainRenderTex"]];

            if (textureMap["DrawingTextureA"] !== null) {
                textures.push(textureMap["DrawingTextureA"]);
            }

            return {material: additionalData['OverlayTextureMaterial'], textures: textures};
        },
        M3D.RenderPass.SCREEN,
        $scope.publicRenderData.canvasDimensions
    );
    // endregion


    this.initializeRenderQueues = function () {
        self.renderQueue = new M3D.RenderQueue(self.renderer);
        self.renderQueue.pushRenderPass(MainRenderPass);
        self.renderQueue.pushRenderPass(DrawingRenderPass);
        self.renderQueue.pushRenderPass(OverlayRenderPass);
    };


    /**
     * Main animation loop.
     */
    this.animate = function() {
        self.animationRequestId = requestAnimationFrame(self.animate);

        // Render the scene
        self.renderQueue.render();

        // Update scene sharing
        SharingService.update();
    };

    TaskManagerService.addResultCallback("ObjLoader", $scope.publicRenderData.replaceRenderContent);
    TaskManagerService.addResultCallback("MHDLoader", $scope.publicRenderData.replaceRenderContent);
    // endregion
};

app.controller('RenderingController', renderingController);