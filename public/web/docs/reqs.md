<div class="well" markdown="1">
Browser Requirements
===================
-------------------
 
In order to successfully run the Virtual World Framework, the following browser requirements must be met:

*   HTML5
*   ECMAScript5
*   Browser with WebGL enabled (for 3D content)
*	Browser with WebSocket enabled for multi-user functionality

The following browsers are recommended for use:

*   [Chrome 27+](https://www.google.com/intl/en/chrome/browser/)
*   [Firefox 21+](http://www.mozilla.org/en-US/firefox/new/)
*   [Opera 15+](http://www.opera.com/developer/next)
</div>

<div class="well" markdown="1">
VWF Compatibility Quirks
===================
-------------------

WINDOWS

*   At this time we have limited support for Internet Explorer 10. Please see our demos of Google Earth and Tile Puzzle 2D to see what can be done with the framework without WebGL.  

*   Internet Explorer 11 is rumored at this time to support WebGL, and we are constantly looking to the future of modern browsers to determine how well the Virtual World Framework is supported.

MACINTOSH OS X

*   Safari 5 is experiencing some issues at this time. We are working through multiple issues with Safari to get VWF and Safari compatibility completed.

*   Firefox 22 Proxy Support for firewalls requires that under Firefox -> Preferences -> Network -> Settings, you must select "Manual Proxy Configuration", and place a check in the "use this proxy server for all protocols" checkbox.

</div>

<div class="well" markdown="1">
Enabling WebGL
===================
-------------------

Use the following steps to verify that WebGL is enabled in your browser.

CHROME

*   Open a new tab and type *chrome://flags* in the address bar.
*   Search for WebGL.
*   Verify *Disable WebGL* is not enabled. 
*   If on an Android device, verify *Enable WebGL Android* is enabled.

FIREFOX

*   Open a new tab and type *about:config* in the address bar. 
*   Search for *WebGL.*
*   Verify *webgl.disabled* is set to false. Alternatively, set *webgl.force-enabled* to true.

</div>