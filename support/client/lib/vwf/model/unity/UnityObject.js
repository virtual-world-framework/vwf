/* UnityObject */

if (typeof unityObject == "undefined")
var unityObject = function() {
	var
	pluginName = "Unity Player",
	pluginMimeType = "application/vnd.unity",
	win = window,
	doc = document,
	nav = navigator,
	domLoaded = false,
	domLoadEvents = [],
	embeddedObjects = [],
	listeners = [],
	styleSheet = null,
	styleSheetMedia = null,
	autoHideShow = true,
	fullSizeMissing = true,
	baseUrl = "http://webplayer.unity3d.com/download_webplayer-3.x/",
	fullInstall = false,
	autoInstall = false,
	enableJava = true,
	triedJavaCookie = "_unity_triedjava",
	triedJava = getCookie(triedJavaCookie),
	applets = [],
	enableClickOnce = true,
	addedClickOnce = false,
	enableAnalytics = true,
	analyticsLoaded = false,
	currentStatus = "unknown",
	
	// contains browser and platform properties
	ua = function() {
		var a = nav.userAgent, p = nav.platform;
		var ua = {
			w3 : typeof doc.getElementById != "undefined" && typeof doc.getElementsByTagName != "undefined" && typeof doc.createElement != "undefined",
			win : p ? /win/i.test(p) : /win/i.test(a),
			mac : p ? /mac/i.test(p) : /mac/i.test(a),
			ie : /msie/i.test(a) ? parseFloat(a.replace(/^.*msie ([0-9]+(\.[0-9]+)?).*$/i, "$1")) : false,
			ff : /firefox/i.test(a),
			ch : /chrome/i.test(a),
			sf : /safari/i.test(a),
			wk : /webkit/i.test(a) ? parseFloat(a.replace(/^.*webkit\/(\d+(\.\d+)?).*$/i, "$1")) : false,
			x64 : /win64/i.test(a) && /x64/i.test(a)
		};
		// get base url
		var s = doc.getElementsByTagName("script");
		for (var i = 0; i < s.length; ++i) {
			var m = s[i].src.match(/^(.*)3\.0\/uo\/UnityObject\.js$/i);
			if (m) {
				baseUrl = m[1];
				break;
			}
		}
		// compares two versions
		function compareVersions(v1, v2) {
			for (var i = 0; i < Math.max(v1.length, v2.length); ++i) {
				var n1 = (i < v1.length) ? new Number(v1[i]) : 0;
				var n2 = (i < v2.length) ? new Number(v2[i]) : 0;
				if (n1 < n2) return -1;
				if (n1 > n2) return 1;
			}
			return 0;
		};
		// detect java
		ua.java = function() {
			if (nav.javaEnabled()) {
				var wj = (ua.win && (ua.ff || ua.ch));
				var mj = false;//(ua.mac && (ua.ff || ua.ch || ua.sf));	// disable java on os x for 3.2 rc3
				if (wj || mj) {
					if (typeof nav.mimeTypes != "undefined") {
						var rv = wj ? [1, 6, 0, 12] : [1, 4, 2, 0];
						for (var i = 0; i < nav.mimeTypes.length; ++i) {
							if (nav.mimeTypes[i].enabledPlugin) {
								var m = nav.mimeTypes[i].type.match(/^application\/x-java-applet;(?:jpi-)?version=(\d+)(?:\.(\d+)(?:\.(\d+)(?:_(\d+))?)?)?$/);
								if (m != null) {
									if (compareVersions(rv, m.slice(1)) <= 0) {
										return true;
									}
								}
							}
						}
					}
				}
				else if (ua.win && ua.ie) {
					if (typeof ActiveXObject != "undefined") {
						function axTest(v) {
							try {
								return new ActiveXObject("JavaWebStart.isInstalled." + v + ".0") != null;
							}
							catch (ex) {
								return false;
							}
						};
						function axTest2(v) {
							try {
								return new ActiveXObject("JavaPlugin.160_" + v) != null;
							}
							catch (ex) {
								return false;
							}
						};
						if (axTest("1.7.0")) {
							return true;
						}
						if (ua.ie >= 8) {
							if (axTest("1.6.0")) {
								// make sure it's 1.6.0.12 or newer. increment 50 to a larger value if 1.6.0.50 is released
								for (var i = 12; i <= 50; ++i) {
									if (axTest2(i)) {
										return true;
									}
								}
								return false;
							}
						}
						else {
							return axTest("1.6.0") || axTest("1.5.0") || axTest("1.4.2");
						}
					}
				}
			}
			return false;
		}();
		// detect clickonce
		ua.co = function() {
			if (ua.win && ua.ie) {
				var av = a.match(/\.NET CLR [0-9.]+/g);
				if (av != null) {
					function getVersion(v) {
						return v.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/i).slice(1);
					}
					var rv = [3, 5, 0];
					for (var i = 0; i < av.length; ++i) {
						if (compareVersions(rv, getVersion(av[i])) <= 0) {
							return true;
						}
					}
				}
			}
			return false;
		}();
		return ua;
	}(),

	// executes dom load events as soon as the dom of a web page is available
	onDomLoad = function() {
		if (!ua.w3) {
			return;
		}
		if ((typeof doc.readyState != "undefined" && doc.readyState == "complete") || (typeof doc.readyState == "undefined" && (doc.getElementsByTagName("body")[0] || doc.body))) {
			callDomLoadEvents();
		}
		if (domLoaded) {
			return;
		}
		if (typeof doc.addEventListener != "undefined") {
			doc.addEventListener("DOMContentLoaded", callDomLoadEvents, false);
		}
		if (ua.win && ua.ie) {
			doc.attachEvent("onreadystatechange", function() {
				if (doc.readyState == "complete") {
					doc.detachEvent("onreadystatechange", arguments.callee);
					callDomLoadEvents();
				}
			});
			if (win == top) {
				(function() {
					if (domLoaded) {
						return;
					}
					// http://javascript.nwbox.com/IEContentLoaded/
					try {
						doc.documentElement.doScroll("left");
					}
					catch (ex) {
						setTimeout(arguments.callee, 10);
						return;
					}
					callDomLoadEvents();
				})();
			}
		}
		if (ua.wk) {
			(function() {
				if (domLoaded) {
					return;
				}
				if (!/loaded|complete/.test(doc.readyState)) {
					setTimeout(arguments.callee, 10);
					return;
				}
				callDomLoadEvents();
			})();
		}
		addLoadEvent(callDomLoadEvents);
	}();
	
	// get cookie value
	function getCookie(name) {
		var e = new RegExp(escape(name) + "=([^;]+)");
		if (e.test(doc.cookie + ";")) {
			e.exec(doc.cookie + ";");
			return RegExp.$1;
		}
		return false;
	}
	
	// sets session cookie
	function setSessionCookie(name, value) {
		document.cookie = escape(name) + "=" + escape(value) + "; path=/";
	}
	
	// executes a function as soon as the dom of a web page is available
	function addDomLoadEvent(event) {
		if (domLoaded) {
			event();
		}
		else {
			domLoadEvents[domLoadEvents.length] = event;
		}
	}
	
	// executes pending dom load events
	function callDomLoadEvents() {
		if (domLoaded) {
			return;
		}
		// make sure dom has been loaded
		try {
			var b = doc.getElementsByTagName("body")[0];
			var c = b.appendChild(doc.createElement("span"));
			b.removeChild(c);
		}
		catch (ex) {
			return;
		}
		domLoaded = true;
		for (var i = 0; i < domLoadEvents.length; ++i) {
			domLoadEvents[i]();
		}
	}
	
	// executes a function on the window onload event
	function addLoadEvent(event) {
		// http://brothercake.com/site/resources/scripts/onload/
		if (typeof win.addEventListener != "undefined") {
			win.addEventListener("load", event, false);
		}
		else if (typeof doc.addEventListener != "undefined") {
			doc.addEventListener("load", event, false);
		}
		else if (typeof win.attachEvent != "undefined") {
			addListener(win, "onload", event);
		}
		else if (typeof window.onload == "function") {
			var previous = window.onload;
			win.onload = function() {
				previous();
				event();
			}
		}
		else {
			win.onload = event;
		}
	}

	// attaches ie event
	function addListener(target, type, event) {
		target.attachEvent(type, event);
		listeners[listeners.length] = { target : target, type : type, event : event };
	}

	// tracks installation status
	function trackStatus(status) {
		if (!enableAnalytics) {
			return;
		}
		var _gaq = window["_gaq"] = window["_gaq"] || [];
		if (!analyticsLoaded) {
			_gaq.push(["unity._setAccount", "UA-16068464-10"]);
			// $(RevisionPlaceholder)
		}
		_gaq.push(["unity._trackPageview", "/webplayer/install/" + status]);
		if (!analyticsLoaded) {
			var ss = doc.getElementsByTagName("script");
			for (var i = 0; i < ss.length; ++i) {
				if (ss[i].src.match(/^(.*)\.google-analytics.com\/ga\.js$/i)) {
					analyticsLoaded = true;
					break;
				}
			}
			if (!analyticsLoaded) {
				analyticsLoaded = true;
				var ga = doc.createElement("script");
				ga.type = "text/javascript";
				ga.async = true;
				ga.src = ("https:" == doc.location.protocol ? "https://ssl" : "http://www") + ".google-analytics.com/ga.js";
				var s = document.getElementsByTagName("script")[0];
				s.parentNode.insertBefore(ga, s);
			}
		}
	}

	// updates installation status
	function updateStatus(status) {
		if (currentStatus == "unknown" && status == "missing") {
			trackStatus(status);
		}
		else if (status == "installed") {
			if (currentStatus == "missing") {
				trackStatus(status);
				currentStatus = "updating";
			}
			return;
		}
		else if (currentStatus == "updating" && status == "running") {
			trackStatus(status);
		}
		currentStatus = status;
	}
	
	// converts unity version to number (used for version comparison)
	function getNumericUnityVersion(version) {
		var result = 0;
		if (version) {
			var m = version.toLowerCase().match(/^(\d+)(?:\.(\d+)(?:\.(\d+)([dabfr])?(\d+)?)?)?$/);
			if (m && m[1]) {
				var major = m[1];
				var minor = m[2] ? m[2] : 0;
				var fix = m[3] ? m[3] : 0;
				var type = m[4] ? m[4] : 'r';
				var release = m[5] ? m[5] : 0;
				result |= ((major / 10) % 10) << 28;
				result |= (major % 10) << 24;
				result |= (minor % 10) << 20;
				result |= (fix % 10) << 16;
				result |= { d: 2 << 12, a: 4 << 12, b: 6 << 12, f: 8 << 12, r: 8 << 12 }[type];
				result |= ((release / 100) % 10) << 8;
				result |= ((release / 10) % 10) << 4;
				result |= (release % 10);
			}
		}
		return result;
	}
	
	// gets plugin version (non-ie)
	function getPluginVersion(callback) {
		var b = doc.getElementsByTagName("body")[0];
		var ue = doc.createElement("object");
		if (b && ue) {
			ue.setAttribute("type", pluginMimeType);
			ue.style.visibility = "hidden";
			b.appendChild(ue);
			var count = 0;
			(function() {
				if (typeof ue.GetPluginVersion == "undefined") {
					if (count++ < 10) {
						setTimeout(arguments.callee, 10);
					}
					else {
						b.removeChild(ue);
						callback(null);
					}
				}
				else {
					var v = ue.GetPluginVersion();
					b.removeChild(ue);
					callback(v);
				}
			})();
		}
		else {
			callback(null);
		}
	}

	// detects unity web player.
	// callback accepts single parameter containing "missing", "x64", "broken" or "installed" value
	function detectUnity(callback) {
		var status = "missing";
		if (ua.win && ua.ie && ua.x64) {
			status = "x64";
			updateStatus(status);
			callback(status);
			return;
		}
		nav.plugins.refresh();
		if (typeof nav.plugins != "undefined" && nav.plugins[pluginName] && typeof nav.mimeTypes != "undefined" && nav.mimeTypes[pluginMimeType] && nav.mimeTypes[pluginMimeType].enabledPlugin) {
			status = "installed";
			// make sure web player is compatible with 64-bit safari
			if (ua.sf && /Mac OS X 10_6/.test(nav.appVersion)) {
				getPluginVersion(function(version) {
					if (!version) {
						status = "broken";
					}
					updateStatus(status);
					callback(status);
				});
				return;
			}
			// older versions have issues on chrome
			else if (ua.mac && ua.ch) {
				getPluginVersion(function(version) {
					if (getNumericUnityVersion(version) <= getNumericUnityVersion("2.6.1f3")) {
						status = "broken";
					}
					updateStatus(status);
					callback(status);
				});
				return;
			}
		}
		else if (typeof win.ActiveXObject != "undefined") {
			try {
				var pv = new ActiveXObject("UnityWebPlayer.UnityWebPlayer.1").GetPluginVersion();
				status = "installed";
				// 2.5.0 auto update has issues on vista and later
				if (pv == "2.5.0f5") {
					var m = /Windows NT \d+\.\d+/.exec(nav.userAgent);
					if (m && m.length > 0) {
						var wv = parseFloat(m[0].split(' ')[2]);
						if (wv >= 6) {
							status = "broken";
						}
					}
				}
			}
			catch (ex) {}
		}
		updateStatus(status);
		callback(status);
	}
	
	// appends px to the value if it's a plain number
	function appendPX(value) {
		if (/^[-+]?[0-9]+$/.test(value)) {
			value += "px";
		}
		return value;
	}
	
	// replaces dom element identified by id with web player.
	// callback accepts same parameter as embedUnity function
	function createUnity(id, attributes, params, callback) {
		var re = doc.getElementById(id);
		if (!re) {
			if (callback) {
				callback({ success : false, id : id });
			}
			return;
		}
		if (ua.win && ua.ie) {
			// ie, dom and object element do not mix & match
			var at = "";
			for (var i in attributes) {
				if (attributes[i] != Object.prototype[i]) {
					if (i.toLowerCase() == "styleclass") {
						at += ' class="' + attributes[i] + '"';
					}
					else if (i.toLowerCase() != "classid") {
						at += ' ' + i + '="' + attributes[i] + '"';
					}
				}
			}
			var pt = "";
			for (var i in params) {
				if (params[i] != Object.prototype[i]) {
					if (i.toLowerCase() != "classid") {
						pt += '<param name="' + i + '" value="' + params[i] + '" />';
					}
				}
			}
			re.outerHTML = '<div id="' + id + '" style="width: ' + appendPX(attributes["width"]) + '; height: ' + appendPX(attributes["height"]) + '; visibility: hidden;"><object classid="clsid:444785F1-DE89-4295-863A-D46C3A781394" style="display: block; width: 100%; height: 100%;"' + at + '>' + pt + '</object></div>';
			embeddedObjects[embeddedObjects.length] = id;
		}
		else {
			var ue = doc.createElement("div");
			ue.setAttribute("id", id);
			ue.style.width = appendPX(attributes["width"]);
			ue.style.height = appendPX(attributes["height"]);
			ue.style.visibility = "hidden";
			var ee = doc.createElement("embed");
			ee.setAttribute("type", pluginMimeType);
			ee.style.display = "block";
			ee.style.width = "100%";
			ee.style.height= "100%";
			for (var i in attributes) {
				if (attributes[i] != Object.prototype[i]) {
					if (i.toLowerCase() == "styleclass") {
						ee.setAttribute("class", attributes[i]);
					}
					else if (i.toLowerCase() != "classid") {
						ee.setAttribute(i, attributes[i]);
					}
				}
			}
			for (var i in params) {
				if (params[i] != Object.prototype[i]) {
					if (i.toLowerCase() != "classid") {
						ee.setAttribute(i, params[i]);
					}
				}
			}
			ue.appendChild(ee);
			re.parentNode.replaceChild(ue, re);
		}
		getObjectById(id, function(obj) {
			if (obj) {
				obj.parentNode.style.visibility = "visible";
				obj.focus();
			}
			else {
				removeUnity(id);
			}
			if (callback) {
			    callback({ success : Boolean(obj), id : id, ref : obj });
            }
		});
	}
	
	// returns css color if found, null otherwise
	function getColor(params, name) {
		for (var i in params) {
			if (i.toLowerCase() == name) {
				var color = params[i];
				if (/^((?:[\da-f]){2}){3,4}$/i.test(color)) {
					return color.substr(0, 6);
				}
				break;
			}
		}
		return null;
	}
	
	// replaces dom element identified by id with error message.
	// callback accepts same parameter as embedUnity function
	function createInvalidUnity(id, attributes, params, callback, message) {
		var re = doc.getElementById(id);
		if (re) {
			var width = appendPX(attributes["width"]);
			var height = appendPX(attributes["height"]);
			var bg = getColor(params, "backgroundcolor");
			var tc = getColor(params, "textcolor");
			var bc = getColor(params, "bordercolor");
			if (ua.win && ua.ie) {
				var ust = "font-family: Verdana; font-size: 12px; text-align: center;";
				if (bg) {
					ust += " background-color: #" + bg + ";";
				}
				if (tc) {
					ust += " color: #" + tc + ";";
				}
				if (bc) {
					ust += " border: 1px solid #" + bc + ";";
				}
				var ast = "";
				if (fullSizeMissing) {
					ust += " width: " + width + "; height: " +  height + ";";
					ast = "width: " + width + "; line-height: " + height + ";";
				}
				re.outerHTML = '<div id="' + id + '" style="' + ust + '"><span style="' + ast + '">' + message + '</span></div>';
			}
			// this branch is not used at the moment
			/*else {
				var ue = doc.createElement("div");
				ue.setAttribute("id", id);
				if (bg) {
					ue.style.backgroundColor = "#" + bg;
				}
				if (tc) {
					ue.style.color = "#" + tc;
				}
				if (bc) {
					ue.style.border = "1px solid #" + bc;
				}
				ue.style.fontFamily = "Verdana";
				ue.style.fontSize = "12px";
				ue.style.textAlign = "center";
				var ae = doc.createElement("span");
				ae.innerHTML = message;
				if (fullSizeMissing) {
					ue.style.width = ae.style.width = width;
					ue.style.height = ae.style.lineHeight = height;
				}
				ue.appendChild(ae);
				re.parentNode.replaceChild(ue, re);
			}*/
		}
		if (callback) {
			callback({ success : false, id : id });
		}
	}
	
	// replaces dom element identified by id with unity banner.
	// callback accepts same parameter as embedUnity function
	function createMissingUnity(id, attributes, params, callback, broken) {
		var re = doc.getElementById(id);
		if (re) {
			var type = "standard";
			if (enableJava && ua.java && !triedJava && !getCookie(triedJavaCookie)) {
				applets[id] = {
					attributes : attributes,
					params : params,
					callback : callback,
					broken : broken
				};
				type = "java";
				if (autoInstall) {
					if (callback) {
						callback({ success : false, id : id });
					}
					trackStatus("installing?type=" + type);
					doJavaInstall(id);
					return;
				}
				else {
					var url = "javascript:unityObject.doJavaInstall('" + id + "');";
				}
			}
			else if (enableClickOnce && ua.co) {
				var url = baseUrl + "3.0/co/UnityWebPlayer.application?installer=" + encodeURIComponent(baseUrl + getWinInstall());
				type = "clickonce";
			}
			else if (ua.win) {
				var url = baseUrl + getWinInstall();
			}
			else if (nav.platform == "MacIntel") {
				var url = baseUrl + (fullInstall ? "webplayer-i386.dmg" : "webplayer-mini.dmg");
			}
			else if (nav.platform == "MacPPC") {
				var url = baseUrl + (fullInstall ? "webplayer-ppc.dmg" : "webplayer-mini.dmg");
			}
			else {
				var url = 'javascript:window.open("http://unity3d.com/webplayer/");';
			}
			if (broken) {
				var msg = "Unity Web Player. Install now! Restart your browser after install.";
				var img = "http://webplayer.unity3d.com/installation/getunityrestart.png";
				var imgWidth = 190;
				var imgHeight = 75;
			}
			else {
				var msg = "Unity Web Player. Install now!";
				var img = "http://webplayer.unity3d.com/installation/getunity.png";
				var imgWidth = 193;
				var imgHeight = 63;
			}
			var width = attributes["width"] || imgWidth;
			var height = attributes["height"] || imgHeight;
			var imageOffset = appendPX(-parseInt(imgHeight / 2));
			var onclick = "unityObject.trackStatus('installing?type=" + type + "');";
			var bg = getColor(params, "backgroundcolor");
			var tc = getColor(params, "textcolor");
			var bc = getColor(params, "bordercolor");
			if (ua.win && ua.ie) {
				var it = '<img alt="' + msg + '" src="' + img + '" width="' + imgWidth + '" height="' + imgHeight + '" style="border-width: 0px;" />';
				var at = '<a href="' + url + '" title="' + msg + '" onclick="' + onclick + '"';
				if (fullSizeMissing) {
					at += ' style="display: block; height: ' + appendPX(imgHeight) + '; position: relative; top: ' + imageOffset + ';"';
				}
				at += '>' + it + '</a>';
				var st = "";
				if (bg) {
					st += " background-color: #" + bg + ";";
				}
				if (tc) {
					st += " color: #" + tc + ";";
				}
				if (bc) {
					st += " border: 1px solid #" + bc + ";";
				}
				if (fullSizeMissing) {
					var ft = '<div style="width: ' + appendPX(imgWidth) + '; margin: auto; position: relative; top: 50%;">' + at + '</div>';
					re.outerHTML = '<div id="' + id + '" style="width: ' + appendPX(width) + '; height: ' + appendPX(height) + '; text-align: center;' + st + '">' + ft + '</div>';
				}
				else {
					re.outerHTML = '<div id="' + id + '" style="' + st + '">' + at + '</div>';
				}
			}
			else {
				var ue = doc.createElement("div");
				ue.setAttribute("id", id);
				if (bg) {
					ue.style.backgroundColor = "#" + bg;
				}
				if (tc) {
					ue.style.color = "#" + tc;
				}
				if (bc) {
					ue.style.border = "1px solid #" + bc;
				}
				if (fullSizeMissing) {
					ue.style.width = appendPX(width);
					ue.style.height = appendPX(height);
					var fe = doc.createElement("div");
					fe.style.width = appendPX(imgWidth);
					fe.style.margin = "auto";
					fe.style.position = "relative";
					fe.style.top = "50%";
				}
				var ae = doc.createElement("a");
				ae.setAttribute("href", url);
				ae.setAttribute("title", msg);
				ae.setAttribute("onclick", onclick);
				if (fullSizeMissing) {
					ae.style.display = "block";
					ae.style.height = appendPX(imgHeight);
					ae.style.position = "relative";
					ae.style.top = imageOffset;
				}
				var ie = doc.createElement("img");
				ie.setAttribute("alt", msg);
				ie.setAttribute("src", img);
				ie.setAttribute("width", imgWidth);
				ie.setAttribute("height", imgHeight);
				ie.style.borderWidth = "0px";
				ae.appendChild(ie);
				if (fullSizeMissing) {
					fe.appendChild(ae);
					ue.appendChild(fe);
				}
				else {
					ue.appendChild(ae);
				}
				re.parentNode.replaceChild(ue, re);
			}
			setVisibility(id, true);
		}
		if (callback) {
			callback({ success : false, id : id });
		}
		if (autoInstall && enableClickOnce && ua.co && !addedClickOnce) {
			addedClickOnce = true;
			addLoadEvent(function() {
				doc.location = baseUrl + "3.0/co/UnityWebPlayer.application?installer=" + encodeURIComponent(baseUrl + getWinInstall());
			});
		}
		if (re) {
			(function() {
				var cf = arguments.callee;
				detectUnity(function(status) {
					if (status == "installed") {
						setVisibility(id, false);
						createUnity(id, attributes, params, callback);
					}
					else {
						setTimeout(cf, 500);
					}
				});
			})();
		}
	}

	// retrieves windows installer name
	function getWinInstall() {
		return fullInstall ? "UnityWebPlayerFull.exe" : "UnityWebPlayer.exe";
	}

	// retrieves mac plugin package name
	function getOSXInstall() {
		return "UnityPlayer.plugin.zip";
	}

	// retrieves installer name
	function getInstaller() {
		return baseUrl + (ua.win ? getWinInstall() : getOSXInstall() );
	}
	
	// launches java installer
	function doJavaInstall(id) {
		var re = doc.getElementById(id);
		var applet = applets[id];
		var a = {
			id : id,
			type : "application/x-java-applet",
			archive : baseUrl + "3.0/jws/UnityWebPlayer.jar",
			code : "UnityWebPlayer",
			width : applet.attributes["width"] || 600,
			height : applet.attributes["height"] || 450,
			name : "Unity Web Player"
		};
		var p = {
			context : id,
			jnlp_href : baseUrl + "3.0/jws/UnityWebPlayer.jnlp",
			classloader_cache : false,
			installer : getInstaller(),
			image : "http://webplayer.unity3d.com/installation/unitylogo.png",
			centerimage : true,
			boxborder : false,
			scriptable : true,
			mayscript : true
		};
		for (var i in applet.params) {
			if (i == "src") {
				continue;
			}
			if (applet.params[i] != Object.prototype[i]) {
				p[i] = applet.params[i];
				if (i.toLowerCase() == "logoimage") {
					p["image"] = applet.params[i];
				}
				else if (i.toLowerCase() == "backgroundcolor") {
					p["boxbgcolor"] = "#" + applet.params[i];
				}
				else if (i.toLowerCase() == "bordercolor") {
					// there's no way to specify border color
					p["boxborder"] = true;
				}
				else if (i.toLowerCase() == "textcolor") {
					p["boxfgcolor"] = "#" + applet.params[i];
				}
			}
		}
		if (ua.win && ua.ie) {
			var at = "";
			for (var i in a) {
				at += ' ' + i + '="' + a[i] + '"';
			}
			var pt = "";
			for (var i in p) {
				pt += '<param name="' + i + '" value="' + p[i] + '" />';
			}
			re.outerHTML = '<object' + at + '>' + pt + '</object>';
		}
		else {
			var ue = doc.createElement("object");
			for (var i in a) {
				ue.setAttribute(i, a[i]);
			}
			for (var i in p) {
				var pe = doc.createElement("param");
				pe.name = i;
				pe.value = p[i];
				ue.appendChild(pe);
			}
			re.parentNode.replaceChild(ue, re);
		}
		triedJava = true;
		setSessionCookie(triedJavaCookie, triedJava);
		setVisibility(id, true);
	}
	
	// java installation callback
	function javaInstallDone(id, success) {
		detectUnity(function(status) {
			applet = applets[id];
			if (status == "installed") {
				createUnity(id, applet.attributes, applet.params, applet.callback);
			}
			else {
				createMissingUnity(id, applet.attributes, applet.params, applet.callback, applet.broken);
			}
		});
	}

	// removes web player from the web page
	function removeUnity(id) {
		var ue = doc.getElementById(id);
		if (ue) {
			if (ua.win && ua.ie) {
				var oe = ue.firstChild;
				if (oe && oe.nodeName == "OBJECT") {
					ue.style.display = "none";
					(function() {
						// do not try to unload web player on ie before it has been loaded
						if (oe.readyState == 4) {
							for (var i in oe) {
								if (typeof oe[i] == "function") {
									oe[i] = null;
								}
							}
							ue.parentNode.removeChild(ue);
						}
						else {
							setTimeout(arguments.callee, 10);
						}
					})();
					return;
				}
			}
			ue.parentNode.removeChild(ue);
		}
	}
	
	// retrieves web player object.
	// callback accepts single parameter containing web player object
	function getObjectById(id, callback) {
		var ue = doc.getElementById(id);
		if (!ue) {
			if (callback) {
				callback(null);
			}
			return null;
		}
		var obj;
		if (ua.win && ua.ie) {
			var oe = ue.getElementsByTagName("object")[0];
			if (oe && oe.nodeName == "OBJECT") {
				obj = oe;
			}
		}
		else {
			var ee = ue.getElementsByTagName("embed")[0];
			if (ee && ee.nodeName == "EMBED") {
				obj = ee;
			}
		}
		return (function() {
			if (obj && typeof obj.GetPluginVersion == "undefined") {
				if (callback) {
					setTimeout(arguments.callee, 10);
				}
				return null;
			}
			if (callback) {
				callback(obj);
			}
			return obj;
		})();
	}

	// shows or hides html element
	function setVisibility(id, visible) {
		if (!autoHideShow) {
			return;
		}
		var v = visible ? "visible" : "hidden";
		if (domLoaded && doc.getElementById(id)) {
			doc.getElementById(id).style.visibility = v;
		}
		else {
			createCSS("#" + id, "visibility: " + v + ";");
		}
	}
	
	// creates dynamic css
	function createCSS(selector, declaration, media, newStyle) {
		// http://www.bobbyvandersluis.com/articles/dynamic_css/index.html
		if (ua.mac && ua.ie) {
			return;
		}
		var h = doc.getElementsByTagName("head")[0];
		if (!h) {
			return;
		}
		var m = (media && typeof media == "string") ? media : "screen";
		if (newStyle) {
			styleSheet = null;
			styleSheetMedia = null;
		}
		if (!styleSheet || styleSheetMedia != m) {
			var se = doc.createElement("style");
			se.setAttribute("type", "text/css");
			se.setAttribute("media", m);
			styleSheet = h.appendChild(se);
			if (ua.win && ua.ie && typeof doc.styleSheets != "undefined" && doc.styleSheets.length > 0) {
				styleSheet = doc.styleSheets[doc.styleSheets.length - 1];
			}
			styleSheetMedia = m;
		}
		if (ua.win && ua.ie && typeof styleSheet.addRule == "object") {
			styleSheet.addRule(selector, declaration);
		}
		else {
			if (styleSheet && typeof doc.createTextNode != "undefined") {
				styleSheet.appendChild(doc.createTextNode(selector + " { " + declaration + " }"));
			}
		}
	}
	
	// prevents ie memory leaks
	var cleanup = function() {
		if (ua.win && ua.ie) {
			if (typeof win.attachEvent != "undefined") {
				addListener(win, "onunload", ieCleanup);
			}
			else if (typeof win.onunload == "function") {
				var previous = win.onunload;
				win.onunload = function() {
					previous();
					ieCleanup();
				}
			}
			else {
				win.onunload = ieCleanup;
			}
		}
	}();
	
	// cleans up on ie closure
	function ieCleanup() {
		for (var i in listeners) {
			var listener = listeners[i];
			listener.target.detachEvent(listener.type, listener.event);
		}
		for (var i in embeddedObjects) {
			removeUnity(embeddedObjects[i]);
		}
		for (var i in ua) {
			ua[i] = null;
		}
		ua = null;
		for (var i in unityObject) {
			unityObject[i] = null;
		}
		unityObject = null;
	}
	
	// clones attribute object
	function cloneAttributes(attributes, width, height) {
		var clone = {};
		if (attributes && typeof attributes == "object") {
			for (var i in attributes) {
				clone[i] = attributes[i];
			}
		}
		clone.width = width;
		clone.height = height;
		return clone;
	}
	
	// clones parameters object
	function cloneParams(params, src) {
		var ffc = "unityObject.firstFrameCallback();";
		var clone = {};
		if (params && typeof params == "object") {
			for (var name in params) {
				clone[name] = params[name];
				if (name.toLowerCase() == "firstframecallback") {
					clone[name] = ffc + clone[name];
					ffc = null;
				}
			}
		}
		if (ffc) {
			clone.firstFrameCallback = ffc;
		}
		clone.src = src;
		return clone;
	}
	
	// public api
	return {
		// dynamic publishing.
		// id - replacement dom element;
		// src - unity data file;
		// width - content width;
		// height - content height;
		// params - optional parameters;
		// attributes - optional attributes;
		// callback - optional callback on operation completion. accepts single parameter containing object with success, id and ref properties.
		embedUnity : function(id, src, width, height, params, attributes, callback) {
			if (ua.w3 && !(ua.wk && ua.wk < 312) && id && src && width && height) {
				addDomLoadEvent(function() {
					var clonedAttributes = cloneAttributes(attributes, width, height);
					var clonedParams = cloneParams(params, src);
					detectUnity(function(status) {
						if (status == "installed") {
							createUnity(id, clonedAttributes, clonedParams, callback);
						}
						else if (status == "x64") {
							createInvalidUnity(id, clonedAttributes, clonedParams, callback, "Use 32-bit browser to run Unity content.");
						}
						else {
							createMissingUnity(id, clonedAttributes, clonedParams, callback, status == "broken");
						}
					});
				});
			}
			else if (callback) {
				callback({ success : false, id : id });
			}
		},
		
		// retrieves web player object.
		// callback accepts single parameter containing web player object
		getObjectById : function(id, callback) {
			if (ua.w3 && id) {
				return getObjectById(id, callback);
			}
			else if (callback) {
				callback(null);
			}
			return null;
		},
		
		// automatically hide original html element before creating web player.
		setAutoHideShow : function(value) {
			autoHideShow = value;
		},
		
		// make missing banner of content size.
		setFullSizeMissing : function(value) {
			fullSizeMissing = value;
		},
		
		// enable full intallation
		enableFullInstall : function(value) {
			fullInstall = value;
		},
		
		// enable auto installation
		enableAutoInstall : function(value) {
			autoInstall = value;
		},
		
		// enable java installation
		enableJavaInstall : function(value) {
			enableJava = value;
		},
		
		// enable clickonce installation
		enableClickOnceInstall : function(value) {
			enableClickOnce = value;
		},
		
		// enable google analytics
		enableGoogleAnalytics : function(value) {
			enableAnalytics = value;
		},

		// set base download url. Default is:
		// "http://webplayer.unity3d.com/download_webplayer-3.x/
		setBaseDownloadUrl: function(value) {
		    baseUrl = value;
		},

		// executes a function on the window onload event
		addLoadEvent : addLoadEvent,
		
		// executes a function as soon as the dom of a web page is available
		addDomLoadEvent : addDomLoadEvent,
		
		// contains browser and platform properties
		ua : ua,

		// low level api. detects unity web player.
		// callback accepts single parameter containing "missing", "broken" or "installed" value
		detectUnity : function(callback) {
			if (ua.w3 && !(ua.wk && ua.wk < 312) && callback) {
				detectUnity(callback);
			}
			else if (callback) {
				callback("missing");
			}
		},
		
		// low level api. replaces dom element identified by id with web player.
		// callback accepts same parameter as embedUnity function
		createUnity : function(id, params, attributes, callback) {
			if (ua.w3 && !(ua.wk && ua.wk < 312) && id && params && attributes && callback) {
				createUnity(id, attributes, params, callback);
			}
			else if (callback) {
				callback({ success : false, id : id });
			}
		},

		// low level api. removes web player from the web page
		removeUnity : function(id) {
			if (ua.w3) {
				removeUnity(id);
			}
		},
		
		// private function
		trackStatus : function(status) {
			trackStatus(status);
		},
		
		// private function
		doJavaInstall : function(id) {
			doJavaInstall(id);
		},
		
		// private function
		javaInstallDone : function(id, success) {
			// javaInstallDone must not be called directly because it deadlocks google chrome
			setTimeout("unityObject.javaInstallDoneDirect(\"" + id + "\", " + success + ");", 0);
		},

		// private function
		javaInstallDoneDirect : function(id, success) {
			javaInstallDone(id, success);
		},
		
		// private function
		firstFrameCallback : function() {
			updateStatus("running");
		}
	};
}();