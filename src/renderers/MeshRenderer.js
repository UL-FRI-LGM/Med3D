/**
 * Created by Primoz on 28.4.2016.
 */

M3D.MeshRenderer = class {

    constructor(canvas, gl_version) {
        // Create new gl manager with appropriate version
        this._glManager = new M3D.GLManager(canvas, gl_version);
        this._canvas = canvas;

        // Retrieve context from gl manager
        this._gl = this._glManager.context;

        // Throw error if the gl context could not be retrieved
        if (!this._gl) {
            throw 'Something went wrong while initializing WebGL context.'
        }


        // Current program
        this._shaderLoader = new M3D.ShaderLoader();
        this._glProgramManager = new M3D.GLProgramManager(this._gl);


        this._rttFamebuffer = null;

        //region Current frame render arrays
        this._requiredPrograms = new Set();
        this._compiledPrograms = new Map();
        this._loadingPrograms = new Set();
        this._opaqueObjects = [];
        this._transparentObjects = [];
        this._lights = [];
        this._lightsCombined = {
            ambient: [0, 0, 0],
            directional: [],
            point: []
        };
        this._currentRenderTarget = null;
        // endregion

        //region Execution values
        this._autoClear = true;
        //endregion

        // Enable depth testing (disable depth testing with gl.ALWAYS)
        this._gl.enable(this._gl.DEPTH_TEST);

        // Enable back-face culling by default
        this._gl.frontFace(this._gl.CCW);
    }


    render(scene, camera, renderTarget) {

        // Check if correct object instance was passed as camera
        if (camera instanceof M3D.Camera === false) {
            console.error(LOGTAG + "Given camera is not an instance of M3D.Camera");
            return;
        }

        this._setupRenderTarget(renderTarget);

        // Update scene graph and camera matrices
        if (scene.autoUpdate === true)
            scene.updateMatrixWorld();

        // If camera is not part of the scene.. Update its worldMatrix anyways
        if (camera.parent === null)
            camera.updateMatrixWorld();

        camera.matrixWorldInverse.getInverse(camera.matrixWorld);

        // Clear the render arrays
        this._opaqueObjects.length = 0;
        this._transparentObjects.length = 0;
        this._lights.length = 0;
        this._requiredPrograms.clear();
        this._compiledPrograms.clear();

        // Update objects attributes and setup lights
        this._projectObject(scene, camera);

        if (!this._loadPrograms()) {
            return;
        }

        this._setupLights(this._lights, camera);

        // Clear color, depth and stencil buffer
        if (this._glManager.autoClear) {
            this._glManager.clear(true, true, true);
        }

        // Render opaque objects
        this._renderObjects(this._opaqueObjects, camera);

        if (this._currentRenderTarget) {
            this._gl.bindTexture(this._gl.TEXTURE_2D, this._glManager.getUniform(this._currentRenderTarget._texture));
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
            this._gl.bindTexture(this._gl.TEXTURE_2D, null);
        }
    }

    _loadPrograms() {
        // Fetch compiled programs
        var requiredPrograms = Array.from(this._requiredPrograms);

        var scope = this;
        var everythingLoaded = true;
        var glVersion = this._glManager.glVersion;

        for (var i = 0; i < requiredPrograms.length; i++) {
            const fullName = glVersion + "_" + requiredPrograms[i];

            // Check if the program is already compiled
            var compiledProgram = this._glProgramManager.fetchCompiledProgram(fullName);

            if (compiledProgram === undefined) {
                everythingLoaded = false;

                // Called when the program template is loaded.. Initiates shader compilation
                var onLoad = function (programTemplate) {
                    scope._glProgramManager.compileProgram(programTemplate);
                    scope._loadingPrograms.delete(fullName);
                };

                // Something went wrong while fetching the program templates
                var onError = function (event) {
                    console.error("Failed to load program " + fullName + ".")
                    scope._loadingPrograms.delete(fullName);
                };

                if (!this._loadingPrograms.has(fullName)) {
                    this._loadingPrograms.has(fullName);
                    this._loadingPrograms.add(fullName);

                    // Initiate loading
                    this._shaderLoader.loadProgramSources(fullName, onLoad, undefined, onError);
                }
            }
            else {
                this._compiledPrograms.set(requiredPrograms[i], compiledProgram);
            }
        }

        return everythingLoaded;
    }

    _renderObjects(objects, camera) {

        for (var i = 0; i < objects.length; i++) {

            var program = this._compiledPrograms.get(objects[i].material.program);
            program.use();

            this._setup_uniforms(program, objects[i], camera);

            var vertices = objects[i].geometry.vertices;
            this._setup_attributes(program, objects[i], vertices);

            this._setup_material_settings(objects[i].material);

            // Draw wireframe instead of the planes
            if (objects[i].geometry.drawWireframe) {
                var buffer = this._glManager.getBuffer(objects[i].geometry.wireframeIndices);
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, buffer);
                this._gl.drawElements(this._gl.LINES, objects[i].geometry.wireframeIndices.count(), this._gl.UNSIGNED_INT, 0)
            }
            else if (objects[i].geometry.indices) {
                var buffer = this._glManager.getBuffer(objects[i].geometry.indices);
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, buffer);
                this._gl.drawElements(this._gl.TRIANGLES, objects[i].geometry.indices.count(), this._gl.UNSIGNED_INT, 0)
            }
            else {
                this._gl.drawArrays(this._gl.TRIANGLES, 0, vertices.count());
            }
        }
    }

    _setup_attributes(program, object, vertices) {
        var attributeSetter = program.attributeSetter;

        var noError = true;

        var attributes = Object.getOwnPropertyNames(attributeSetter);

        var buffer;
        // Set all of the properties
        for (var i = 0; i < attributes.length; i++) {
            switch (attributes[i]) {
                case "VPos":
                    buffer = this._glManager.getBuffer(vertices);
                    attributeSetter["VPos"].set(buffer, 3);
                    break;
                case "VNorm":
                    var normals = object.geometry.normals;
                    buffer = this._glManager.getBuffer(normals);
                    attributeSetter["VNorm"].set(buffer, 3);
                    break;
                case "uv":
                    var uv = object.geometry.uv;
                    buffer = this._glManager.getBuffer(uv);
                    attributeSetter["uv"].set(buffer, 2);
                    break;
                default:
                    console.error("Unknown Attribute!");
                    noError = false;
                    break;
            }
        }
    }

    _setup_uniforms(program, object, camera) {
        var uniformSetter = program.uniformSetter;

        if (uniformSetter["PMat"] !== undefined) {
            uniformSetter["PMat"].set(camera.projectionMatrix.elements);
        }

        if (uniformSetter["MVMat"] !== undefined) {
            uniformSetter["MVMat"].set(object.modelViewMatrix.elements);
        }

        if (uniformSetter["NMat"] !== undefined) {
            uniformSetter["NMat"].set(object.normalMatrix.elements);
        }

        this._setup_light_uniforms(uniformSetter);

        this._setup_material_uniforms(object.material, uniformSetter);
    }

    _setup_material_uniforms(material, uniformSetter) {

        var textureIdx = 0;

        const prefix = "material";
        if (material instanceof M3D.MeshPhongMaterial) {
            const diffuse = prefix + ".diffuse";
            if (uniformSetter[diffuse] !== undefined) {
                uniformSetter[diffuse].set(material.color.toArray());
            }

            const specular = prefix + ".specular";
            if (uniformSetter[specular] !== undefined) {
                uniformSetter[specular].set(material.specular.toArray());
            }

            const shininess = prefix + ".shininess";
            if (uniformSetter[shininess] !== undefined) {
                uniformSetter[shininess].set(material.shininess);
            }

            const texture = prefix + ".texture";
            if (uniformSetter[texture] !== undefined) {
                uniformSetter[texture].set(this._glManager.getUniform(material.map), textureIdx++);
            }
        }
    }

    _setup_material_settings(material) {

        // Determine the type of face culling
        if (material.side === M3D.FRONT_AND_BACK_SIDE) {
            this._gl.disable(this._gl.CULL_FACE);
        }
        else if (material.side === M3D.FRONT_SIDE) {
            this._gl.enable(this._gl.CULL_FACE);
            this._gl.cullFace(this._gl.BACK);
        }
        else if (material.side === M3D.BACK_SIDE) {
            this._gl.enable(this._gl.CULL_FACE);
            this._gl.cullFace(this._gl.FRONT);
        }

        // If depth testing is not enabled set depth function to always pass
        if (material.depthTest) {
            switch (material.depthFunc) {
                case M3D.FUNC_LEQUAL:
                    this._gl.depthFunc(this._gl.LEQUAL);
                    break;
                case M3D.FUNC_LESS:
                    this._gl.depthFunc(this._gl.LESS);
                    break;
                case M3D.FUNC_GEQUAL:
                    this._gl.depthFunc(this._gl.GEQUAL);
                    break;
                case M3D.FUNC_GREATER:
                    this._gl.depthFunc(this._gl.GREATER);
                    break;
                case M3D.FUNC_EQUAL:
                    this._gl.depthFunc(this._gl.EQUAL);
                    break;
                case M3D.FUNC_NOTEQUAL:
                    this._gl.depthFunc(this._gl.NOTEQUAL);
                    break;
            }
        }
        else if (material.depthTest) {
            this._gl.depthFunc(this._gl.ALWAYS);
        }

        // Enable/Disable depth writing
        this._gl.depthMask(material.depthWrite);
    }

    _setup_light_uniforms(uniformSetter) {

        if (uniformSetter["ambient"] !== undefined) {
            uniformSetter["ambient"].set(this._lightsCombined.ambient);
        }

        const MAX_LIGHTS = 8;
        var index = 0, prefix, light;

        // DIRECTIONAL LIGHTS
        for (var i = 0; i < this._lightsCombined.directional.length; i++) {
            prefix = "lights[" + index + "]";
            light = this._lightsCombined.directional[i];

            uniformSetter[prefix + ".position"].set(light.direction.toArray());
            uniformSetter[prefix + ".color"].set(light.color.toArray());
            uniformSetter[prefix + ".directional"].set(1);

            index++;
        }

        // POINT LIGHTS
        for (var i = 0; i < this._lightsCombined.point.length; i++) {
            prefix = "lights[" + index + "]";
            light = this._lightsCombined.point[i];

            uniformSetter[prefix + ".position"].set(light.position.toArray());
            uniformSetter[prefix + ".color"].set(light.color.toArray());
            uniformSetter[prefix + ".directional"].set(0);

            index++;
        }

        // REMAINING
        for (var i = index; i < MAX_LIGHTS; i++) {
            prefix = "lights[" + i + "]";
            uniformSetter[prefix + ".color"].set([0, 0, 0]);
        }
    }

    _projectObject(object, camera) {

        // If object is not visible do not bother projecting it
        if (object.visible === false)
            return;

        // If the object is light push it to light cache array
        if (object instanceof M3D.Light) {
            this._lights.push(object);
        }
        // If the object is mesh and it's visible. Update it's attributes.
        else if (object instanceof M3D.Mesh) {
            // Adds required program to set
            this._requiredPrograms.add(object.material.program);

            if (object.material.visible === true) {
                // Updates or derives attributes from the WebGL geometry
                this._glManager.updateObjectData(object, this._currentRenderTarget);

                // Derive mv and normal matrices
                object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
                object.normalMatrix.getNormalMatrix(object.modelViewMatrix);

                // Add object to correct render array
                if (object.material.transparent) {
                    this._transparentObjects.push(object);
                }
                else {
                    this._opaqueObjects.push(object);
                }
            }
        }
        // Scene is only an abstract representation
        else if (!(object instanceof M3D.Scene) && !(object instanceof M3D.Group)) {
            console.log("MeshRenderer: Received unsupported object type")
        }

        // Recursively descend through children and project them
        var children = object.children;

        // Recurse through the children
        for (var i = 0, l = children.length; i < l; i++) {
            this._projectObject(children[i], camera);
        }
    }

    _setupRenderTarget(renderTarget) {
        if (renderTarget) {
            // Check if the render target is specified
            this._currentRenderTarget = renderTarget;
            var rttViewport = renderTarget._viewport;

            // Setup viewport
            this._gl.viewport(rttViewport.x, rttViewport.y, rttViewport.z, rttViewport.w);

            if (this._rttFamebuffer === null) {
                this._rttFamebuffer = this._gl.createFramebuffer();
            }

            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._rttFamebuffer);

            this._glManager.updateRTTTexture(renderTarget);
        }
        else {
            this._currentRenderTarget = null;
            this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);

            this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
        }
    }

    /**
     * Sets up all of the lights found during the object projections. The lights are summed up into a single lights structure
     * representing all of the lights that affect the scene in the current frame.
     * @param {Array} lights Array of lights that were found during the projection
     * @param {M3D.Camera} camera Camera observing the scene
     */
    _setupLights(lights, camera) {

        // Reset combinedLights
        this._lightsCombined.ambient = [0, 0, 0];
        this._lightsCombined.directional.length = 0;
        this._lightsCombined.point.length = 0;

        // Light properties
        var light,
            color,
            intensity,
            distance;

        // Light colors
        var r = 0, g = 0, b = 0;

        for (var i = 0; i < lights.length; i++) {

            light = lights[i];

            color = light.color;
            intensity = light.intensity;

            if (light instanceof M3D.AmbientLight) {
                r += color.r * intensity;
                g += color.g * intensity;
                b += color.b * intensity;
            }
            else if (light instanceof M3D.DirectionalLight) {

                var lightProperties = {
                    color: new THREE.Color(),
                    direction: new THREE.Vector3()
                };

                lightProperties.color.copy(light.color).multiplyScalar(light.intensity);
                lightProperties.direction.setFromMatrixPosition(light.matrixWorld);
                lightProperties.direction.transformDirection(camera.matrixWorldInverse);

                this._lightsCombined.directional.push(lightProperties);
            }
            else if (light instanceof M3D.PointLight) {

                var lightProperties = {
                    color: new THREE.Color(),
                    position: new THREE.Vector3()
                };

                // Move the light to camera space
                lightProperties.position.setFromMatrixPosition(light.matrixWorld);
                lightProperties.position.applyMatrix4(camera.matrixWorldInverse);

                // Apply light intensity to color
                lightProperties.color.copy(light.color).multiplyScalar(light.intensity);

                this._lightsCombined.point.push(lightProperties);
            }
        }

        this._lightsCombined.ambient[0] = r;
        this._lightsCombined.ambient[1] = g;
        this._lightsCombined.ambient[2] = b;
    }


    /**
     * SETTERS / GETTERS
     */

    set autoClear(clear) {
        this._autoClear = clear;
    }

    get autoClear() {
        return this._autoClear;
    }

    set clearColor(hexColor) {
        var components = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
        if (components) {
            this._glManager.setClearColor(parseInt(components[1], 16) / 255, parseInt(components[2], 16) / 255, parseInt(components[3], 16) / 255, 1)
        }
    }

    updateViewport(width, height) {
        this._gl.viewport(0, 0, width, height);
    }

    /**
     * Sets the url to shader server & directory from which the shaders source is loaded.
     * @param url Full url to the shader server directory
     */
    addShaderLoaderUrls (...urls) { this._shaderLoader.addUrls(urls); }

    clearCache() {
        this._glManager.clearAttributeBuffers();
    }
};