/**
 * Created by Primoz on 21. 07. 2016.
 */



M3D.Texture = class {

	constructor(image, wrapS, wrapT, minFilter, magFilter, internalFormat, format, type, width = 800, height = 600) {
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

		// If image is specified this is disregarded (Should be specified when using empty textures)
		this._width = width;
		this._height = height;

		this._dirty = true;
	}

	applyConfig(texConfig) {
        this.wrapS = texConfig.wrapS;
        this.wrapT = texConfig.wrapT;
        this.minFilter = texConfig.minFilter;
        this.magFilter = texConfig.magFilter;
        this.internalFormat = texConfig.internalFormat;
        this.format = texConfig.format;
        this.type = texConfig.type;
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
		if (value !== this._image) {
            this._image = value;
            this._dirty = true;
        }
	}

	set wrapS(value) {
        if (value !== this._wrapS) {
            this._wrapS = value;
            this._dirty = true;
        }
	}
	set wrapT(value) {
        if (value !== this._wrapT) {
            this._wrapT = value;
            this._dirty = true;
        }
	}

	set minFilter(value) {
        if (value !== this._minFilter) {
            this._minFilter = value;
            this._dirty = true;
        }
	}
	set magFilter(value) {
        if (value !== this._magFilter) {
            this._magFilter = value;
            this._dirty = true;
        }
	}

	set internalFormat(value) {
        if (value !== this._internalFormat) {
            this._internalFormat = value;
            this._dirty = true;
        }
	}
	set format(value) {
        if (value !== this._format) {
            this._format = value;
            this._dirty = true;
        }
	}

	set width(value) {
        if (value !== this._width) {
            this._width = value;
            this._dirty = true;
        }
	}

	set height(value) {
        if (value !== this._height) {
            this._height = value;
            this._dirty = true;
        }
	}

	set type(value) {
        if (value !== this._type) {
            this._type = value;
            this._dirty = true;
        }
	}
	// endregion
};

// region CLASS RELATED CONSTANTS

// STATIC VARIABLES
M3D.Texture.DefaultImage = null;

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
M3D.Texture.RGB16F = 13;
M3D.Texture.RGB32F = 14;
M3D.Texture.RGBA16F = 15;
M3D.Texture.RGBA32F = 16;


// WRAPPING
M3D.Texture.RepeatWrapping = 15;
M3D.Texture.ClampToEdgeWrapping = 16;
M3D.Texture.MirroredRepeatWrapping = 17;

// TYPE
M3D.Texture.UNSIGNED_BYTE = 18;			// Color (default)
M3D.Texture.UNSIGNED_SHORT = 19;		// Depth (default)
M3D.Texture.UNSIGNED_INT = 20;
M3D.Texture.HALF_FLOAT = 21;
M3D.Texture.FLOAT = 22;

/** NOTE
 * Only following formats can be added as color attachments
 * gl.R16F, gl.RG16F, gl.RGBA16F, gl.R32F, gl.RG32F, gl.RGBA32F, gl.R11F_G11F_B10F.
 */
// endregion