/**
 * Created by Primoz on 28.4.2016.
 */

M3D.MeshRenderer = class extends M3D.Renderer {

    constructor(canvas, gl_version) {
        // Call abstract Renderer constructor
        super(canvas, gl_version);

        // Frustum
        this._projScreenMatrix = new THREE.Matrix4();
        this._sphere = new THREE.Sphere();
        this._frustum = new THREE.Frustum();

        //region Current frame render arrays
        this._opaqueObjects = [];
        this._transparentObjects = [];
        this._lights = [];
        this._lightsCombined = {
            ambient: [0, 0, 0],
            directional: [],
            point: []
        };
        this._zVector = new THREE.Vector3();
        // endregion

        // Enable depth testing (disable depth testing with gl.ALWAYS)
        this._gl.enable(this._gl.DEPTH_TEST);

        // Enable back-face culling by default
        this._gl.frontFace(this._gl.CCW);

        // Set the selected renderer
        this._selectedRenderer = this._meshRender;
    }

    _meshRender(scene, camera) {

        // Update scene graph and camera matrices
        if (scene.autoUpdate === true)
            scene.updateMatrixWorld();

        this._projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this._frustum.setFromMatrix(this._projScreenMatrix);

        // Clear the render arrays
        this._opaqueObjects.length = 0;
        this._transparentObjects.length = 0;
        this._lights.length = 0;

        // Update objects attributes and setup lights
        this._projectObject(scene, camera);

        this._setupLights(this._lights, camera);

        // Programs need to be loaded after the lights
        if (!this._loadRequiredPrograms()) {
            return;
        }

        // Render opaque objects
        if (this._opaqueObjects.length > 0) {
            this._renderObjects(this._opaqueObjects, camera);
        }

        if (this._transparentObjects.length > 0) {
            // Sort the objects by Z
            this._transparentObjects.sort(function(a, b) {
                return b._z - a._z;
            });

            // Enable Blending
            this._gl.enable(this._gl.BLEND);

            // Set up blending equation and params
            this._gl.blendEquation(this._gl.FUNC_ADD);
            this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

            // Render transparent objects
            this._renderObjects(this._transparentObjects, camera);

            // Clean up
            this._gl.disable(this._gl.BLEND);
        }
    }

    _renderObjects(objects, camera) {
        for (let i = 0; i < objects.length; i++) {
            let program = this._compiledPrograms.get(objects[i].material.requiredProgram().programID);
            program.use();

            this._setup_uniforms(program, objects[i], camera);

            let vertices = objects[i].geometry.vertices;
            this._setup_attributes(program, objects[i], vertices);

            this._setup_material_settings(objects[i].material);

            // Draw wireframe instead of the planes
            if (objects[i] instanceof M3D.Line) {
                this._gl.drawArrays(this._gl.LINES, 0, vertices.count());
            }
            else if (objects[i].geometry.drawWireframe) {
                let buffer = this._glManager.getAttributeBuffer(objects[i].geometry.wireframeIndices);
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, buffer);
                this._gl.drawElements(this._gl.LINES, objects[i].geometry.wireframeIndices.count(), this._gl.UNSIGNED_INT, 0)
            }
            else if (objects[i].geometry.indices) {
                let buffer = this._glManager.getAttributeBuffer(objects[i].geometry.indices);
                this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, buffer);
                this._gl.drawElements(this._gl.TRIANGLES, objects[i].geometry.indices.count(), this._gl.UNSIGNED_INT, 0)
            }
            else {
                this._gl.drawArrays(this._gl.TRIANGLES, 0, vertices.count());
            }
        }
    }

    _setup_attributes(program, object, vertices) {
        let attributeSetter = program.attributeSetter;
        let attributes = Object.getOwnPropertyNames(attributeSetter);

        let customAttributes;

        // If material is a type of CustomShaderMaterial it may contain its own definition of attributes
        if (object.material instanceof M3D.CustomShaderMaterial) {
            customAttributes = object.material._attributes;
        }

        let buffer;

        // Set all of the properties
        for (let i = 0; i < attributes.length; i++) {

            switch (attributes[i]) {
                case "VPos":
                    buffer = this._glManager.getAttributeBuffer(vertices);
                    attributeSetter["VPos"].set(buffer, 3);
                    break;
                case "VNorm":
                    let normals = object.geometry.normals;
                    buffer = this._glManager.getAttributeBuffer(normals);
                    attributeSetter["VNorm"].set(buffer, 3);
                    break;
                case "VColor":
                    let vertColor = object.geometry.vertColor;
                    buffer = this._glManager.getAttributeBuffer(vertColor);
                    attributeSetter["VColor"].set(buffer, 4);
                    break;
                case "uv":
                    let uv = object.geometry.uv;
                    buffer = this._glManager.getAttributeBuffer(uv);
                    attributeSetter["uv"].set(buffer, 2);
                    break;
                default:
                    let found = false;

                    // Check if the custom attributes are given
                    if (customAttributes !== undefined) {
                        let attr = customAttributes[attributes[i]];

                        // If attribute is defined in the custom attribute object, fetch buffer and bind it to program
                        if (attr !== undefined) {
                            found = true;
                            buffer = this._glManager.getAttributeBuffer(attr);
                            attributeSetter[attributes[i]].set(buffer, 3);
                        }
                    }

                    // Notify the user if the attribute was not found
                    if (!found) {
                        console.error("Attribute (" + attributes[i] + ") not set!");
                    }
                    break;
            }
        }
    }

    _setup_uniforms(program, object, camera) {
        let uniformSetter = program.uniformSetter;

        // Reset the uniform validation
        uniformSetter.__validation.reset();

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

        // Check if all of the uniforms have been set
        let notSet = uniformSetter.__validation.validate();

        if (notSet.length > 0) {
            let notSetString = notSet[0];

            // Notify the user which uniforms have not been set
            for (let i = 1; i < notSet.length; i++) {
                notSetString += ", " + notSet[i];
            }

            console.error("Uniforms (" + notSetString + ") not set!");
        }
    }

    // TODO: Better naming of the uniforms is needed in order to avoid string usage.
    _setup_material_uniforms(material, uniformSetter) {
        // Setup custom user uniforms (in case of CustomShaderMaterial)
        if (material instanceof M3D.CustomShaderMaterial) {
            let customUniforms = material._uniforms;

            // Set all of the custom uniforms if they are defined within the shader
            for (let name in customUniforms) {
                if (customUniforms.hasOwnProperty(name)) {
                    if (uniformSetter[name] !== undefined) {
                        uniformSetter[name].set(customUniforms[name]);
                    }
                }
            }
        }
        else {
            if (uniformSetter["material.diffuse"] !== undefined) {
                uniformSetter["material.diffuse"].set(material.color.toArray());
            }

            if (uniformSetter["material.specular"] !== undefined) {
                uniformSetter["material.specular"].set(material.specular.toArray());
            }

            if (uniformSetter["material.shininess"] !== undefined) {
                uniformSetter["material.shininess"].set(material.shininess);
            }
        }

        // Setup texture uniforms (Are common for both predefined materials and custom shader material)
        let textures = material.maps;

        for (let i = 0; i < textures.length; i++) {
            const texture = "material.texture" + i;
            if (uniformSetter[texture] !== undefined) {
                uniformSetter[texture].set(this._glManager.getTexture(textures[i]), i);
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
        else if (!material.depthTest) {
            this._gl.depthFunc(this._gl.ALWAYS);
        }

        // Enable/Disable depth writing
        this._gl.depthMask(material.depthWrite);
    }

    _setup_light_uniforms(uniformSetter) {

        if (uniformSetter["ambient"] !== undefined) {
            uniformSetter["ambient"].set(this._lightsCombined.ambient);
        }

        var index = 0, prefix, light;

        // DIRECTIONAL LIGHTS
        for (let i = 0; i < this._lightsCombined.directional.length; i++) {
            prefix = "lights[" + index + "]";
            light = this._lightsCombined.directional[i];

            if (uniformSetter[prefix + ".position"]) {
                uniformSetter[prefix + ".position"].set(light.direction.toArray());
            }
            if (uniformSetter[prefix + ".color"]) {
                uniformSetter[prefix + ".color"].set(light.color.toArray());
            }
            if (uniformSetter[prefix + ".directional"]) {
                uniformSetter[prefix + ".directional"].set(1);
            }

            index++;
        }

        // POINT LIGHTS
        for (let i = 0; i < this._lightsCombined.point.length; i++) {
            prefix = "lights[" + index + "]";
            light = this._lightsCombined.point[i];

            if (uniformSetter[prefix + ".position"]) {
                uniformSetter[prefix + ".position"].set(light.position.toArray());
            }
            if (uniformSetter[prefix + ".color"]) {
                uniformSetter[prefix + ".color"].set(light.color.toArray());
            }
            if (uniformSetter[prefix + ".directional"]) {
                uniformSetter[prefix + ".directional"].set(0);
            }

            index++;
        }
    }

    // TODO: Optimize required programs string. Overhead due to the string comparison is too big!
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

            // Frustum culling
            if (object.frustumCulled === false || this._isObjectVisible(object)) {

                // Adds required program to the array of required programs if it's not present in it already
                let requiredProgram = object.material.requiredProgram();
                let found = false;

                for (let i = 0; i < this._requiredPrograms; i++) {
                    if (requiredProgram.compare(this._requiredPrograms[i])) {
                        found = true;
                        break;
                    }
                }

                // If the program was not found add it to required programs array
                if (!found) {
                    this._requiredPrograms.push(requiredProgram)
                }

                if (object.visible === true) {
                    // Updates or derives attributes from the WebGL geometry
                    this._glManager.updateObjectData(object);

                    // Derive mv and normal matrices
                    object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);
                    object.normalMatrix.getNormalMatrix(object.modelViewMatrix);

                    // Add object to correct render array
                    if (object.material.transparent) {
                        this._zVector.setFromMatrixPosition(object.matrixWorld);
                        this._zVector.applyProjection(this._projScreenMatrix);
                        object._z = this._zVector.z;
                        this._transparentObjects.push(object);
                    }
                    else {
                        this._opaqueObjects.push(object);
                    }
                }
            }
        }
        // Scene is only an abstract representation
        else if (!(object instanceof M3D.Scene) && !(object instanceof M3D.Group)) {
            console.log("MeshRenderer: Received unsupported object type")
        }

        // Recursively descend through children and project them
        let children = object.children;

        // Recurse through the children
        for (let i = 0, l = children.length; i < l; i++) {
            this._projectObject(children[i], camera);
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
        let light,
            color,
            intensity,
            distance;

        // Light colors
        let r = 0, g = 0, b = 0;

        for (let i = 0; i < lights.length; i++) {

            light = lights[i];

            color = light.color;
            intensity = light.intensity;

            if (light instanceof M3D.AmbientLight) {
                r += color.r * intensity;
                g += color.g * intensity;
                b += color.b * intensity;
            }
            else if (light instanceof M3D.DirectionalLight) {

                let lightProperties = {
                    color: new THREE.Color(),
                    direction: new THREE.Vector3()
                };

                lightProperties.color.copy(light.color).multiplyScalar(light.intensity);
                lightProperties.direction.setFromMatrixPosition(light.matrixWorld);
                lightProperties.direction.transformDirection(camera.matrixWorldInverse);

                this._lightsCombined.directional.push(lightProperties);
            }
            else if (light instanceof M3D.PointLight) {

                let lightProperties = {
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

    _isObjectVisible(object) {
        let geometry = object.geometry;

        // Check if the bounding sphere is calculated
        if (geometry.boundingSphere === null) {
            geometry.computeBoundingSphere();
        }

        // Translate sphere
        this._sphere.copy(geometry.boundingSphere).applyMatrix4(object.matrixWorld);

        // Check if the frustum intersects the sphere
        return this._frustum.intersectsSphere(this._sphere)
    }
};