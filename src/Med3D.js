/**
 * Global namespace for Med3D.
 *
 * @namespace
 */

const singleton = Symbol();
const singletonEnforcer = Symbol();

var M3D = {
	revision: 1,

	// Material side constants
	FRONT_SIDE: 0,
	BACK_SIDE: 1,
	FRONT_AND_BACK_SIDE: 2,

	FUNC_LESS: 3,
	FUNC_LEQUAL: 4,
	FUNC_EQUAL: 5,
	FUNC_NOTEQUAL: 6,
	FUNC_GREATER: 7,
	FUNC_GEQUAL: 8
};

