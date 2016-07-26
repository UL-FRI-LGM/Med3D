/**
 * Created by Primoz on 21. 07. 2016.
 */



M3D.Texture = class {

	constructor(image, wrapS, wrapT, minFilter, magFilter, format) {
		this._uuid = THREE.Math.generateUUID();
		this.type = "Texture";

		this._image = (image) ? image : M3D.Texture.DefaultImage;

		// Filters
		this._magFilter = magFilter !== undefined ? magFilter : M3D.Texture.LinearFilter;
		this._minFilter = minFilter !== undefined ? minFilter : M3D.Texture.LinearFilter;

		// Wrapping
		this._wrapS = wrapS !== undefined ? wrapS : M3D.Texture.ClampToEdgeWrapping;
		this._wrapT = wrapT !== undefined ? wrapT : M3D.Texture.ClampToEdgeWrapping;

		// Format
		this._format = (format) ? format : M3D.Texture.RGBA;

		// Mipmaps
		this._generateMipmaps = true;

		this._dirty = true;
	}

	get dirty() { return this._dirty; }
	get image() { return this._image; }

	set image(value) {
		this._image = value;
		this._dirty = true;
	}

};

// STATIC VARIABLES
M3D.Texture.DefaultImage = undefined;

// FILTERS
M3D.Texture.NearestFilter = 0;
M3D.Texture.NearestMipMapNearestFilter = 1;
M3D.Texture.NearestMipMapLinearFilter = 2;
M3D.Texture.LinearFilter = 3;
M3D.Texture.LinearMipMapNearestFilter = 4;
M3D.Texture.LinearMipMapLinearFilter = 5;

// FORMAT
M3D.Texture.ALPHA = 6;
M3D.Texture.RGB = 7;
M3D.Texture.RGBA = 8;
M3D.Texture.LUMINANCE = 9;
M3D.Texture.LUMINANCE_ALPHA = 10;

// WRAPPING
M3D.Texture.RepeatWrapping = 11;
M3D.Texture.ClampToEdgeWrapping = 12;
M3D.Texture.MirroredRepeatWrapping = 13;