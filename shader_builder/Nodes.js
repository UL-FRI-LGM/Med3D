/**
 * Created by Primoz on 9. 11. 2016.
 */
var ShaderBuilder = {};

ShaderBuilder.STATE_OPENED = 0;
ShaderBuilder.STATE_CLOSED = 1;

// region REGEX SECTION

// Matches all available commands (#for, #endfor, #if, #else and #fi)
ShaderBuilder.commandRegex = /#for.*|#endfor.*|#if.*|#else.*|#fi.*/i;

// Matches #for and #if commands
ShaderBuilder.nodeStartRegex = /#for.*|#if.*/i;

// Matches correctly formed for loop (#FOR variable IN [unsigned integer] TO [unsigned integer])
ShaderBuilder.forLoopStartRegex = /#for\s+\S+\s+in\s+[1-9][0-9]*\s+to\s+[1-9][0-9]*/i;

// Matches 3 groups of for loop (variable, first u-int and second u-int
ShaderBuilder.forLoopVariableRegex = /#for\s+([a-z0-9]+)\s+in\s+([1-9][0-9]*)\s+to\s+([1-9][0-9]*)/i;

// Matches suffix and prefix spaces
ShaderBuilder.prefixSuffixSpaceRegex = /(^\s+|\s+$)/g;

// Matches #if command
ShaderBuilder.ifRegex = /#if.*/i;

// Matches #else if command
ShaderBuilder.elseIfRegex = /#else\s+if.*/i;

// Matches #else command
ShaderBuilder.elseRegex = /#else/i;

// Matches #fi command
ShaderBuilder.fiRegex = /#fi/i;

// Matches valid condition shell
ShaderBuilder.validConditionShellRegex = /\([a-zA-Z0-9!|&()\s]+\)/i;

// Matches logical operators || and &&
ShaderBuilder.logicalOperatorsRegex = /\&\&|[|]{2}/g;

// Matcher everything but brackets
ShaderBuilder.everythingButBracketsRegex = /[^()!]+/g;

//endregion

/**
 * Abstract node class. All nodes should extend this class and implement
 * state and methods like parseLine, build and _createNewSubNode
 */
ShaderBuilder.Node = class {

    constructor() {
        this._state = ShaderBuilder.STATE_OPENED;
    };

    /**
     * Fetches the current state of the node which can either be ShaderBuilder.STATE_OPENED when the node is still
     * under construction or ShaderBuilder.STATE_CLOSED when the node is finished.
     *
     * @returns {number} Can either be ShaderBuilder.STATE_OPENED or ShaderBuilder.STATE_CLOSED
     */
    get state() { return this._state; }

    /**
     * Sets the current state of the node.
     *
     * @param {number} value Must either be ShaderBuilder.STATE_OPENED or ShaderBuilder.STATE_CLOSED
     */
    set state(value) { this._state = value }

    /**
     * This is an abstract function which should be extended. It specifies call for line parsing which is used when building the
     * shader template tree.
     *
     * @param line {string} Line of template code
     */
    parseLine(line) {};

    /**
     * Creates new Node based on the specified line. If the line is ShaderBuilder command either ConditionNode or LoopNode
     * is created or if the line is normal line of shader code a CodeNode is created.
     *
     * @param line Line of template code. Could either be ShaderBuilder command or shader line of code.
     * @returns {ShaderBuilder.Node} Created ShaderBuilder node.
     * @private
     */
    _createNewSubNode(line) {
        if (!ShaderBuilder.commandRegex.test(line)) {
            // Create new code node
            return new ShaderBuilder.CodeNode(line);
        }
        else if (ShaderBuilder.ifRegex.test(line)) {
            // Fetch condition and cutoff
            var condition = line.substring(3).replace(ShaderBuilder.prefixSuffixSpaceRegex, '');

            if (!ShaderBuilder.validConditionShellRegex.test(condition)) {
                throw "Badly formed condition";
            }

            // Try to evaluate condition
            ShaderBuilder.ConditionNode.evaluateCondition(condition, []);

            // Create new condition node
            return new ShaderBuilder.ConditionNode(condition);
        }
        else if (ShaderBuilder.forLoopStartRegex.test(line)) {
            var extraction = ShaderBuilder.forLoopVariableRegex;

            if (extraction === null) {
                throw "Badly formed for loop";
            }

            return new ShaderBuilder.LoopNode(extraction[1], parseInt(extraction[2]), parseInt(extraction[3]));
        }
        else {
            throw "Badly formed command";
        }
    }

    /**
     * This is an abstract function which should be extended. It specifies call for shader build after the tree is formed.
     *
     * @param flags Flags that evaluate to true when conditions are tested.
     * @returns {string} Combined shader code that was built based on the input
     * @abstract
     */
    build(flags) {
        return "";
    }
};

