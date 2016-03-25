/**
 * Created by Ziga on 25.3.2016.
 */


/**
 * Interface for renderers, implemented by VolumeRenderer, MeshRenderer, etc.
 * @class Renderer
 */
M3D.Renderer = function () {
	// Subclasses perform WebGL initialization, texture allocation, etc.
	// Renderers can be run offline, without WebGL.
}

M3D.Renderer.prototype = {

	constructor: M3D.Renderer,

	render: function(scene, camera) {}

}