'use strict';

/**
 * Creates a parser that simplifies complex objects by removing non-serializable functions and complex instances.
 * @constructor
 */
function ObjectParser() {
}

/**
 * Checks whether a given object is a simple/plain object.
 * @param {Object} object - input object, must not be null
 * @returns {boolean} true if simple object, false else
 * @private
 */
ObjectParser.prototype._isSimpleObject = function (object) {
    // Check if toString output indicates object
    if (typeof object.toString === 'function' && object.toString() !== '[object Object]') {
        return false;
    }
    var proto = object.prototype;
    // Check if prototype is missing
    if (!proto) {
        return true;
    }
    // Check if constructed by a global object function
    var Ctor = proto.hasOwnProperty('constructor') && proto.constructor;
    return typeof Ctor === 'function' && Ctor.toString() === 'function() {}';
};

/**
 * Deep copies an object.
 * @param {Object} object - the object, must not be null
 * @param {Array} predecessors - list of predecessors to detect circular references
 * @returns {Array|Object} the deep copied object
 * @private
 */
ObjectParser.prototype._deepCopy = function (object, predecessors) {
    this.visitedObjects.push(object);
    var targetObject = Array.isArray(object) ? [] : {};
    this.createdObjects.push(targetObject);
    var currentPredecessors = predecessors.slice(0);
    currentPredecessors.push(object);
    for (var sKey in object) {
        // Ignore undefined and functions (similar to JSON.stringify)
        if (object[sKey] !== undefined && typeof object[sKey] !== 'function') {
            // Recursive call
            targetObject[sKey] = this._parseObject(object[sKey], currentPredecessors);
        }
    }
    return targetObject;
};

/**
 * Parses an object recursively.
 * @param {*} object - the object to parse, can be a simple type
 * @param {Array} predecessors - list of predecessors to detect circular references
 * @returns {*} returns the parsed object
 * @private
 */
ObjectParser.prototype._parseObject = function (object, predecessors) {
    // Resolve simple type
    if (object === null || typeof object === 'number' || typeof object === 'boolean' || typeof object === 'string') {
        return object;
    }
    // Ignore complex types
    if (!Array.isArray(object) && !this._isSimpleObject(object)) {
        return '<OBJECT>';
    }
    // Ignore & mark circular reference
    if (predecessors.indexOf(object) !== -1) {
        return '<CIRCULAR REFERENCE>';
    }
    // Resolve simple reference
    var referenceIndex = this.visitedObjects.indexOf(object);
    if (referenceIndex !== -1) {
        return this.createdObjects[referenceIndex];
    }
    // Handle object by deep copy
    return this._deepCopy(object, predecessors);
};

/**
 * Parses given object into a JSON object removing all functions and remove circular references.
 * @param {Object} object - input object
 * @returns {Object} JSON object
 */
ObjectParser.prototype.parse = function (object) {
    this.visitedObjects = [];
    this.createdObjects = [];
    return this._parseObject(object, []);
};

var messageParser = new ObjectParser();

module.exports = {
    /**
     * Send message to content script.
     * @param {Object} object
     */
    send: function (object) {
        var message = {
            detail: messageParser.parse(object)
        };

        document.dispatchEvent(new CustomEvent('ui5-communication-with-content-script', message));
    }
};