/**
 * Creates new RootNode. This node should be used as root of the tree of the nodes.
 */
ShaderBuilder.RootNode = class extends ShaderBuilder.Node {

    constructor() {
        super();
        this._subNodes = [];
    }

    /**
     * Parses the line specified in the input. Based on the line and current sub nodes it creates new sub node o forwards
     * the line to the last node (OPENED).
     *
     * @param line Line of template code
     */
    parseLine(line) {
        if (this._subNodes.length > 0) {
            // Fetch last node
            var lastNode = this._subNodes[this._subNodes.length - 1];

            /**
             This is written in expanded form for easier debugging.
             */
            if (lastNode instanceof ShaderBuilder.CodeNode) {
                // Last node is type of CodeNode

                // Check if the next statement is command
                if (ShaderBuilder.commandRegex.test(line)) {
                    if (ShaderBuilder.nodeStartRegex.test(line)) {
                        // If the current line is a node start command, create appropriate node
                        this._subNodes.push(this._createNewSubNode(line));
                    }
                    else {
                        // Unexpected command
                        throw "Unexpected Command";
                    }
                }
                else {
                    // Normal line of shader code
                    lastNode.parseLine(line);
                }
            }
            else {
                // Pass the line of code to the current last node if opened. If not create a new node
                if (lastNode.state === ShaderBuilder.STATE_OPENED) {
                    lastNode.parseLine(line);
                }
                else {
                    this._subNodes.push(this._createNewSubNode(line));
                }
            }
        }
        else {
            this._subNodes.push(this._createNewSubNode(line));
        }
    }

    /**
     * Combines all of the sub nodes recursive output based on the specified flags in the input.
     *
     * @param flags Flags that evaluate to true when conditions are tested.
     * @returns {string} Combined shader code that was built based on the input
     */
    build(flags) {
        var shaderCode = "";

        // Recurse into all sub nodes
        for (var i = 0; i < this._subNodes.length; i++) {
            shaderCode += this._subNodes[i].build(flags);
        }

        // Remove last new line
        if (shaderCode.substring(shaderCode.length - 1) === '\n') {
            shaderCode = shaderCode.slice(0, -1);
        }

        return shaderCode;
    }
};

ShaderBuilder.CodeNode = class extends ShaderBuilder.Node {
    constructor(line) {
        super();
        this._code = line + "\n";
        // Code node should always be closed since it does not contain any sub nodes
        this._state = ShaderBuilder.STATE_CLOSED;
    }

    parseLine(line) {
        this._code += line + "\n";
    }

    build(flags) {
        return this._code;
    }
};

