/**
 * Created by Primoz on 2. 08. 2016.
 */

var ShaderBuilder = require('./shaderBuilder.js');

var shaderBuilder = new ShaderBuilder();

var test = shaderBuilder.buildShaderCombinations("basic_template.frag", ["LIGHTS", "TEXTURE", "COLORS"], ShaderBuilder.WEB_GL2, false, "./out/");

console.log(test);