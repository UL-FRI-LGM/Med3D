/**
 * Created by Primoz on 20.7.2016.
 */

let renderingController = function($scope, SettingsService, InputService, TaskManagerService, Annotations, PublicRenderData, SharingService) {
    // Context
    let self = this;

    // Required programs
    this.requiredPrograms = ['basic', 'phong', 'custom_overlayTextures', 'custom_drawOnTexture', 'custom_copyTexture', 'custom_redrawOnTexture'];

    $scope.annotations = Annotations;

    // Private renderer components
    this.renderer = null;
    this.renderQueue = null;
    this.redrawQueue = null;
    this.cameraManager = PublicRenderData.cameraManager;
    this.raycaster = null;
    this.scene = null;

    // This ID is used for stopping and starting animation loop
    this.animationRequestId = null;

    // Public rendering data (used in scene collaboration)
    PublicRenderData.contentRenderGroup = new M3D.Group();

    let offsetDir = new THREE.Vector3(0.577, 0.577, 0.577);
    /**
     * Make function to replace content on the scene publicly available in the PublicRenderData
     * @param objects
     */
    PublicRenderData.replaceRenderContent = function (...objects) {
        $scope.stopRenderLoop();
        PublicRenderData.contentRenderGroup.clear();
        self.renderer.clearCachedAttributes();
        $scope.$apply(Annotations.clear);

        // Add new render content
        for (let i = 0; i < objects.length; i++) {
            PublicRenderData.contentRenderGroup.add(objects[i]);
        }

        // Calculate content bounding sphere
        let contentSphere = PublicRenderData.contentRenderGroup.computeBoundingSphere();

        // Focus all of the cameras on the newly added object
        self.cameraManager.focusCamerasOn(contentSphere, offsetDir);

        $scope.startRenderLoop();
    };

    /**
     * Initializes and stores the renderer instance created by the canvas directive.
     * @param renderer {M3D.Renderer} Mesh renderer created by the canvasDirective
     * @param width {number} canvas width
     * @param height {number} canvas height
     */
    $scope.init = function (renderer, canvas) {
        PublicRenderData.canvasDimensions = {width: canvas.clientWidth, height: canvas.clientHeight};
        InputService.setMouseSourceObject(canvas);

        // Store reference to renderer
        self.renderer = renderer;

        // Pre-download the programs that will likely be used
        self.renderer.preDownloadPrograms(self.requiredPrograms);

        // Initialize raycaster
        self.raycaster = new M3D.Raycaster();

        // Camera initialization
        let camera = new M3D.PerspectiveCamera(60, PublicRenderData.canvasDimensions.width / PublicRenderData.canvasDimensions.height, 0.1, 2000);
        camera.position = new THREE.Vector3(0, 0, 200);

        // Add camera to public render data
        //self.cameraManager.addRegularCamera(camera);
        self.cameraManager.addOrbitCamera(camera, new THREE.Vector3(0, 0, 0));
        self.cameraManager.setActiveCamera(camera);

        self.initializeRenderQueues();
    };

    /**
     * Handle function used to propagate canvas resize event from canvas directive to the renderer so that viewport and camera
     * aspect ratio can be corrected.
     * @param width New width of the canvas.
     * @param height New height of the canvas
     */
    $scope.resizeCanvas = function (width, height) {
        PublicRenderData.canvasDimensions = {width: width, height: height};
        self.cameraManager.aspectRatio = width/height;
    };

    // region Annotations
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

        let intersectionNormal = new THREE.Vector3();

        return function() {
            // Set raycaster parameters
            self.raycaster.setFromCamera(InputService.getInputData().mouse.position, self.cameraManager.activeCamera);

            // Fetch object intersections
            let intersects = self.raycaster.intersectObjects(PublicRenderData.contentRenderGroup.children, true);

            // Do not continue if there aren't any intersects
            if (intersects.length > 0) {
                // Check if marker needs to be created
                if (Annotations.newAnnotation.marker === undefined) {
                    Annotations.newAnnotation.marker = self.createMarker();
                }

                let marker = Annotations.newAnnotation.marker;

                // Calculate intersected triangle normal
                intersectionNormal = intersectionNormal.crossVectors((new THREE.Vector3()).subVectors(intersects[0].triangle[1], intersects[0].triangle[0]), (new THREE.Vector3()).subVectors(intersects[0].triangle[2], intersects[0].triangle[0])).normalize();

                // Store marker position and normal
                Annotations.newAnnotation.markerMeta = { position: marker.point.position, normal: intersectionNormal.clone() };

                // Look at intersected triangle normal
                marker.point.position = new THREE.Vector3(0, 0, 0);
                marker.point.lookAt(intersectionNormal, new THREE.Vector3(0, 0, 1));
                marker.point.position = intersects[0].point.add(intersectionNormal.multiplyScalar(0.1));
            }
        }
    }();

    this.updateAnnotations = function () {

        let updateMarker = function (annItem) {

            let activeCamera = self.cameraManager.activeCamera;

            // Update camera matrix so we can correctly un-project the modal position
            activeCamera.updateMatrixWorld();

            // Calculate modal 3D position
            let modalPos = new THREE.Vector3(
                (annItem.windowPosition.offset.left / window.innerWidth) * 2 - 1,   //x
                -(annItem.windowPosition.offset.top / window.innerHeight) * 2 + 1,  //y
                0.5);

            modalPos.unproject(activeCamera);

            let dir = modalPos.sub(activeCamera.position).normalize();
            let distance = -0.2 / -Math.abs(dir.z);
            let pos = activeCamera.position.clone().add(dir.multiplyScalar(distance));

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
            if (Annotations.newAnnotation && Annotations.newAnnotation.marker) {
                updateMarker(Annotations.newAnnotation);
            }

            // Own annotations
            for (let i = 0; i < Annotations.list.length; i++) {
                let annItem = Annotations.list[i];

                if (annItem.active && annItem.markerMeta !== undefined) {
                    updateMarker(annItem);
                }
            }

            // Shared annotations
            for (let userId in Annotations.sharedList) {
                let annList = Annotations.sharedList[userId].list;

                for (let i = 0; i < annList.length; i++) {
                    if (annList[i].active && annList[i].markerMeta !== undefined) {
                        updateMarker(annList[i]);
                    }
                }
            }
        }
    }();

    /**
     * Animates and locks the camera in place to align with the selected drawn annotation.
     */
    $scope.$watch(function(){ return Annotations.selectedDrawnAnnotation; },
            function (selectedAnnotation) {
                let activeCamera = self.cameraManager.activeCamera;

                self.cameraManager.cancelAnimation(activeCamera, "drawnAnnotationAnimation");

                if (selectedAnnotation != null) {
                    // If the camera is already in position just lock it
                    if (self.cameraManager.isActiveCameraInPosition(selectedAnnotation._cameraPosition, selectedAnnotation._cameraRotation)) {
                        self.cameraManager.lockCamera(activeCamera);
                    }
                    else {
                        // Animate the camera in place
                        self.cameraManager.animateCameraTo(activeCamera, "drawnAnnotationAnimation",
                            selectedAnnotation._cameraPosition, selectedAnnotation._cameraRotation, 1500,
                            function () {
                                self.cameraManager.lockCamera(activeCamera);
                            })
                    }
                }
                else if (self.cameraManager.isCameraLocked(activeCamera)) {
                    // Unlock the camera if no annotation is selected
                    self.cameraManager.unlockCamera(activeCamera);
                }

            });
    // endregion

    // region RENDER QUEUE
    // region MAIN RENDER PASS
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
            self.scene.add(PublicRenderData.contentRenderGroup);
            self.scene.add(self.annotationRenderGroup);
        },

        // Preprocess function
        function (textureMap, additionalData) {

            // Update renderer viewport
            this.viewport = PublicRenderData.canvasDimensions;
            self.renderer.clearColor = "#C8C7C7FF";

            // Annotation render group update
            self.updateAnnotations();

            return {scene: self.scene, camera: self.cameraManager.activeCamera};
        },

        // Target
        M3D.RenderPass.TEXTURE,
        // Viewport
        PublicRenderData.canvasDimensions,
        // Bind depth texture to this ID
        "MainRenderDepth",
        [{id: "MainRenderTex", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );
    // endregion

    // region DRAWING RENDER PASS
    let DrawingRenderPass = new M3D.RenderPass(
        M3D.RenderPass.TEXTURE_MERGE,
        // Initialize function
        function(textureMap, additionalData) {
            additionalData['DrawingShaderMaterial'] = new M3D.CustomShaderMaterial("drawOnTexture");

            // Mouse start and end position
            additionalData['prevMouseState'] = false;
            additionalData['mousePrevTex'] = new THREE.Vector2();
            additionalData['mouseCurrTex'] = new THREE.Vector2();
            additionalData['mouseTexNorm'] = new THREE.Vector2();

            additionalData['drawnAnnCamInPosition'] = false;

            textureMap['HelperTexture'] = new M3D.Texture();
            textureMap['HelperTexture'].applyConfig(M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG);

            textureMap['OutTexture'] = null;
        },
        // Preprocess function
        function (textureMap, additionalData) {
            // Render pass self reference
            let passSelf = this;

            // Fetch the currently selected drawn annotation
            let selectedAnnotation = Annotations.selectedDrawnAnnotation;

            // Reset textures
            textureMap.OutTexture = null;
            textureMap.TargetTexture = null;

            if (selectedAnnotation != null) {
                additionalData.drawnAnnCamInPosition = self.cameraManager.isActiveCameraInPosition(selectedAnnotation._cameraPosition, selectedAnnotation._cameraRotation);

                // Do the animation
                if (!additionalData.drawnAnnCamInPosition) {
                    return null;
                }

                // If the drawing is enabled setup the textures otherwise skip this pass
                if (selectedAnnotation.drawLayer != null) {
                    textureMap.OutTexture = textureMap.HelperTexture;
                    textureMap.TargetTexture = selectedAnnotation.drawLayer.texture;
                }
                else {
                    return null;
                }
            }
            else {
                additionalData.drawnAnnCamInPosition = false;
                return null;
            }

            // Fetch the drawing CustomShaderMaterial
            let drawingShaderMaterial = additionalData['DrawingShaderMaterial'];

            // Fetch mouse input data
            let mouseInput = InputService.getInputData().mouse;

            if (mouseInput.buttons.left) {
                // Check if the left button was pressed in the previous pass
                $scope.$apply(function () {

                    if (additionalData.prevMouseState) {
                        additionalData.mousePrevTex.copy(additionalData.mouseCurrTex);
                        additionalData.mouseCurrTex.set((mouseInput.position.x + 1) / 2, (mouseInput.position.y + 1) / 2);

                        // Normalize mouse position for storage
                        additionalData.mouseTexNorm.copy(additionalData.mouseCurrTex);
                        additionalData.mouseTexNorm.x = (additionalData.mouseTexNorm.x - 0.5) / passSelf.viewport.height * passSelf.viewport.width;

                        selectedAnnotation.drawLayer.addLinePoint(additionalData.mouseTexNorm);
                    }
                    else {
                        additionalData.mouseCurrTex.set((mouseInput.position.x + 1) / 2, (mouseInput.position.y + 1) / 2);
                        additionalData.mousePrevTex.copy(additionalData.mouseCurrTex);

                        // Normalize mouse position for storage
                        additionalData.mouseTexNorm.copy(additionalData.mouseCurrTex);
                        additionalData.mouseTexNorm.x = (additionalData.mouseTexNorm.x - 0.5) / passSelf.viewport.height * passSelf.viewport.width;

                        selectedAnnotation.drawLayer.createNewLineEntry(additionalData.mouseTexNorm, PublicRenderData.lineThickness, PublicRenderData.lineHardness, PublicRenderData.lineColor);
                    }
                });
            }

            // Update prev mouse state for the next pass
            additionalData.prevMouseState = mouseInput.buttons.left;

            // Make line thickness resolution independent
            let normalisedThickness = (PublicRenderData.lineThickness / this.viewport.width);

            // Update the viewport
            this.viewport = PublicRenderData.canvasDimensions;

            self.renderer.clearColor = "#00000000";

            // Set uniforms
            drawingShaderMaterial.setUniform("draw", mouseInput.buttons.left);
            drawingShaderMaterial.setUniform("thickness", normalisedThickness);
            drawingShaderMaterial.setUniform("hardness", PublicRenderData.lineHardness);
            drawingShaderMaterial.setUniform("brushColor", PublicRenderData.lineColor.toArray());
            drawingShaderMaterial.setUniform("mouseA", additionalData.mousePrevTex.toArray());
            drawingShaderMaterial.setUniform("mouseB", additionalData.mouseCurrTex.toArray());

            return {material: drawingShaderMaterial, textures: [textureMap['TargetTexture']]};
        },
        M3D.RenderPass.TEXTURE,
        PublicRenderData.canvasDimensions,
        null,
        [{id: "OutTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );
    // endregion

    // region COPY TEXTURE PASS
    let CopyDrawingTexturePass = new M3D.RenderPass(
        M3D.RenderPass.TEXTURE_MERGE,
        // Initialize function
        function(textureMap, additionalData) {
            additionalData['CopyTextureMaterial'] = new M3D.CustomShaderMaterial("copyTexture");
        },
        // Preprocess function
        function (textureMap, additionalData) {
            // Set the viewport to match the desired resolution
            this.viewport = PublicRenderData.canvasDimensions;

            // Do not copy texture if there was nothing drawn
            if (textureMap["OutTexture"] == null) {
                return null;
            }

            return {material: additionalData['CopyTextureMaterial'] , textures: [textureMap["OutTexture"]]};
        },
        M3D.RenderPass.TEXTURE,
        PublicRenderData.canvasDimensions,
        null,
        [{id: "TargetTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );
    // endregion

    // region OVERLAY TEXTURES PASS
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

            let selectedAnnotation = Annotations.selectedDrawnAnnotation;

            // If the viewport had changed significantly redraw the lines
            let canvasDim = PublicRenderData.canvasDimensions;

            // Redraw on canvas resize
            if (Math.abs(this.viewport.width - canvasDim.width) > 10 || Math.abs(this.viewport.height - canvasDim.height) > 10) {
                let selectedAnnotation = Annotations.selectedDrawnAnnotation;
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
            if (selectedAnnotation != null && additionalData.drawnAnnCamInPosition) {
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
        PublicRenderData.canvasDimensions
    );
    // endregion
    // endregion

    // region REDRAW QUEUE
    const MAX_POINTS = 500;

    // region REDRAW RENDER PASS
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
        PublicRenderData.canvasDimensions,
        null,
        [{id: "HelperTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );
    // endregion

    // region COPY RENDER PASS
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
        PublicRenderData.canvasDimensions,
        null,
        [{id: "RedrawTexture", textureConfig: M3D.RenderPass.DEFAULT_RGBA_TEXTURE_CONFIG}]
    );
    // endregion
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

    // region RENDER LOOP
    /**
     * Starts rendering loop if it's not running already.
     */
    $scope.startRenderLoop = function () {
        if (!animationRequestId) {
            self.renderLoop();
        }

        $scope.$apply(function () {
            PublicRenderData.renderingInProgress = true;
        });
    };

    /**
     * Stops rendering loop.
     */
    $scope.stopRenderLoop = function () {
        if (self.animationRequestId) {
            cancelAnimationFrame(self.animationRequestId);
            self.animationRequestId = null;
        }

        prevTime = -1;

        $scope.$apply(function () {
            PublicRenderData.renderingInProgress = false;
        });
    };

    /**
     * Main animation loop.
     */
    let prevTime = -1, currTime;
    this.renderLoop = function() {
        self.animationRequestId = requestAnimationFrame(self.renderLoop);

        // Update input data
        let inputData = InputService.update();

        // Calculate delta time and update timestamps
        currTime = new Date();
        let deltaT = (prevTime !== -1) ? currTime - prevTime : 0;
        prevTime = currTime;

        // Update the camera
        self.cameraManager.update(inputData, deltaT);

        // Render the scene
        self.renderQueue.render();

        // Update scene collaboration
        SharingService.update();
    };
    // endregion

    TaskManagerService.addResultCallback("ObjLoader", PublicRenderData.replaceRenderContent);
    TaskManagerService.addResultCallback("MHDLoader", PublicRenderData.replaceRenderContent);
    // endregion
};

app.controller('RenderingController', renderingController);