/**
 * Created by Ziga on 17.3.2016.
 */

// TODO - Primoz: zmergej z ShaderLoaderPrimoz.js
M3D.ShaderLoader = class {

	constructor(manager) {
		this.manager = manager || new M3D.LoadingManager();
	}

	load(url, onLoad, onProgress, onError) {
		var scope = this;
		var loader = new M3D.XHRLoader(scope.manager);
		loader.setPath(this.path);
		var path = loader.extractUrlBase(url);
		loader.load(url, function(text) {
			var json = JSON.parse(text);
			var n = json.shaders.length;
			loader.setPath(path);

			var shaders = [];
			// this function returns a custom handler,
			// which knows the shader type
			var handlerCreator = function(type) {
				return function(text) {
					shaders.push({source: text, type: type});
					if (--n === 0) {
						onLoad(shaders);
					}
				}
			}
			for (var shader of json.shaders) {
				loader.load(shader.file, handlerCreator(shader.type));
			}
		}, onProgress, onError);
	}

	setPath(path) {
		this.path = path;
	}

}