/**
 * Created by Ziga & Primoz on 1.4.2016.
 */

M3D.Geometry = class {

	constructor() {
		// TODO - Primoz: FIX!!
		this.uuid = THREE.Math.generateUUID();

		this.indices = null;
		this.attributes = {};
	}

	// TODO - Primoz: vrzi ven vse setterje in getterje
	/**
	 * Returns geometry indices.
	 * @returns Geometry indices
     */
	getIndex() {
		return this.index;
	}

	/**
	 * Sets geometry indices.
	 * @param indices Geometry indices
     */
	setIndex(indices) {
		this.indices = indices;
	}

	/**
	 * Adds an attribute to this geometry.
	 * @param {String} name Attribute given name
	 * @param {M3D.BufferAttribute} attribute Geometry attribute
	 * @returns {M3D.BufferGeometry}
     */
	addAttribute(name, attribute) {
		this.attributes[name] = attribute;
		return this;
	}

	/**
	 * Removes an attribute from this geometry
	 * @param {String} name Name of the attribute
	 * @returns {M3D.BufferGeometry} This geometry
     */
	removeAttribute(name) {
		delete this.attributes[name];
		return this;
	}

	/**
	 * Geometry attribute getter
	 * @param name Name of requested attribute
	 * @returns {M3D.BufferAttribute}
     */
	getAttribute(name) {
		return this.attributes[name];
	}

}
