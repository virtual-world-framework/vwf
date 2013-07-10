ADL Sandbox
===========

The ADL sandbox is an application based on the [Virtual World Framework](https://github.com/virtual-world-framework/vwf)
with multiplayer simulation and content authoring capabilities. The whole application runs in native Javascript,
so no plugins or installs are required.

Features
--------

* Multiplayer simulation space
* No-install client
* Fully scriptable behaviors on in-world objects
* Manipulation and deformation tools similar to Second Life
* Integration with the 3D Repository for asset streaming
* Native in-browser audio/video chat (for capable browsers)

Requirements (Server)
---------------------

* Node.js v0.8 or newer
* Minimal CPU and memory resources

Requirements (Client)
---------------------

The simulation runs in the native browser, so in order for the app to run correctly your browser
must have support for the following technologies:

* WebGL
* ECMAScript5
* WebSockets
* WebRTC (for audio/video calls)

Sandbox has been tested and verified to run on the latest stable Chrome and Firefox, though Firefox
stable does not support video calls (Firefox beta/nightly does). The Sandbox does not run in Internet
Explorer 10 or less due to the lack of WebGL support, though some degree of support will be included
in Internet Explorer 11 (not tested as of this writing).

In addition, the system must meet the minimum hardware requirements:

* Dual-core processor
* 2GB RAM

More complex scenes will be more demanding on clients, so these specs may not be sufficient for
some simulations. Your mileage may vary.

Installation (Server)
---------------------

1. Clone this repository from Github (https://github.com/adlnet/Sandbox)
2. Install Node.js (optional)

	Note: A Node.js v0.8.3 Windows binary is included with the repository, and it is verified to work.
	Feel free to use this binary instead of installing all of Node.js.

3. Create data directory somewhere on the drive (default: C:\VWFData)

	The directory should have the following structure:

	    (datadir)
		> GlobalAssets
		> Logs
		> Profiles
		> States
		> Textures
		> Thumbnails

4. Run the server: > node app.js -d &lt;datadir> -p &lt;port>


