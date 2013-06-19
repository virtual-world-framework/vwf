/**
 * @file
 * @brief JS implementation of the IFindProxy interface that can find text in document.
 */

if (!window.SkypeToolbars)
{
	window.SkypeToolbars = {};
}



//------------------------------------------------------------------------------

/**
 * @brief Realisation of IFindFilter::LAST_LETTER for names.\ Name can't end with '@' (e-mail) or '\'' (John Smith's).
 */
SkypeToolbars.NameLLFilter = function()
{
}

SkypeToolbars.NameLLFilter.prototype.IsValid = function(toCheck)
{
	if (toCheck.charAt(0) == '@')
		return false;
	if (toCheck.charAt(0) == '\'')
		return false;
	return true;
}
//------------------------------------------------------------------------------



/**
 * @brief Document iterator listener that receives all notification during walking through the DOM tree.
 */
SkypeToolbars.FindProxyListener = function(findProxy, patText, findEntireWords, filter)
{
	this.m_canContinue = true;
	this.m_findProxy   = findProxy;
	this.m_finder      = new SkypeToolbars.StringFinder(patText, findEntireWords, filter);
}

SkypeToolbars.FindProxyListener.prototype.GetFinder = function()
{
	return this.m_finder;
}

SkypeToolbars.FindProxyListener.prototype.CanContinue = function()
{
	return this.m_canContinue && !this.m_finder.found();
}

/**
 * @brief Executes the 'opening tag was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.FindProxyListener.prototype.OnTagOpened = function(node)
{
	if (this.m_findProxy.ProcessTag(this.m_finder, node.ELEMENT_NODE, node)
		&& this.m_findProxy.ReallyFound(this.m_finder, 0, node).resulCode) //enter tag
	{
		this.m_canContinue = false;
	}
}

/**
 * @brief Executes the 'closing tag was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.FindProxyListener.prototype.OnTagClosed = function(node)
{
	// do the same as for opened tag
	this.OnTagOpened(node);
}

/**
 * @brief Executes the 'text node was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.FindProxyListener.prototype.OnTextNode = function(node, offsets)
{
	//get text of the TextNode
	var nodeValue = node.nodeValue;

	// set valid value for end offset
	offsets.endOffset = (offsets.endOffset == -1 ? nodeValue.length : offsets.endOffset);

	this.m_finder.AddText(nodeValue, nodeValue.length, node, offsets.beginOffset, offsets.endOffset);

	// update begin offset
	offsets.beginOffset += offsets.endOffset - offsets.beginOffset;

	if (this.m_finder.found() && this.m_findProxy.ReallyFound(this.m_finder, offsets.beginOffset, node).resultCode)
	{
		this.m_canContinue = false;
		offsets.beginOffset = this.m_finder.GetEndOffset();
	}
}

/**
 * @brief Executes the 'comment was found' action.
 * @param [in]  node  The current visible node in document.
 */
SkypeToolbars.FindProxyListener.prototype.OnCommentNode = function(node)
{
	// do nothing
}



//------------------------------------------------------------------------------


SkypeToolbars.CreateFindProxy = function()
{
  return new SkypeToolbars.FindProxy();
}


/**
 * @brief Constructor.
 * @param value       The string to find.
 * @param entireWords ???.
 */
SkypeToolbars.FindProxy = function()
{
/*
	m_lastLetterChecker; // Stores IFindFilter::LAST_LETTER filter.
*/
	this.m_findEntireWords = false;
	this.m_findBackwards = false;
	this.m_caseSensitive = false;
}

/**
 * @brief Adds find results filter.
 * @param [in] filter Filter to add.
 */
SkypeToolbars.FindProxy.prototype.AddFindFilter = function(filter)
{
	this.m_lastLetterChecker = filter;
}

/**
 * @brief Gets value of find backwards mode.
 * @return True, if find backwards mode enabled.
 */
SkypeToolbars.FindProxy.prototype.GetFindBackwards = function()
{
	return this.m_findBackwards;
}

/**
 * @brief Sets value of find backwards mode.
 * @param [in] findBackwards New value of find backwards mode.
 */
SkypeToolbars.FindProxy.prototype.SetFindBackwards = function(findBackwards)
{
	this.m_findBackwards = findBackwards;
}

/**
 * @brief Gets value of case sensitive find mode.
 * @return True, if case sensitive find mode enabled.
 */
SkypeToolbars.FindProxy.prototype.GetCaseSensitive = function()
{
	return this.m_caseSensitive;
}

/**
 * @brief Sets value of case sensitive find mode.
 * @param [in] caseSensitive New value of case sensitive find mode.
 */
SkypeToolbars.FindProxy.prototype.SetCaseSensitive = function(caseSensitive)
{
	this.m_caseSensitive = caseSensitive;
}

/**
 * @brief Gets value of find entire words mode.
 * @return True, if find entire words mode enabled.
 */
SkypeToolbars.FindProxy.prototype.GetFindEntireWords = function()
{
	return this.m_findEntireWords;
}

/**
 * @brief Sets value of find entire words mode.
 * @param [in] findEntireWords New value of find entire words mode.
 */
SkypeToolbars.FindProxy.prototype.SetFindEntireWords = function(findEntireWords)
{
	this.m_findEntireWords = findEntireWords;
}

/**
 * @brief Checks tag for no-break tags (i, b, span etc.).
 * @param [in] tagName Tag name to process.
 * @return True if node is element and tag is break.
 */
