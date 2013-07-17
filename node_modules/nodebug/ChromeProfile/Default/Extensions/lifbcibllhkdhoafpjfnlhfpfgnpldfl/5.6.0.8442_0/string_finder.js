/**
 * @file
 * @brief JS implementation of the IStringFinder interface that looks for some value in text fragments.
 */

if (!window.SkypeToolbars)
{
	window.SkypeToolbars = {};
}

/**
 * @brief Constructor.
 * @param value       The string to find.
 * @param entireWords ???.
 */
SkypeToolbars.StringFinder = function(value, entireWords, lastLetterFilter)
{
/*
	m_contexts;          // Contains contexts for curently found letters from value.
	m_value;             // Value to find.
	m_valuePos;          // Current position in value to check.
	m_beginOffset;       // Start offset of found value in first context.
	m_endOffset;         // End offset of found value in last context.
	m_last;              // Stores previous letter.
	m_resetTo;           // Value to set m_last during finder reset.
	m_beginSoftBreak;    // Where was soft break before first letter of found value.
	m_endSoftBreak;      // Where was soft break after last letter of found value.
	m_middleSoftBreak;   // Where was soft break in middle of found value.
	m_entireWords;       // Search for entire words.
	m_lastLetterFilter;  // Filter of next after alst letter.
*/

	this.npos = -1;
	this.SOFT_BREAK = '\0';
	this.NEWLINE_BREAK = '\n';

	this.m_value = value;
	this.m_entireWords = entireWords;
	this.m_lastLetterFilter = lastLetterFilter;

	this.ResetInternal();

	this.m_last = this.SOFT_BREAK;
	this.m_resetTo = this.SOFT_BREAK;
}

/**
 * @brief Resets finder.
 */
SkypeToolbars.StringFinder.prototype.Reset = function()
{
	this.m_last = this.m_resetTo;
	this.ResetInternal();
}

/// resets finder but not resets current context
SkypeToolbars.StringFinder.prototype.ResetInternal = function()
{
	this.m_contexts = [];
	this.m_valuePos = 0;
	this.m_beginOffset = this.npos;
	this.m_endOffset =  this.npos;
	this.m_beginSoftBreak = false;
	this.m_middleSoftBreak = false;
	this.m_endSoftBreak = false;
}

/**
 * @brief Gets offset of value's begin in begin context.
 * @return Offset of value if it was found, BrowserString::npos otherwise.
 */
SkypeToolbars.StringFinder.prototype.GetBeginOffset = function()
{
	return this.m_beginOffset;
}

/**
 * @brief Gets offset of value's end in end context.
 * @return Offset of value if it was found, BrowserString::npos otherwise.
 */
SkypeToolbars.StringFinder.prototype.GetEndOffset = function()
{
	return this.m_endOffset;
}

/**
 * @brief Gets begin context which contains first letter of value.
 * @return Begin context if it was found, throws exeption otherwise.
 */
SkypeToolbars.StringFinder.prototype.GetBeginContext = function()
{
	return this.m_contexts[0].context;
}

/**
 * @brief Gets end context which contains last letter of value.
 * @return End context if it was found, throws exeption otherwise.
 */
SkypeToolbars.StringFinder.prototype.GetEndContext = function()
{
	return this.m_contexts[this.m_contexts.length - 1].context;
}

/**
 * @brief Indicates that value was found but need one more break.
 * @return True, if last letter of value was found but where was no breaks after.
 */
SkypeToolbars.StringFinder.prototype.IsWaitingForBreak = function()
{
	return !this.found() && this.m_valuePos == this.m_value.length;
}

/**
 * @brief Indicates that value has no breaks in middle.
 */
SkypeToolbars.StringFinder.prototype.IsMiddleChecked = function()
{
	return !this.m_middleSoftBreak;
}

/**
 * @brief Indicates that value has break or whitespace before begin.
 */
SkypeToolbars.StringFinder.prototype.IsBeginChecked = function()
{
	return !this.m_beginSoftBreak;
}

/**
 * @brief Indicates that value has break or whitespace after end.
 */
SkypeToolbars.StringFinder.prototype.IsEndChecked = function()
{
	return !this.m_endSoftBreak;
}

/**
 * @brief Indicates that value was found or not.
 * @return True, if value was found.
 */
SkypeToolbars.StringFinder.prototype.found = function()
{
	return (this.m_endOffset != this.npos);
}

// Determines if a particular character is an alphanumeric character.
SkypeToolbars.StringFinder.prototype.IsAlnum = function(char)
{
	return (this.IsDigit(char) || this.IsAlpha(char));
}

/// Test for digits
SkypeToolbars.StringFinder.prototype.IsDigit = function(char)
{
	var charCode = char.charCodeAt(0);
   
	if((charCode > 47) && (charCode < 58))
	{
		return true;
	}
   
	return false;
}

/// Test for letters (only good up to char 127)
SkypeToolbars.StringFinder.prototype.IsAlpha = function(char)
{
	var charCode = char.charCodeAt(0);

	if((charCode > 64 && charCode <  91) || (charCode > 96 && charCode < 123))
	{
		return true;
	}

	return false;
}

/// checks if letter is break (non-digit non-alphabet and valid for filter symbol)
SkypeToolbars.StringFinder.prototype.IsBreak = function(ch, isLast)
{
	return ch == this.SOFT_BREAK || (!this.IsAlnum(ch)
	                                 && (!this.m_lastLetterFilter || this.m_lastLetterFilter.IsValid(ch)));

}

