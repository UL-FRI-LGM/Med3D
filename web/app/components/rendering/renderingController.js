/**
 * Created by Primoz on 20.7.2016.
 */

let renderingController = function($scope, SettingsService, InputService, TaskManagerService, Annotations, PublicRenderData, SharingService) {
    // Context
    let self = this;

    // Required programs
    this.requiredPrograms = ['phong', 'custom_overlayTextures', 'custom_drawOnTexture', 'custom_copyTexture', 'custom_redrawOnTexture'];

    // Private renderer components
    this.renderer = null;
    this.renderQueue = null;
    this.redrawQueue = null;
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

        // Pre-download the programs that will likely be used
        self.renderer.preDownloadPrograms(self.requiredPrograms);

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


    // region RENDER QUEUE RENDER PASSES
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

            textureMap['OutTexture'] = null;
        },
        // Preprocess function
        function (textureMap, additionalData) {
            let passSelf = this;

            let selectedAnnotation = $scope.annotations.selectedDrawnAnnotation;

            // Check if there is a layer selected and the camera is in position
            if (selectedAnnotation == null || selectedAnnotation.drawLayer == null || !additionalData['cameraInPositionDA']) {
                textureMap['OutTexture'] = null;
                textureMap['TargetTexture'] = null;
                // Skip this render pass
                return null;
            }
            else {
                textureMap['OutTexture'] = textureMap['HelperTexture'];
                textureMap['TargetTexture'] = selectedAnnotation.drawLayer.texture;
            }

            let drawingShaderMaterial = additionalData['DrawingShaderMaterial'];
            let draw = true;

            let mouseA = additionalData['mouseA'];
            let mouseB = additionalData['mouseB'];

            let normalisedThickness = ($scope.publicRenderData.lineThickness / this.viewport.width);

            let mouseTexPos = additionalData['mouseTexPos'];
            mouseTexPos.set((InputService.cursor.position.x + 1) / 2, (InputService.cursor.position.y + 1) / 2);

            // Check if this is first iteration after mouse press
            $scope.$apply(function () {
                if (InputService.cursor.down) {
                    if (!additionalData['prevMouseState']) {
                        mouseA.copy(mouseTexPos);
                        mouseB.copy(mouseTexPos);

                        // Convert to aspect ratio 1:1
                        mouseTexPos.x = (mouseTexPos.x - 0.5) / passSelf.viewport.height * passSelf.viewport.width;
                        selectedAnnotation.drawLayer.createNewLineEntry(mouseTexPos, $scope.publicRenderData.lineThickness, $scope.publicRenderData.lineHardness, $scope.publicRenderData.lineColor);
                    }
                    else {
                        mouseA.copy(mouseB);
                        mouseB.copy(mouseTexPos);

                        // Convert to aspect ratio 1:1
                        mouseTexPos.x = (mouseTexPos.x - 0.5) / passSelf.viewport.height * passSelf.viewport.width;
                        selectedAnnotation.drawLayer.addLinePoint(mouseTexPos);
                    }
                }
                else {
                    draw = false;
                }
            });

            // Store mouse state
            additionalData['prevMouseState'] = InputService.cursor.down;

            // Update the viewport
            this.viewport = $scope.publicRenderData.canvasDimensions;

            self.renderer.clearColor = "#00000000";

            // Set uniforms
            drawingShaderMaterial.setUniform("draw", draw);
            drawingShaderMaterial.setUniform("thickness", normalisedThickness);
            drawingShaderMaterial.setUniform("hardness", $scope.publicRenderData.lineHardness);
            drawingShaderMaterial.setUniform("brushColor", $scope.publicRenderData.lineColor.toArray());
            drawingShaderMaterial.setUniform("mouseA", mouseA.toArray());
            drawingShaderMaterial.setUniform("mouseB", mouseB.toArray());

            return {material: drawingShaderMaterial, textures: [textureMap['TargetTexture']]};
        },
        M3D.RenderPass.TEXTURE,
        $scope.publicRenderData.canvasDimensions,
        null,
        [{id: "OutTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );

    let CopyDrawingTexturePass = new M3D.RenderPass(
        M3D.RenderPass.TEXTURE_MERGE,
        // Initialize function
        function(textureMap, additionalData) {
            additionalData['CopyTextureMaterial'] = new M3D.CustomShaderMaterial("copyTexture");
        },
        // Preprocess function
        function (textureMap, additionalData) {
            // Set the viewport to match the desired resolution
            this.viewport = $scope.publicRenderData.canvasDimensions;

            // Do not copy texture if there was nothing drawn
            if (textureMap["OutTexture"] == null) {
                return null;
            }

            return {material: additionalData['CopyTextureMaterial'] , textures: [textureMap["OutTexture"]]};
        },
        M3D.RenderPass.TEXTURE,
        $scope.publicRenderData.canvasDimensions,
        null,
        [{id: "TargetTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
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

            let selectedAnnotation = $scope.annotations.selectedDrawnAnnotation;

            // If the viewport had changed significantly redraw the lines
            let canvasDim = $scope.publicRenderData.canvasDimensions;

            // Redraw on canvas resize
            if (Math.abs(this.viewport.width - canvasDim.width) > 10 || Math.abs(this.viewport.height - canvasDim.height) > 10) {
                let selectedAnnotation = $scope.annotations.selectedDrawnAnnotation;
                this.viewport = canvasDim;

                if (selectedAnnotation != null) {
                    for (let i = 0; i < selectedAnnotation.layers.length; i++) {
                        let layer = selectedAnnotation.layers[i];

                        if (layer.lines.length <= 0) {
                            continue;
                        }

                        self.redrawQueue.addTexture("RedrawTexture", layer.texture);
                        self.redrawQueue.setDataValue("lines", layer.lines);
                        self.redrawQueue.setDataValue("viewport", canvasDim);

                        // Redraw all of the lines
                        let data;
                        do {
                            data = self.redrawQueue.render();
                        } while (!data.additionalData["finished"]);

                        layer.dirty = false;
                    }

                    textureMap['OutTexture'] = null;
                    textureMap['TargetTexture'] = null;
                }
            }

            // Redraw dirty layers
            if (selectedAnnotation != null) {
                for (let i = 0; i < selectedAnnotation.layers.length; i++) {
                    let layer = selectedAnnotation.layers[i];

                    if (!layer.dirty) {
                        continue;
                    }

                    self.redrawQueue.addTexture("RedrawTexture", layer.texture);
                    self.redrawQueue.setDataValue("lines", layer.lines);
                    self.redrawQueue.setDataValue("viewport", canvasDim);

                    // Redraw all of the lines
                    let data;
                    do {
                        data = self.redrawQueue.render();
                    } while (!data.additionalData["finished"]);

                    layer.dirty = false;
                }
            }

            let textures = [textureMap["MainRenderTex"]];

            // Add draw layers if the camera is in position
            if (selectedAnnotation != null && additionalData['cameraInPositionDA']) {
                for (let i = selectedAnnotation.layers.length - 1; i >= 0; i--) {
                    let layer = selectedAnnotation.layers[i];

                    if (layer.isDisplayed && layer.lines.length > 0) {
                        textures.push(layer.texture);
                    }
                }
            }

            return {material: additionalData['OverlayTextureMaterial'], textures: textures};
        },
        M3D.RenderPass.SCREEN,
        $scope.publicRenderData.canvasDimensions
    );
    // endregion

    // region REDRAW QUEUE
    const MAX_POINTS = 500;

    let RedrawRenderPass = new M3D.RenderPass(
        M3D.RenderPass.TEXTURE_MERGE,
        // Initialize function
        function(textureMap, additionalData) {
            additionalData['RedrawingShaderMaterial'] = new M3D.CustomShaderMaterial("redrawOnTexture");

            textureMap['HelperTexture'] = new M3D.Texture();
            textureMap['HelperTexture'].applyConfig(M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG);

            additionalData['indices'] = {line: 0, points: 0}
        },
        // Preprocess function
        function (textureMap, additionalData) {
            // Reset finished flag
            additionalData['finished'] = false;

            // Set the viewport to match the desired resolution
            this.viewport = additionalData['viewport'];

            // Set clear color to transparent
            self.renderer.clearColor = "#00000000";

            // Fetch line colors
            let lines = additionalData['lines'];
            let indices = additionalData['indices'];

            // Current line
            let currentLine = lines[indices.line];

            let normalisedThickness = 0,
                hardness = 0,
                color = [0, 0, 0],
                firstRender = indices.line === 0 && indices.points === 0,
                selectedPoints = [0, 0],
                numPoints = 0;


            if (currentLine != null) {
                // Calculate normalised thicknes
                normalisedThickness = (currentLine.thickness / this.viewport.width);
                hardness = lines[indices.line].hardness;
                color = lines[indices.line].color;

                // Points
                let upperBoundary = Math.min(indices.points + MAX_POINTS * 2, currentLine.points.length);
                selectedPoints = currentLine.points.slice(indices.points, upperBoundary);
                numPoints = selectedPoints.length / 2; // Each point is represented by two values

                // Check if line is fully drawn
                if (upperBoundary === currentLine.points.length) {
                    indices.points = 0;
                    indices.line++;

                    // If we have drawn all of the lines set the finished flag.
                    if (indices.line >= lines.length) {
                        additionalData['finished'] = true;

                        // Reset values for the next redraw
                        indices.points = 0;
                        indices.line = 0;
                    }
                }
                else {
                    // Move starting point forward
                    indices.points = upperBoundary - 2;
                }
            }
            else {
                additionalData['finished'] = true;
            }

            let redrawingShaderMaterial = additionalData['RedrawingShaderMaterial'];

            // Set uniforms
            redrawingShaderMaterial.setUniform("thickness", normalisedThickness);
            redrawingShaderMaterial.setUniform("hardness", hardness);
            redrawingShaderMaterial.setUniform("linePoints[0]", selectedPoints);
            redrawingShaderMaterial.setUniform("numPoints", numPoints);
            redrawingShaderMaterial.setUniform("brushColor", color);
            redrawingShaderMaterial.setUniform("canvasWidth", this.viewport.width);
            redrawingShaderMaterial.setUniform("canvasHeight", this.viewport.height);

            let textures = [];

            // If this is not a first render input the previous texture to use it as a base
            if (!firstRender) {
                textures.push(textureMap['RedrawTexture'])
            }

            return {material: redrawingShaderMaterial, textures: textures};
        },
        M3D.RenderPass.TEXTURE,
        $scope.publicRenderData.canvasDimensions,
        null,
        [{id: "HelperTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );

    let RedrawCopyTexturePass = new M3D.RenderPass(
        M3D.RenderPass.TEXTURE_MERGE,
        // Initialize function
        function(textureMap, additionalData) {
            additionalData['CopyTextureMaterial'] = new M3D.CustomShaderMaterial("copyTexture");
        },
        // Preprocess function
        function (textureMap, additionalData) {
            // Set the viewport to match the desired resolution
            this.viewport = additionalData['viewport'];

            return {material: additionalData['CopyTextureMaterial'] , textures: [textureMap["HelperTexture"]]};
        },
        M3D.RenderPass.TEXTURE,
        $scope.publicRenderData.canvasDimensions,
        null,
        [{id: "RedrawTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );

    // endregion

    this.initializeRenderQueues = function () {
        self.renderQueue = new M3D.RenderQueue(self.renderer);
        self.redrawQueue = new M3D.RenderQueue(self.renderer);

        self.renderQueue.pushRenderPass(MainRenderPass);
        self.renderQueue.pushRenderPass(DrawingRenderPass);
        self.renderQueue.pushRenderPass(CopyDrawingTexturePass);
        self.renderQueue.pushRenderPass(OverlayRenderPass);

        self.redrawQueue.pushRenderPass(RedrawRenderPass);
        self.redrawQueue.pushRenderPass(RedrawCopyTexturePass);
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