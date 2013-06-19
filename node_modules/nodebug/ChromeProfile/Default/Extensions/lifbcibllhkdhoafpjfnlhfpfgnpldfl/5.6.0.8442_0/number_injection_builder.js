/**
 * @file
 * @brief JS implementation of the phone number injection builder for Chrome browser.
 */

// create namespace
if (!window.SkypeToolbars)
{
	window.SkypeToolbars = {};
}

if (!SkypeToolbars.NumberInjectionBuilder)
{
	SkypeToolbars.NumberInjectionBuilder = {};

/*	initialized in C++ part
	SkypeToolbars.NumberInjectionBuilder.HIGHLIGHTING_MARK_BEGIN      = " begin_of_the_skype_highlighting";
	SkypeToolbars.NumberInjectionBuilder.HIGHLIGHTING_MARK_END        = "end_of_the_skype_highlighting";

	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_HIGHLIGHTING_MARK = "skype_pnh_mark";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_PRINT_CONTAINER   = "skype_pnh_print_container";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_CONTAINER         = "skype_pnh_container";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_LEFT_SPAN         = "skype_pnh_left_span";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_DROPART_SPAN      = "skype_pnh_dropart_span";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_DROPART_WOA_SPAN  = "skype_pnh_dropart_wo_arrow_span";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_DROPART_FLAG_SPAN = "skype_pnh_dropart_flag_span";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_TEXTAREA_SPAN     = "skype_pnh_textarea_span";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_TEXT_SPAN         = "skype_pnh_text_span";
	SkypeToolbars.NumberInjectionBuilder.CSS_NUMBER_RIGHT_SPAN        = "skype_pnh_right_span";
*/
}

SkypeToolbars.NumberInjectionBuilder.CreateInjectionElements = function(injectionRange,
                                                                        isFaxOnly,
                                                                        flagOffset,
                                                                        dropartTitle,
                                                                        highlightingClassName,
                                                                        highlightingTitle,
                                                                        numberInText,
                                                                        changeSink)
{
	var result = {};

	try
	{
		// ChangeSinkGuard
		changeSink.BeginInjection()

	    // 1) wrap phone number to make it invisible on screen
	    var printWrapperElement = document.createElement("SPAN").cloneNode(true);
	    printWrapperElement.className = this.CSS_NUMBER_PRINT_CONTAINER;

	    // try to use common 
	    try
	    {
	        injectionRange.surroundContents(printWrapperElement);
	    }
	    catch(e)
	    {
	        printWrapperElement.appendChild(injectionRange.extractContents());
	        injectionRange.insertNode(printWrapperElement);
	        injectionRange.selectNode(printWrapperElement);
	    }

	    // save created element
	    result.printWrapperElement = printWrapperElement;

	    // 2) create container element
	    var highlightContainerElement = document.createElement("SPAN");
	    highlightContainerElement.className = this.CSS_NUMBER_CONTAINER;
	    highlightContainerElement.dir = "ltr";
	    highlightContainerElement.tabIndex = "-1";

	    // save created element
	    result.containerElement = highlightContainerElement;


	    // 2.1) begin mark
	    var begin_mark_span = document.createElement("SPAN");
	    begin_mark_span.className = this.CSS_NUMBER_HIGHLIGHTING_MARK;
	    begin_mark_span.appendChild(document.createTextNode(this.HIGHLIGHTING_MARK_BEGIN));
	    highlightContainerElement.appendChild(begin_mark_span);

	    // keeps left part of highlighted number visible
	    highlightContainerElement.appendChild(document.createTextNode("\u00A0"));

	    // 2.2) highlighting style area
	    var highlightStyleElement = document.createElement("SPAN");
	    highlightStyleElement.className = highlightingClassName;
	    highlightStyleElement.dir = "ltr";
	    highlightStyleElement.setAttribute("skypeaction", "skype_dropdown");
	    highlightStyleElement.title = highlightingTitle;

	    // save created element
	    result.styleElement = highlightStyleElement;

	    // 2.2.1) create left part
	    var highlightLeftElement = document.createElement("SPAN");
	    highlightLeftElement.className = this.CSS_NUMBER_LEFT_SPAN;
	    highlightLeftElement.appendChild(document.createTextNode("\u00A0\u00A0"));
	    // show drop-down menu on the left 'round' part of the highlighted number
	    if (!isFaxOnly)
	    {
		    highlightLeftElement.setAttribute("skypeaction", "skype_dropdown");
		    highlightLeftElement.title = dropartTitle;
	    }
	    highlightStyleElement.appendChild(highlightLeftElement);

	    // 2.2.2) create dropart area
	    var highlightDropartElement = document.createElement("SPAN");
	    highlightDropartElement.className = (isFaxOnly ? this.CSS_NUMBER_DROPART_WOA_SPAN : this.CSS_NUMBER_DROPART_SPAN);
	    highlightDropartElement.setAttribute("skypeaction", "skype_dropdown");
	    if (!isFaxOnly)
	    {
	        highlightDropartElement.title = dropartTitle;
	    }
	    if (flagOffset.length == 0)
	    {
		    highlightDropartElement.style.display = "none !important;";
	    }

	    // save created element
	    result.dropartElement = highlightDropartElement;

	    // 2.2.2.1) create flag area
	    var highlightFlagElement = document.createElement("SPAN");
	    highlightFlagElement.className = this.CSS_NUMBER_DROPART_FLAG_SPAN;
	    highlightFlagElement.appendChild(document.createTextNode("\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"));
	    if (!isFaxOnly)
	    {
		    highlightFlagElement.setAttribute("skypeaction", "skype_dropdown");
	    }
	    highlightFlagElement.style.backgroundPosition = flagOffset + " !important;";
	    highlightDropartElement.appendChild(highlightFlagElement);

	    // save created element
	    result.flagElement = highlightFlagElement;

	    // 2.2.2.2) add space for arrow image
	    if (!isFaxOnly)
	    {
		    highlightDropartElement.appendChild(document.createTextNode("\u00A0\u00A0\u00A0"));
	    }

	    // 2.2.3) append dropart area to the highlighting style
	    highlightStyleElement.appendChild(highlightDropartElement);

	    // 2.2.4) create text part
	    var highlightTextAreaElement = document.createElement("SPAN");
	    highlightTextAreaElement.className = this.CSS_NUMBER_TEXTAREA_SPAN;
	    var text_span = document.createElement("SPAN");
	    text_span.className = this.CSS_NUMBER_TEXT_SPAN;
	    text_span.appendChild(document.createTextNode(numberInText));
	    highlightTextAreaElement.appendChild(text_span);
	    highlightStyleElement.appendChild(highlightTextAreaElement);

	    // save created element
	    result.textAreaElement = highlightTextAreaElement;

	    // 2.2.5) create right part
	    var highlightRightElement = document.createElement("SPAN");
	    highlightRightElement.className = this.CSS_NUMBER_RIGHT_SPAN;
	    highlightRightElement.appendChild(document.createTextNode("\u00A0\u00A0\u00A0\u00A0\u00A0"));
	    highlightStyleElement.appendChild(highlightRightElement);

	    // 2.3) append highlighting style area to the container element
	    highlightContainerElement.appendChild(highlightStyleElement);

	    // keeps left part of highlighted number visible
	    highlightContainerElement.appendChild(document.createTextNode("\u00A0"));

	    // 2.4) end mark
	    var end_mark_span = document.createElement("SPAN");
	    end_mark_span.className = this.CSS_NUMBER_HIGHLIGHTING_MARK;
	    end_mark_span.appendChild(document.createTextNode(this.HIGHLIGHTING_MARK_END));
	    highlightContainerElement.appendChild(end_mark_span);

	    // 3) append container to the DOM after 'print wrapper'
	    printWrapperElement.parentNode.insertBefore(highlightContainerElement, printWrapperElement.nextSibling);
	}
	catch(e)
	{
		console.log(e);
	}
	finally
	{
		// ChangeSinkGuard
		changeSink.EndInjection()
	}

	return result;
}

