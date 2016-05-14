/**
 * Created by Ziga & Primoz on 1.4.2016.
 */

M3D.BufferAttribute = class {

	constructor(array, itemSize) {

		// TODO - Primoz: za id uporabljaj kar referenco
		// Unique identifier used for WebGLProperties addressing
		this.uuid = THREE.Math.generateUUID();

		this.array = array;
		this.itemSize = itemSize;

	    // TODO - Primoz: spremeni v flag
		// Tells if local copies are up to date
		this.version = 0;
	}

	/**
	 * Returns the number of items in data array (numValues / itemSize)
	 * @returns {number} Item count
	 */
	count() {
		return this.array.length / this.itemSize;
	}

};

M3D.Int8Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Int8Array(array), itemSize);
};

M3D.Uint8Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Uint8Array(array), itemSize);
};

M3D.Uint8ClampedAttribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Uint8ClampedArray(array), itemSize);
};

M3D.Int16Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Int16Array(array), itemSize);
};

M3D.Uint16Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Uint16Array(array), itemSize);
};

M3D.Int32Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Int32Array(array), itemSize);
};

M3D.Uint32Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Uint32Array(array), itemSize);
};

M3D.Float32Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Float32Array(array), itemSize);
};

M3D.Float64Attribute = function(array, itemSize) {
	return new M3D.BufferAttribute(new Float64Array(array), itemSize);
};