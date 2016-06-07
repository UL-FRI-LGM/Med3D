/**
 * Created by Ziga on 18.4.2016
 * Source: three.js
 */

M3D.ImageLoader = class {

	constructor(manager) {
		this.manager = manager || new M3D.LoadingManager();
	}

	load(url, onLoad, onProgress, onError) {
		if ( this.path !== undefined ) url = this.path + url;
		var scope = this;
		var cached = M3D.Cache.get(url);
		if (cached !== undefined) {
			scope.manager.itemStart(url);
			if (onLoad) {
				setTimeout(function() {
					onLoad(cached);
					scope.manager.itemEnd(url);
				}, 0);
			} else {
				scope.manager.itemEnd(url);
			}
			return cached;
		}

		var image = new Image();
		image.addEventListener('load', function(event) {
			M3D.Cache.add(url, this);
			if (onLoad) onLoad(this);
			scope.manager.itemEnd(url);
		}, false);

		if (onProgress !== undefined) {
			image.addEventListener('progress', function(event) {
				onProgress(event);
			}, false);
		}

		image.addEventListener('error', function(event) {
			if (onError) onError(event);
			scope.manager.itemError(url);
		}, false);

		if (this.crossOrigin !== undefined) image.crossOrigin = this.crossOrigin;
		scope.manager.itemStart(url);
		image.src = url;
		return image;
	}

	setCrossOrigin(value) {
		this.crossOrigin = value;
	}

	setPath(value) {
		this.path = value;
	}

}