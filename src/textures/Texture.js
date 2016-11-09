/**
 * Created by Primoz on 21. 07. 2016.
 */



M3D.Texture = class {

	constructor(image, wrapS, wrapT, minFilter, magFilter, internalFormat, format, type) {
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
		this._internalFormat = (internalFormat) ? internalFormat : M3D.Texture.RGBA;
		this._format = (format) ? format : M3D.Texture.RGBA;

		// Type
		this._type = (type) ? type : M3D.Texture.UNSIGNED_BYTE;

		// Mipmaps
		this._generateMipmaps = false;

		this._dirty = true;
	}

	// region GETTERS
	get dirty() { return this._dirty; }
	get image() { return this._image; }

    get wrapS() {
		return this._wrapS;
	}
	get wrapT(){
            return this._wrapT;
        }

	get minFilter(){
            return this._minFilter;
        }
	get magFilter(){
            return this._magFilter;
        }

	get internalFormat() {
		return this._internalFormat;
	}
	get format() {
		return this._format;
	}

	get type() {
		return this._type;
	}
	// endregion

	// region SETTERS
	set image(value) {
		this._image = value;
		this._dirty = true;
	}

	set wrapS(value) {
		this._wrapS = value;
		this._dirty = true;
	}
	set wrapT(value) {
		this._wrapT = value;
		this._dirty = true;
	}

	set minFilter(value) {
		this._minFilter = value;
		this._dirty = true;
	}
	set magFilter(value) {
		this._magFilter = value;
		this._dirty = true;
	}

	set internalFormat(value) {
		this._internalFormat = value;
	}
	set format(value) {
		this._format = value;
		this._dirty = true;
	}

	set type(value) {
		this._type = value;
		this._dirty = true;
	}
	// endregion
};

// region CLASS RELATED CONSTANTS

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
M3D.Texture.DEPTH_COMPONENT = 11;
M3D.Texture.DEPTH_COMPONENT24 = 12;

// WRAPPING
M3D.Texture.RepeatWrapping = 13;
M3D.Texture.ClampToEdgeWrapping = 14;
M3D.Texture.MirroredRepeatWrapping = 15;

// TYPE
M3D.Texture.UNSIGNED_BYTE = 16;			// Color (default)
M3D.Texture.UNSIGNED_SHORT = 17;		// Depth (default)
M3D.Texture.UNSIGNED_INT = 18;

// endregion