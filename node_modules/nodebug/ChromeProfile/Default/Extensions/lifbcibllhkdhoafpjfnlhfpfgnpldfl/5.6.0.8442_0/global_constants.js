/**
 * @file
 * @brief Declares integer constants that corresponds to the type of the HTML node.
 * @details On some web-pages typeof(Node.ELEMENT_NODE) is 'undefined'. For example, see TBAR-1401.
 *          To prevent this issue we could define these constants in our namespace.
 *          Right now these constants are used through an instance of the Node object.
 *          But maybe in the future we will have to use them directly through the SkypeToolbars.Node interface.
 */

// create namespace
if (!window.SkypeToolbars)
{
    window.SkypeToolbars = {};
}

//
SkypeToolbars.npos  = -1;

// global result constants
SkypeToolbars.OK    = 0;
SkypeToolbars.EMPTY = 1;
SkypeToolbars.FAIL  = -1;


// constants of the Node interface (see TBAR-1401)
if (typeof(Node) == 'undefined' || typeof(Node.ELEMENT_NODE) == 'undefined')
{
    console.log("NodeType constants are not available.");
    console.log("document.location = " + document.location);
}

// see http://www.w3.org/TR/2000/WD-DOM-Level-1-20000929/level-one-core.html#ID-1950641247
// DOCUMENT_POSITION_xxx constants should be added also.
SkypeToolbars.Node =
{
    ELEMENT_NODE                :  1,
    ATTRIBUTE_NODE              :  2,
    TEXT_NODE                   :  3,
    CDATA_SECTION_NODE          :  4,
    ENTITY_REFERENCE_NODE       :  5,
    ENTITY_NODE                 :  6,
    PROCESSING_INSTRUCTION_NODE :  7,
    COMMENT_NODE                :  8,
    DOCUMENT_NODE               :  9,
    DOCUMENT_TYPE_NODE          : 10,
    DOCUMENT_FRAGMENT_NODE      : 11,
    NOTATION_NODE               : 12,

    DOCUMENT_POSITION_DISCONNECTED : 0x01,
    DOCUMENT_POSITION_PRECEDING    : 0x02,
    DOCUMENT_POSITION_FOLLOWING    : 0x04,
    DOCUMENT_POSITION_CONTAINS     : 0x08,
    DOCUMENT_POSITION_CONTAINED_BY : 0x10,
    DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC : 0x20

};

// redefine setAttribute function to emulate DOMAttrModified event
// https://bugs.webkit.org/show_bug.cgi?id=8191
if (!Element.prototype._SkypeToolbars_setAttribute)
{
    Element.prototype._SkypeToolbars_setAttribute = Element.prototype.setAttribute;
}
else
{
//    console.log("Element.prototype._SkypeToolbars_setAttribute alreadt assigned!!!");
}

Element.prototype.setAttribute = function(name, val)
{
    // save the previous value
    var prev = this.getAttribute(name);

    // call default handler
    this._SkypeToolbars_setAttribute(name, val);

    // send message
    var e = document.createEvent("MutationEvents");
    e.initMutationEvent("SkypeToolbars_DOMAttrModified", true, true, null, prev, val, name, (prev ? 1 : 2));
    this.dispatchEvent(e);
}


// create META to inform contentscript.js that this file is ready
document.head.appendChild(document.createElement('meta')).name = "global_constants.js";