SkypeToolbars.NumberInjectionBuilder.RemoveElement = function(deep, node, range)
{
	try
	{
		if (!node)
		{
			return;
		}

		var parentNode = node.parentNode;
	
		if (!deep)
		{
			var tmpNode = null;
			while (node.firstChild) //while we can get firstChild property
			{
				tmpNode = parentNode.insertBefore(node.firstChild, node);
			}
			if (tmpNode && range)
			{
				range.setStartBefore(tmpNode);
			}
		}

		parentNode.removeChild(node); //remove element
	}
	catch(e)
	{
		console.log(e);
	}
}

SkypeToolbars.NumberInjectionBuilder.DestroyInjectionElements = function(textRange,
                                                                         printWrapperElement,
                                                                         containerElement,
                                                                         flagElement,
                                                                         dropartElement,
                                                                         textAreaElement,
                                                                         changeSink)
{
	try
	{
		// ChangeSinkGuard
		changeSink.BeginInjection()

		// 1) remove print wrapper element
		SkypeToolbars.NumberInjectionBuilder.RemoveElement(false, printWrapperElement, textRange);

		// 2) remove highlighting
		if (containerElement)
		{
			SkypeToolbars.NumberInjectionBuilder.RemoveElement(true, containerElement, null);
		}
		else
		{
			SkypeToolbars.NumberInjectionBuilder.RemoveElement(true, flagElement, null);
			SkypeToolbars.NumberInjectionBuilder.RemoveElement(true, dropartElement, null);
			SkypeToolbars.NumberInjectionBuilder.RemoveElement(true, textAreaElement, null);
		}
	}
	catch(e)
	{
		console.log(e);
	}
	finally
	{
		// ChangeSinkGuard
		changeSink.EndInjection()
	}
}


// create META to inform contentscript.js that this file is ready
document.head.appendChild(document.createElement('meta')).name = "number_injection_builder.js";
