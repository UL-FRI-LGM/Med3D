/**
 * Created by Ziga on 25.3.2016.
 */


/**
 * Interface for renderers, implemented by VolumeRenderer, MeshRenderer, etc.
 * @class Renderer
 */
M3D.Renderer = class {
	// Subclasses perform WebGL initialization, texture allocation, etc.
	// Renderers can be run offline, without WebGL.
	constructor() {}

	render(scene, camera) {}
};