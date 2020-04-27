/*
 * Copyright (C) 2011 Google Inc.  All rights reserved.
 * Copyright (C) 2006, 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2007 Matt Lilek (pewtermoose@gmail.com).
 * Copyright (C) 2009 Joseph Pecoraro
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
 */

function _inspectPlatform() {
  let match = navigator.userAgent.match(/Windows NT/);
  if (match) {
    return 'windows';
  }
  match = navigator.userAgent.match(/Mac OS X/);
  if (match) {
    return 'mac';
  }
  return 'linux';
}

let _platform;

/**
 * @return {string}
 */
function platform() {
  if (!_platform) {
    _platform = _inspectPlatform();
  }
  return _platform;
}

let _isMac;

/**
 * @return {boolean}
 */
function isMac() {
  if (typeof _isMac === 'undefined') {
    _isMac = platform() === 'mac';
  }

  return _isMac;
}

let _isWin;

/**
 * @return {boolean}
 */
function isWin() {
  if (typeof _isWin === 'undefined') {
    _isWin = platform() === 'windows';
  }

  return _isWin;
}

/**
 * @param {!Element} element
 * @param {?function(!MouseEvent): boolean} elementDragStart
 * @param {function(!MouseEvent)} elementDrag
 * @param {?function(!MouseEvent)} elementDragEnd
 * @param {?string} cursor
 * @param {?string=} hoverCursor
 * @param {number=} startDelay
 */
function installDragHandle(
    element, elementDragStart, elementDrag, elementDragEnd, cursor, hoverCursor, startDelay) {
  /**
   * @param {!Event} event
   */
  function onMouseDown(event) {
    const dragHandler = new DragHandler();
    const dragStart = dragHandler.elementDragStart.bind(
        dragHandler, element, elementDragStart, elementDrag, elementDragEnd, cursor, event);
    if (startDelay) {
      startTimer = setTimeout(dragStart, startDelay);
    } else {
      dragStart();
    }
  }

  function onMouseUp() {
    if (startTimer) {
      clearTimeout(startTimer);
    }
    startTimer = null;
  }

  let startTimer;
  element.addEventListener('mousedown', onMouseDown, false);
  if (startDelay) {
    element.addEventListener('mouseup', onMouseUp, false);
  }
  if (hoverCursor !== null) {
    element.style.cursor = hoverCursor || cursor || '';
  }
}

/**
 * @param {!Element} targetElement
 * @param {?function(!MouseEvent):boolean} elementDragStart
 * @param {function(!MouseEvent)} elementDrag
 * @param {?function(!MouseEvent)} elementDragEnd
 * @param {?string} cursor
 * @param {!Event} event
 */
function elementDragStart(targetElement, elementDragStart, elementDrag, elementDragEnd, cursor, event) {
  const dragHandler = new DragHandler();
  dragHandler.elementDragStart(targetElement, elementDragStart, elementDrag, elementDragEnd, cursor, event);
}

/**
 * @unrestricted
 */
class DragHandler {
  constructor() {
    this._elementDragMove = this._elementDragMove.bind(this);
    this._elementDragEnd = this._elementDragEnd.bind(this);
    this._mouseOutWhileDragging = this._mouseOutWhileDragging.bind(this);
  }


  /**
   * @param {!Element} targetElement
   * @param {?function(!MouseEvent):boolean} elementDragStart
   * @param {function(!MouseEvent)} elementDrag
   * @param {?function(!MouseEvent)} elementDragEnd
   * @param {?string} cursor
   * @param {!Event} event
   */
  elementDragStart(targetElement, elementDragStart, elementDrag, elementDragEnd, cursor, event) {
    // Only drag upon left button. Right will likely cause a context menu. So will ctrl-click on mac.
    if (event.button || (isMac() && event.ctrlKey)) {
      return;
    }

    if (this._elementDraggingEventListener) {
      return;
    }

    if (elementDragStart && !elementDragStart(/** @type {!MouseEvent} */ (event))) {
      return;
    }

    const targetDocument = event.target.ownerDocument;
    this._elementDraggingEventListener = elementDrag;
    this._elementEndDraggingEventListener = elementDragEnd;
    console.assert(
        (DragHandler._documentForMouseOut || targetDocument) === targetDocument, 'Dragging on multiple documents.');
    DragHandler._documentForMouseOut = targetDocument;
    this._dragEventsTargetDocument = targetDocument;
    try {
      this._dragEventsTargetDocumentTop = targetDocument.defaultView.top.document;
    } catch (e) {
      this._dragEventsTargetDocumentTop = this._dragEventsTargetDocument;
    }

    targetDocument.addEventListener('mousemove', this._elementDragMove, true);
    targetDocument.addEventListener('mouseup', this._elementDragEnd, true);
    targetDocument.addEventListener('mouseout', this._mouseOutWhileDragging, true);
    if (targetDocument !== this._dragEventsTargetDocumentTop) {
      this._dragEventsTargetDocumentTop.addEventListener('mouseup', this._elementDragEnd, true);
    }

    if (typeof cursor === 'string') {
      this._restoreCursorAfterDrag = restoreCursor.bind(this, targetElement.style.cursor);
      targetElement.style.cursor = cursor;
      targetDocument.body.style.cursor = cursor;
    }
    /**
     * @param {string} oldCursor
     * @this {DragHandler}
     */
    function restoreCursor(oldCursor) {
      targetDocument.body.style.removeProperty('cursor');
      targetElement.style.cursor = oldCursor;
      this._restoreCursorAfterDrag = null;
    }
    event.preventDefault();
  }

  _mouseOutWhileDragging() {
    this._unregisterMouseOutWhileDragging();
  }

  _unregisterMouseOutWhileDragging() {
    if (!DragHandler._documentForMouseOut) {
      return;
    }
    DragHandler._documentForMouseOut.removeEventListener('mouseout', this._mouseOutWhileDragging, true);
  }

  _unregisterDragEvents() {
    if (!this._dragEventsTargetDocument) {
      return;
    }
    this._dragEventsTargetDocument.removeEventListener('mousemove', this._elementDragMove, true);
    this._dragEventsTargetDocument.removeEventListener('mouseup', this._elementDragEnd, true);
    if (this._dragEventsTargetDocument !== this._dragEventsTargetDocumentTop) {
      this._dragEventsTargetDocumentTop.removeEventListener('mouseup', this._elementDragEnd, true);
    }
    delete this._dragEventsTargetDocument;
    delete this._dragEventsTargetDocumentTop;
  }

  /**
   * @param {!Event} event
   */
  _elementDragMove(event) {
    if (event.buttons !== 1) {
      this._elementDragEnd(event);
      return;
    }
    if (this._elementDraggingEventListener(/** @type {!MouseEvent} */ (event))) {
      this._cancelDragEvents(event);
    }
  }

  /**
   * @param {!Event} event
   */
  _cancelDragEvents(event) {
    this._unregisterDragEvents();
    this._unregisterMouseOutWhileDragging();

    if (this._restoreCursorAfterDrag) {
      this._restoreCursorAfterDrag();
    }

    delete this._elementDraggingEventListener;
    delete this._elementEndDraggingEventListener;
  }

  /**
   * @param {!Event} event
   */
  _elementDragEnd(event) {
    const elementDragEnd = this._elementEndDraggingEventListener;
    this._cancelDragEvents(/** @type {!MouseEvent} */ (event));
    event.preventDefault();
    if (elementDragEnd) {
      elementDragEnd(/** @type {!MouseEvent} */ (event));
    }
  }
}

exports.installDragHandle = installDragHandle;