ShaderBuilder.ConditionNode = class extends ShaderBuilder.Node {

    constructor(condition) {
        super();

        this._if_condition = condition;
        this._if_subNodes = [];

        this._elseif_conditions = [];
        this._elseif_subNodesList = [];

        this._else_subNodes = null;
    }

    /**
     * Evaluates the given condition by setting the specified flags to true and others to false. Throws BadlyFormedCondition
     * if the condition is badly formed.
     * @param condition String condition
     * @param flags Flags that will be set to true
     * @returns {Object} Evaluation result
     */
    static evaluateCondition(condition, flags) {
        // Remove all spaces
        condition = condition.replace(/\s/g, '');

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
            condition = condition.replace(new RegExp(falseFlagsStr, 'gi'), "false");
            condition = condition.replace(new RegExp(trueFlagsStr, 'gi'), "true");
        }

        // SET REMAINING FLAGS TO FALSE

        // Fetch condition values and operators sequence
        var condValues = condition.split(ShaderBuilder.logicalOperatorsRegex);
        var condOperators = condition.match(ShaderBuilder.logicalOperatorsRegex);

        // Match returns null if no match
        if (condOperators == null) {
            condOperators = [];
        }

        // Check if number of operators and values match
        if (condValues.length === 0 || condOperators.length !== condValues.length - 1) {
            throw "BadlyFormedCondition";
        }

        // Replace unset flags
        for (var i = 0; i < condValues.length; i++) {
            var value = condValues[i].match(ShaderBuilder.everythingButBracketsRegex)[0].replace(ShaderBuilder.prefixSuffixSpaceRegex, '');

            // If the value is not true
            if (value !== 'true') {
                condValues[i] = condValues[i].replace(ShaderBuilder.everythingButBracketsRegex, 'false');
            }
        }

        // Merge the condition
        condition = condValues[0];

        for (var i = 0; i < condOperators.length; i++) {
            condition += condOperators[i] + condValues[i + 1];
        }

        try {
            return eval(condition);
        }
        catch (e) {
            throw "BadlyFormedCondition";
        }
    };

    _fetchSubNodes () {
        if (this._else_subNodes !== null) {
            return this._else_subNodes;
        }
        else if (this._elseif_conditions.length !== 0) {
            return this._elseif_subNodesList[this._elseif_subNodesList.length - 1];
        }
        else {
            return this._if_subNodes;
        }
    }

    parseLine(line) {
        var subNodes = this._fetchSubNodes();

        if (subNodes.length > 0) {
            // Fetch last node
            var lastNode = subNodes[subNodes.length - 1];

            // If the last node is opened forward the line
            if (lastNode.state === ShaderBuilder.STATE_OPENED) {
                lastNode.parseLine(line);
            }
            else {
                // Check if the given line is a command
                if (ShaderBuilder.commandRegex.test(line)) {

                    // Check if the command is node open command
                    if (ShaderBuilder.nodeStartRegex.test(line)) {
                        subNodes.push(this._createNewSubNode(line));
                    }
                    // Check if the command is else if command
                    else if (ShaderBuilder.elseIfRegex.test(line)) {
                        // If the else sub nodes are already defined this is an illegal else if
                        if (this._else_subNodes !== null) {
                            throw "UnexpectedElseIfCondition"
                        }

                        // Fetch condition and trim spaces
                        var condition = line.substring(8).replace(ShaderBuilder.prefixSuffixSpaceRegex, '');

                        // Check if the condition is correctly enclosed
                        if (!ShaderBuilder.validConditionShellRegex.test(condition)) {
                            throw "BadlyFormedCondition";
                        }

                        // Try to evaluate condition
                        ShaderBuilder.ConditionNode.evaluateCondition(condition, []);

                        // Add new else if
                        this._elseif_conditions.push(condition);
                        this._elseif_subNodesList.push([]);
                    }
                    // Check if the command is else command
                    else if (ShaderBuilder.elseRegex.test(line)) {
                        // Else command
                        this._else_subNodes = [];
                    }
                    // If the finish command is passed and the last node is closed
                    else if (ShaderBuilder.fiRegex.test(line) && lastNode._state === ShaderBuilder.STATE_CLOSED) {
                        this._state = ShaderBuilder.STATE_CLOSED;
                    }
                    else {
                        throw "UnexpectedBlockClosure";
                    }
                }
                else if (lastNode instanceof ShaderBuilder.CodeNode) {
                    // If the last node is code node and the line is not a command add current line to CodeNode
                    lastNode.parseLine(line);
                }
                else {
                    // Create new code node
                    subNodes.push(this._createNewSubNode(line));
                }
            }


        }
        else {
            // If the finish command is passed close the Condition Node
            if (ShaderBuilder.fiRegex.test(line)) {
                this._state = ShaderBuilder.STATE_CLOSED;
            }
            else {
                subNodes.push(this._createNewSubNode(line));
            }
        }
    }

    build(flags) {
        var extractionSubNodes = null;
        var shaderCode = "";

        // Check if the if condition results in true
        if (ShaderBuilder.ConditionNode.evaluateCondition(this._if_condition, flags)) {
            extractionSubNodes = this._if_subNodes;
        }
        else {
            // Check if any else if condition results in true
            for (var i = 0; i < this._elseif_conditions.length; i++) {
                if (ShaderBuilder.ConditionNode.evaluateCondition(this._elseif_conditions[i], flags)) {
                    extractionSubNodes = this._elseif_subNodesList[i];
                    break;
                }
            }

            // If none of the previous conditions evaluated to true, check for else
            if (extractionSubNodes === null && this._else_subNodes !== null) {
                extractionSubNodes = this._else_subNodes;
            }

            // Check if no condition evaluates to true
            if (extractionSubNodes === null) {
                return ""
            }
        }

        // Recurse in sub nodes whose condition evaluated to true
        for (var i = 0; i < extractionSubNodes.length; i++) {
            shaderCode += extractionSubNodes[i].build(flags);
        }

        return shaderCode;
    }
};

ShaderBuilder.LoopNode = class extends ShaderBuilder.Node {
    constructor(macro, from, to) {
        super();
        this._macro = macro;
        this._from = from;
        this._to = to;

        this._subNodes = [];
    }

    parseLine(line) {

    }
};


module.exports = ShaderBuilder.RootNode;