SkypeToolbars.FindProxy.prototype.IsBreakTag = function(tag)
{
	//skip tags
	if (tag.length == 0 ||
		tag == "SPAN" ||
		tag == "B" ||
		tag == "A" ||
		tag == "I" ||
		tag == "FONT" ||
		tag == "U" ||
		tag == "STRONG" ||
		tag == "SMALL" ||
		tag == "NOBR" ||
		tag == "EM")
	{
		return false;
	}
	//word break for other tags
	return true;
}

/// Processes tag enter/leave.
SkypeToolbars.FindProxy.prototype.ProcessTag = function(finder, type, node)
{
	if (!node || type != node.ELEMENT_NODE)
	{
		return false;
	}
	if (this.IsBreakTag(node.tagName))
	{
		return finder.AddBreak();
	}
	return false;
}

/// Just checks DOM before first character of found value if it was first in range.
/// Returns object with two fields: resultCode, and modified offset
SkypeToolbars.FindProxy.prototype.ReallyFound = function(finder, startOffset, cur)
{
	if (finder.IsBeginChecked() || !this.m_findEntireWords)
	{
		return {resultCode:true, startOffset:startOffset};
	}

	var cur = finder.GetBeginContext();
	while (cur)
	{
		var type = cur.nodeType;
		if (type == SkypeToolbars.Node.TEXT_NODE)
		{
			// TODO: check it
			if (cur != finder.GetBeginContext())
			{
				//get text for text node
				var str = cur.nodeValue;
				if (str.length)
				{
					if (finder.IsBreak(str.charAt(str.length - 1), false))
						return {resultCode:true, startOffset:startOffset};
					else
						break;
				}
			}
		}
		else if (type == SkypeToolbars.Node.ELEMENT_NODE) // try to get child and process end tag
		{
			if (this.IsBreakTag(cur.tagName))
			{
				return {resultCode:true, startOffset:startOffset};
			}
			//get last child
			var child = cur.lastChild;
			if (child)
			{
				cur = child;
				continue;
			}
		}
		// no childs, try to found sibling of sibling of parent.
		while (cur)
		{
			if (type == SkypeToolbars.Node.ELEMENT_NODE)
			{
				if (this.IsBreakTag(cur.tagName))
					return {resultCode:true, startOffset:startOffset};
			}

			var sibling = cur.previousSibling;
			if (sibling)
			{
				cur = sibling;
				break;
			}
			var parent = cur.parentNode;
			cur = parent;
// TODO: clarify this moment
//			if (cur && NS_FAILED(cur->GetNodeType(&type)))
//			{
//				return {resultCode:true, startOffset:startOffset};
//			}
		}
	}
	// reset finder
	// TODO: check it
	if (finder.GetBeginContext() == cur)
	{
		startOffset = finder.GetEndOffset();
	}
	finder.Reset();
	return {resultCode:false, startOffset:startOffset};
}


/**
 * Find some text in the current context. The implementation is
 * responsible for performing the find and highlighting the text.
 *
 * @param [in]  patText   The text to search for.
 * @param [in]  root      The root node that used to set a search range if @a from or @a to point is @c null.
 * @param [in]  from      The search start point. Can be @c null (in this case the start point is equivalent to the start of the @a root node)
 * @param [in]  to        The search end point. Can be @c null (in this case the end point is equivalent to the end of the @a root node)
 * @param [in]  filterId  -1 - do not use filters, 0 - use NameLLFilter
 * @return The object with three fields:
 *         resultCode  0 if successful;
 *         rabge       A range spanning the match that was found (or null);
 *         endCursor   A cursor plased at the end of the match that was found (or null).
 */
SkypeToolbars.FindProxy.prototype.Find = function(patText, rootNode, from, to, filterId)
{
	var result   = {resultCode:SkypeToolbars.FAIL, range:null, endCursor:null};

	try
	{
		var filter   = (filterId == -1 ? null : (filterId == 0 ? new SkypeToolbars.NameLLFilter() : null));
		var listener = new SkypeToolbars.FindProxyListener(this, patText, this.m_findEntireWords, filter);
		var iterator = new SkypeToolbars.DocumentIterator(rootNode, from, to, listener);

		result.resultCode = iterator.Iterate();

		if (result.resultCode != -1)
		{
			var finder = listener.GetFinder();
			var cursor = iterator.GetFromCursor();

			if (finder.IsWaitingForBreak() && !cursor)
				finder.AddBreak();

			if (finder.found())
			{
				var range  = document.createRange();

				var begin = finder.GetBeginContext();
				var end   = finder.GetEndContext();

				// if found range is equivalent to the whole content of the single Element, then
				// use SelectNodeContents for Element instead of SetStart/SetEnd for inner TextElement
				// to prevent empty text nodes after call of the range->SurroundContents function in highlighting.
				// for example, <span>+79131234567</span>
				//
				//<div><span id='id'>+79131234567</span></div>
				//<script>
				//  var range = document.createRange();
				//  range.selectNodeContents(document.getElementById('id').childNodes[0]);
				//  range.surroundContents(document.createElement('span'));
				//</script>
				//
				if (begin && begin == end &&
				    finder.GetBeginOffset() == 0 &&
				    begin.nodeType          == SkypeToolbars.Node.TEXT_NODE &&
				    begin.nodeValue.length  == finder.GetEndOffset())
				{
					range.selectNode(begin);
				}
				else
				{
					// common case - select from begin to end
					range.setStart(begin, finder.GetBeginOffset());
					range.setEnd(end, finder.GetEndOffset());
				}

				result.range  = range;
				result.endCursor = iterator.GetFromCursor();
			}
		}
	}
	catch(e)
	{
		console.log(e);
	}

	return result;
}

// create META to inform contentscript.js that this file is ready
document.head.appendChild(document.createElement('meta')).name = "find_proxy.js";
