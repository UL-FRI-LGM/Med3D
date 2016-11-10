/**
 * Created by Primoz on 2. 08. 2016.
 */

var ShaderBuilder = require('./shaderBuilder.js');
var RootNode = require('./Nodes.js');
var fs = require('fs');

var PATH = "test4.txt";


var shader_template = fs.readFileSync(PATH, "utf8");

/*
var shaderBuilder = new ShaderBuilder();

var test = shaderBuilder.buildShader(shader_template, ["LIGHTS", "TEXTURE", "COLORS"], false, "./out/");
*/


var multiLineCommentRegex = /\/\*[\s\S]*\*\//g;
var singleLineCommentRegex = /\/\/.*/g;
var lineReduceRegex = /[^\r\n]+/g;
var prefixSuffixSpaceTrimRegex = /(^\s+|\s+$)/g;
var multipleSpaceMatch = /\s+/g;


shader_template = shader_template.replace(multiLineCommentRegex, '');
var arrayOfLines = shader_template.match(lineReduceRegex);

var rootNode = new RootNode();


for (var i = 0; i < arrayOfLines.length; i++) {
    var trimmedLine = arrayOfLines[i].replace(prefixSuffixSpaceTrimRegex, '').replace(multipleSpaceMatch,' ').replace(singleLineCommentRegex, '');

    if (trimmedLine.length === 0) {
        continue;
    }

    rootNode.parseLine(trimmedLine);
}

var test = rootNode.build(["var3", "var7", "var5"]);

console.log(test);
//console.log(arrayOfLines);