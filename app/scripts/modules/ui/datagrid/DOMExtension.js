/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2012 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Contains diff method based on Javascript Diff Algorithm By John Resig
 * http://ejohn.org/files/jsdiff.js (released under the MIT license).
 */

/**
 * @param {string} tagName
 * @param {string=} customElementType
 * @return {!Element}
 * @suppress {checkTypes}
 * @suppressGlobalPropertiesCheck
 */
self.createElement = function(tagName, customElementType) {
    return document.createElement(tagName, {is: customElementType});
};

/**
 * @param {string} elementName
 * @param {string=} className
 * @param {string=} customElementType
 * @suppress {checkTypes}
 * @return {!Element}
 */
Document.prototype.createElementWithClass = function(elementName, className, customElementType) {
    const element = this.createElement(elementName, {is: customElementType});
    if (className) {
        element.className = className;
    }
    return element;
};

/**
 * @param {string} elementName
 * @param {string=} className
 * @param {string=} customElementType
 * @return {!Element}
 * @suppressGlobalPropertiesCheck
 */
self.createElementWithClass = function(elementName, className, customElementType) {
    return document.createElementWithClass(elementName, className, customElementType);
};


/**
 * @param {string} elementName
 * @param {string=} className
 * @param {string=} customElementType
 * @return {!Element}
 */
Element.prototype.createChild = function(elementName, className, customElementType) {
    const element = this.ownerDocument.createElementWithClass(elementName, className, customElementType);
    this.appendChild(element);
    return element;
};



Element.prototype.removeChildren = function() {
    if (this.firstChild) {
        this.textContent = '';
    }
};


/**
 * @return {!Window}
 */
Node.prototype.window = function() {
    return /** @type {!Window} */ (this.ownerDocument.defaultView);
};


/**
 * @param {!Array.<string>} nameArray
 * @return {?Node}
 */
Node.prototype.enclosingNodeOrSelfWithNodeNameInArray = function(nameArray) {
    for (let node = this; node && node !== this.ownerDocument; node = node.parentNodeOrShadowHost()) {
        for (let i = 0; i < nameArray.length; ++i) {
            if (node.nodeName.toLowerCase() === nameArray[i].toLowerCase()) {
                return node;
            }
        }
    }
    return null;
};

/**
 * @param {string} nodeName
 * @return {?Node}
 */
Node.prototype.enclosingNodeOrSelfWithNodeName = function(nodeName) {
    return this.enclosingNodeOrSelfWithNodeNameInArray([nodeName]);
};


/**
 * @return {?Node}
 */
Node.prototype.parentNodeOrShadowHost = function() {
    if (this.parentNode) {
        return this.parentNode;
    }
    if (this.nodeType === Node.DOCUMENT_FRAGMENT_NODE && this.host) {
        return this.host;
    }
    return null;
};

/**
 * @return {number}
 */
Element.prototype.totalOffsetLeft = function() {
    return this.totalOffset().left;
};

/**
 * @return {!{left: number, top: number}}
 */
Element.prototype.totalOffset = function() {
    const rect = this.getBoundingClientRect();
    return {left: rect.left, top: rect.top};
};


/**
 * @param {boolean=} preventDefault
 */
Event.prototype.consume = function(preventDefault) {
    this.stopImmediatePropagation();
    if (preventDefault) {
        this.preventDefault();
    }
    this.handled = true;
};

/**
 * @param {!Event} event
 * @return {boolean}
 */
self.isEnterKey = function(event) {
    // Check if in IME.
    return event.keyCode !== 229 && event.key === 'Enter';
};

/**
 * @return {boolean}
 */
Element.prototype.isScrolledToBottom = function() {
    // This code works only for 0-width border.
    // The scrollTop, clientHeight and scrollHeight are computed in double values internally.
    // However, they are exposed to javascript differently, each being either rounded (via
    // round, ceil or floor functions) or left intouch.
    // This adds up a total error up to 2.
    return Math.abs(this.scrollTop + this.clientHeight - this.scrollHeight) <= 2;
};


Object.defineProperty(Array.prototype, 'upperBound', {
    /**
     * Return index of the leftmost element that is greater
     * than the specimen object. If there's no such element (i.e. all
     * elements are smaller or equal to the specimen) returns right bound.
     * The function works for sorted array.
     * When specified, |left| (inclusive) and |right| (exclusive) indices
     * define the search window.
     *
     * @param {!T} object
     * @param {function(!T,!S):number=} comparator
     * @param {number=} left
     * @param {number=} right
     * @return {number}
     * @this {Array.<!S>}
     * @template T,S
     */
    value: function(object, comparator, left, right) {
        function defaultComparator(a, b) {
            return a < b ? -1 : (a > b ? 1 : 0);
        }
        comparator = comparator || defaultComparator;
        let l = left || 0;
        let r = right !== undefined ? right : this.length;
        while (l < r) {
            const m = (l + r) >> 1;
            if (comparator(object, this[m]) >= 0) {
                l = m + 1;
            } else {
                r = m;
            }
        }
        return r;
    },
    configurable: true
});

/**
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
Number.constrain = function(num, min, max) {
    if (num < min) {
        num = min;
    } else if (num > max) {
        num = max;
    }
    return num;
};
