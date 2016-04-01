/**
 * Created by Ziga on 1.4.2016.
 */

M3D.BufferAttribute = function(array, itemSize) {
	this.type = 'BufferAttribute';

	this.array = array;
	this.itemSize = itemSize;
}

M3D.BufferAttribute.prototype = {
	constructor: BufferAttribute,

	get count() {
		return this.array.length / this.itemSize;
	}

}

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