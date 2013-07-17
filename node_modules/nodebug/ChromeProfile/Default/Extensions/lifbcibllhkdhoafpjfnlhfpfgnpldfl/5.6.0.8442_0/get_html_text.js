/**
 * @file
 * @brief Declares and implements all necessara objects and functions to get HTML text of the next N nodes from the current document position.
 */

// create namespace
if (!window.SkypeToolbars)
{
	window.SkypeToolbars = {};
}



//------------------------------------------------------------------------------



/**
 * @brief Document iterator listener that receives all notification during walking through the DOM tree.
 */
SkypeToolbars.GetHtmlTextListener = function(nodeCount)
{
	this.m_htmlText = "";
	this.m_amountOfNodesToStore = nodeCount;
}

SkypeToolbars.GetHtmlTextListener.prototype.CanContinue = function()
{
	return (this.m_amountOfNodesToStore > 0);
}

SkypeToolbars.GetHtmlTextListener.prototype.GetHtmlText = function()
{
	return this.m_htmlText;
}

/**
 * @brief Executes the 'opening tag was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.GetHtmlTextListener.prototype.OnTagOpened = function(node)
{
	this.AppendNodeName(node, true);
}

/**
 * @brief Executes the 'closing tag was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.GetHtmlTextListener.prototype.OnTagClosed = function(node)
{
	this.AppendNodeName(node, false);
}

/**
 * @brief Executes the 'text node was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.GetHtmlTextListener.prototype.OnTextNode = function(node, offsets)
{
	--this.m_amountOfNodesToStore;

	var nodeValue = node.nodeValue;

	// set valid value for end offset
	offsets.endOffset = (offsets.endOffset == -1 ? nodeValue.length : offsets.endOffset);

	this.m_htmlText     += nodeValue.substring(offsets.beginOffset, offsets.endOffset);

	// update begin offset
	offsets.beginOffset += offsets.endOffset - offsets.beginOffset;
}

/**
 * @brief Executes the 'comment was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.GetHtmlTextListener.prototype.OnCommentNode = function(node)
{
	--this.m_amountOfNodesToStore;
	this.m_htmlText += "<!--";
	this.m_htmlText += node.nodeValue;
	this.m_htmlText += "-->";
}

SkypeToolbars.GetHtmlTextListener.prototype.AppendNodeName = function(node, openTag)
{
	this.m_htmlText += (openTag ? "<" : "</");
	this.m_htmlText += node.nodeName;

	// attributes
	if (openTag)
	{
		var attributes = node.attributes;
		var length = attributes.length
		for(var i = 0; i < length; i++)
		{
			var attribute = attributes.item(i);
			this.m_htmlText += " " + attribute.name + "='" + attribute.value + "'";
		}
	}

	this.m_htmlText += ">";
}



//------------------------------------------------------------------------------



/**
 * @brief Retrieves the HTML text of the next @a nodeCount nodes from the given @a cursor position.
 * @param [in]  rootNode   The root node that used to set a search range if @a from or @a to point is @c null.
 * @param [in]  cursor     The current position from which we should start. If empty, then new cursor will be created and setted to the start of the @a node.
 * @param [in]  nodeCount  The amount of child nodes. 
 * @return Object with several attributes:
 *         resultCode  0 if everything is OK, otherwise an error code (1 or -1);
 *         text        the HTML text
 *         cursor      created cursor
 */
SkypeToolbars.GetHtmlText = function(rootNode, fromCursor, nodeCount)
{
	var result   = {resultCode:0, cursor:null, text:""};

	try
	{
		var toCursor = null; // it's realy empty. it will be created by DocumentIterator
		var listener = new SkypeToolbars.GetHtmlTextListener(nodeCount);
		var iterator = new SkypeToolbars.DocumentIterator(rootNode, fromCursor, toCursor, listener);

		result.resultCode = iterator.Iterate();
		result.text = listener.GetHtmlText();
		result.cursor = iterator.GetFromCursor();
	}
	catch(e)
	{
	    console.log('error: SkypeToolbars.GetHtmlText - ' + e);
	}

	return result;
}

// create META to inform contentscript.js that this file is ready
document.head.appendChild(document.createElement('meta')).name = "get_html_text.js";