/// returns next letter from text or 0 if where is no (valid) letters left in text.
SkypeToolbars.StringFinder.prototype.NextChar = function(stringPtr)
{
	var res = {};
	if (stringPtr.from < stringPtr.to)
	{
		res.offset = 1;
		res.char = stringPtr.string.charAt(stringPtr.from);
		stringPtr.from++;
	}
	else
	{
		res.offset = 0;
		res.char = 0;
	}
	return res;
}

/**
 * @brief Adds new text fragment to finder.
 * @param [in] text Fragment's text.
 * @param [in] length Fragment's length.
 * @param [in] _Context _Context to save. Will be returned in Get*_Context methods.
 * @param [in] startOffset Posiotion in text (in symbols) from which we must start to search.
 * @param [in] endOffset End posiotion in text (in symbols). No search after endOffset.
 * @return True, if value was found.
 */
SkypeToolbars.StringFinder.prototype.AddText = function(text, length, context, startOffset, endOffset)
{
	if (this.found())
	{
		return false;
	}

	var valuePos    = this.m_valuePos;
	var stringPtr   = {from: 0, to: length, string: text};
	var offset      = 0;
	var nextCharRes = this.NextChar(stringPtr);
	var cur         = nextCharRes.char;
	var last_offset = nextCharRes.offset;

	// save last char of previous context
	if (cur)
	{
		this.m_resetTo = this.m_last;
	}

	while(cur)
	{
		if (offset >= startOffset)
		{
			var isEnd = (this.m_valuePos == this.m_value.length);


			if (isEnd && this.IsBreak(cur, true))
			{
				//found
				if (valuePos < this.m_valuePos)
				{
					this.m_endOffset = offset;
				}
				else
				{
					this.m_endOffset = this.m_contexts[this.m_contexts.length - 1].offset;
				}
				break;
			}
			else if (isEnd || this.m_value.charAt(this.m_valuePos) != cur)
			{
				if (this.m_valuePos != 0)
				{
					//reset finder
					valuePos = 0;
					this.ResetInternal();
				}
			}
			else if (this.m_valuePos == 0)
			{
				//begin of name
				if (!this.m_entireWords || this.IsBreak(this.m_last, false))
				{
					this.m_valuePos++;
					this.m_beginOffset = offset + (last_offset ? last_offset - 1 : 0);
					if (this.m_last == this.SOFT_BREAK)
					{
						this.m_beginSoftBreak = true;
					}
				}

			}
			else
			{
				this.m_valuePos++;
				// found for m_entireWords = false
				if (!this.m_entireWords && this.m_valuePos == this.m_value.length)
				{
					this.m_endOffset = offset + last_offset;
					break;
				}
			}
		}

		this.m_last = cur;
		offset += last_offset;
		if (endOffset != this.npos)
		{
			if (this.m_valuePos != this.m_value.length && offset >= endOffset)
			{
				break;
			}
		}
		nextCharRes = this.NextChar(stringPtr);
		cur         = nextCharRes.char;
		last_offset = nextCharRes.offset;
	}

	if (this.m_beginOffset != this.npos && valuePos < this.m_valuePos)
	{
		this.m_contexts.push({context:context, offset:offset});
	}

	return this.found();
};

/**
 * @brief Adds word break to finder.
 * @return True, if value was found.
 */
SkypeToolbars.StringFinder.prototype.AddBreak = function()
{
	if (this.found())
	{
		return false;
	}
	if (this.m_valuePos == this.m_value.length) // end of value was found
	{
		this.m_endOffset = this.m_contexts[this.m_contexts.length - 1].offset;
	}
	else if (this.m_valuePos != 0) // begin of value was found
	{
		this.ResetInternal();
	}
	this.m_last = this.NEWLINE_BREAK;
	this.m_resetTo = this.NEWLINE_BREAK;
	return this.found();
}

/**
 * @brief Adds word break to finder if no letters from value already found and do nothing otherwise.
 * @param [in] text Next fragment's text. First letter is used to determine if we need endSoftBreak.
 * @param [in] length Next fragment's length.
 * @return True, if value was found.
 */
SkypeToolbars.StringFinder.prototype.AddSoftBreak = function(text, length)
{
	if (found())
	{
		return false;
	}
	if (!this.IsBreak(this.m_last, false))
	{
		this.m_resetTo = this.SOFT_BREAK;
		this.m_last    = this.SOFT_BREAK;
	}

	if (this.m_beginOffset != this.npos) // begin of value found
	{
		if (this.m_valuePos == this.m_value.length) // end of value was found
		{
			if (text)
			{
				var stringPtr   = {from: 0, to: length, string: text};
				var nextCharRes = this.NextChar(stringPtr);
				var ch          = nextCharRes.char;
				var last_offset = nextCharRes.offset;
				if (!ch || !this.IsBreak(ch, true))
				{
					this.m_endSoftBreak = true;
				}
			}
			else
			{
				this.m_endSoftBreak = true;
			}
			this.m_endOffset = this.m_contexts[this.m_contexts.length - 1].offset;
		}
		else // in middle of value - don't break
		{
			this.m_middleSoftBreak = true;
		}
	}

	return this.found();
}

// create META to inform contentscript.js that this file is ready
document.head.appendChild(document.createElement('meta')).name = "string_finder.js";
