/**
 * Created by Primoz on 2. 08. 2016.
 */

var ShaderBuilder = require('./shaderBuilder.js');
var fs = require('fs');

var PATH = "basic_template.frag";


var shader_template = fs.readFileSync(PATH, "utf8");

/*
var shaderBuilder = new ShaderBuilder();

var test = shaderBuilder.buildShader(shader_template, ["LIGHTS", "TEXTURE", "COLORS"], false, "./out/");
*/

// TREE NODE
/**
{
    type: CONDITION_NODE / LOOP_NODE / CODE_NODE / ROOT_NODE,

    // If condition node
    if_condition: "",
    if_sub_nodes: []

    elseif_conditions: []
    elseif_sub_nodes: [[]]

    else_sub_nodes: []

    // If for node
    replace_marker: "",
    from: integer,
    to: integer,

    // If code node
    code: "",

    // All except CODE_NODE
    sub_nodes: [],
}
 */

var multiLineCommentRegex = /\/\*[\s\S]*\*\//g;
var singleLineCommentRegex = /\/\/.*/g;
var lineReduceRegex = /[^\r\n]+/g;
var prefixSuffixSpaceTrimRegex = /(^\s+|\s+$)/g;
var multipleSpaceMatch = /\s+/g;

var forLoopValidateRegex = /#for\s+\S+\s+in\s+[1-9][0-9]*\s+to\s+[1-9][0-9]*/i;

var validConditionShellRegex = /\([a-zA-Z0-9|&()\s]+\)/gi;
var logicalOperatorsRegex = /\&\&|[|]{2}/g;
var everythingButBracketsRegex = /[^()!]+/g;

var evaluateCondition = function (statement, flags) {
    // Remove all spaces
    statement = statement.replace(/\s/g, '');

    // SET GIVEN FLAGS TO TRUE
    if (flags.length > 0) {
        var trueFlagsStr = "";
        var falseFlagsStr = "";

        // Create condition check
        for (var i = 0; i < flags.length; i++) {
            trueFlagsStr += flags[i];
            falseFlagsStr += "!" + flags[i];

            if (i !== flags.length - 1) {
                trueFlagsStr += "|";
                falseFlagsStr += "|";
            }
        }

        // Order is important
        statement = statement.replace(new RegExp(falseFlagsStr, 'gi'), "false");
        statement = statement.replace(new RegExp(trueFlagsStr, 'gi'), "true");
    }

    // SET REMAINING FLAGS TO FALSE

    // Fetch condition values and operators sequence
    var condValues = statement.split(logicalOperatorsRegex);
    var condOperators = statement.match(logicalOperatorsRegex);

    // Match returns null if no match
    if (condOperators == null) {
        condOperators = [];
    }

    // Check if number of operators and values match
    if (condValues.length === 0 || condOperators.length !== condValues.length - 1) {
        throw "InvalidCondition";
    }

    // Replace unset flags
    for (var i = 0; i < condValues.length; i++) {
        var value = condValues[i].match(everythingButBracketsRegex)[0].replace(prefixSuffixSpaceTrimRegex, '');

        // If the value is not true
        if (value !== 'true') {
            condValues[i] = condValues[i].replace(everythingButBracketsRegex, 'false');
        }
    }

    // Merge the condition
    statement = condValues[0];

    for (var i = 0; i < condOperators.length; i++) {
        statement += condOperators[i] + condValues[i + 1];
    }

    try {
        return eval(statement);
    }
    catch (e) {
        throw "InvalidCondition";
    }
};


shader_template = shader_template.replace(multiLineCommentRegex, '');
var arrayOfLines = shader_template.match(lineReduceRegex);

var ROOT_NODE = 0;
var CODE_NODE = 1;
var CONDITION_NODE = 2;
var LOOP_NODE = 3;

var nodeStack = [];
var currentNode = {type: ROOT_NODE, sub_nodes: []};
var rootNode = currentNode;


for (var i = 0; i < arrayOfLines.length; i++) {
    var trimmedLine = arrayOfLines[i].replace(prefixSuffixSpaceTrimRegex, '').replace(multipleSpaceMatch,' ').replace(singleLineCommentRegex, '');

    if (trimmedLine.length === 0) {
        continue;
    }

    var current_subnodes;

    if (currentNode.type === CONDITION_NODE) {
        if (currentNode.else_sub_nodes !== undefined) {
            current_subnodes = currentNode.else_sub_nodes;
        }
        else if (currentNode.elseif_nodes !== undefined) {
            current_subnodes = currentNode.elseif_nodes[currentNode.elseif_nodes.length - 1];
        }
        else {
            current_subnodes = currentNode.if_sub_nodes;
        }
    }
    else {
        current_subnodes = currentNode.sub_nodes;
    }


    if (/#IF.*/i.test(trimmedLine)) {
        var condition = trimmedLine.substring(4);

        // Validate condition
        if (!validConditionShellRegex.test(condition)) {
            // TODO: ERROR
        }

        try {
            evaluateCondition(condition, []);
        }
        catch(e) {
            // TODO: ERROR
        }

        // Create new node
        current_subnodes.push({
            type: CONDITION_NODE,
            if_condition: condition,
            if_sub_nodes: []
        });

        // Add new node to node stack
        currentNode = current_subnodes[current_subnodes.length - 1];
        nodeStack.push(currentNode);
    }

    else if (/#ELSE IF.*/i.test(trimmedLine)) {
        var condition = trimmedLine.substring(9);

        // Validate condition
        if (!validConditionShellRegex.test(condition)) {
            // TODO: ERROR
        }

        try {
            evaluateCondition(condition, []);
        }
        catch(e) {
            // TODO: ERROR
        }

        if (currentNode.type !== CONDITION_NODE) {
            // TODO: ERROR
        }
        else {
            // For the first else if initialize elseif conditions and nodes
            if (currentNode.elseif_conditions === undefined) {
                currentNode.elseif_conditions = [];
                currentNode.elseif_nodes = [];
            }

            currentNode.elseif_conditions.push(condition);
            currentNode.elseif_nodes.push([]);
        }
    }

    else if (/#ELSE.*/i.test(trimmedLine)) {
        if (trimmedLine.length > 5) {
            // TODO: ERROR
        }

        if (currentNode.type !== CONDITION_NODE) {
            // TODO: ERROR
        }
        else {
            currentNode.else_sub_nodes = [];
        }
    }

    else if (/#FI.*/i.test(trimmedLine)) {
        if (trimmedLine.length > 3) {
            // TODO: ERROR
        }

        if (currentNode.type !== CONDITION_NODE) {
            // TODO: ERROR
        }
        else {
            currentNode = nodeStack.pop(currentNode);

            if (currentNode === undefined) {
                // TODO: ERROR
            }
        }
    }

    else if (/#FOR.*/i.test(trimmedLine)) {
        if (!forLoopValidateRegex.test(trimmedLine)) {
            // TODO: ERROR
        }

        // Create new layer
        // TODO:
    }

    else if (/#ENDFOR.*/i.test(trimmedLine)) {
        if (trimmedLine.length > 7) {
            // TODO: ERROR
        }
        // TODO
    }

    else {
        var lastSubnode;

        if (current_subnodes.length > 0) {
            lastSubnode = current_subnodes[current_subnodes.length - 1];
        }

        // Other statement
        if (lastSubnode !== undefined && lastSubnode.type === CODE_NODE) {
            lastSubnode.code += "\n" + trimmedLine;
        }
        else {
            current_subnodes.push({
                type: CODE_NODE,
                code: trimmedLine
            });
        }
    }
}

var a = 0;
//console.log(arrayOfLines);