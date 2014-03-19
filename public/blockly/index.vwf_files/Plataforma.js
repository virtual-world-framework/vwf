if (typeof (console) === "undefined") {
    var names = ["log", "debug", "info", "warn", "error"];
    window.console = {};
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
}

var Link = {};
Link.stringify = function(base, params)
{
    var url = base;
    var paramNum = 0;
    for (var param in params)
    {
        if (params.hasOwnProperty(param))
        {
            url += (paramNum == 0 ? "?" : "&");
            url += param + "=" + encodeURIComponent(params[param]);
            paramNum++;
        }
    }
    return url;
};

window['Link'] = Link;

// hack to ensure JSON.stringify will exist
var JSON = JSON || {};
JSON.stringify = JSON.stringify || function (obj) {
	var t = typeof (obj);
	if (t != "object" || obj === null) {
		// simple data type
		if (t == "string") obj = '"'+obj+'"';
		return String(obj);
	}
	else {
		// recurse array or object
		var n, v, json = [], arr = (obj && obj.constructor == Array);
		for (n in obj) {
			v = obj[n]; t = typeof (v);
			if (t == "string") v = '"'+v+'"';
			else if (t == "object" && v !== null) v = JSON.stringify(v);
			json.push((arr ? "" : '"' + n + '":') + String(v));
		}
		return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
	}
};

window['Plataforma'] = function() {

    var sessionKey = 'uninitialized';
    var rpc;
    
    var init = function(args) {
    	if (typeof (JsonRpcEndpoint) == 'undefined') {
    		throw new Error('Plataforma requires jsonrpc');
    	}

        var sessionParameter = "";
        console.log('Plataforma.init() args=', args);
        if (args.sessionKey !== undefined) {
            sessionKey = args.sessionKey;
            sessionParameter = "?_session=" + sessionKey;
        }
        rpc = new JsonRpcEndpoint("/rpc/ClientApi" + sessionParameter);
    };

    var getRpc = function() {
        return rpc;
    };

    /**
     * Create a javascript string. Escape " and '.
     * @param s String string to be escaped
     * @return String escaped string
     */
    var escapeJavascriptString = function(s) {
        if (s == null || typeof s == 'undefined') {
            return s;
        }

        var re = new RegExp('([\'\"])', 'g');
        s = s.replace(re, '\\$1');
        s = s.replace(/\n/, '\\n');
        s = s.replace(/\r/, '\\r');

        return s;
    };

    /**
     * Create a new objects with all values from srcObject and mergeObject.
     *
     * <p>Properties present in srcObject will override values in mergeObject</p>
     *
     * @param mergeObject
     * @param srcObject
     * @return a new object
     */
    var merge = function(mergeObject, srcObject, deepCopy) {
        var obj = {};

        if(typeof deepCopy == "undefined") {
            $.extend(obj, mergeObject, srcObject);
        } else {
            $.extend(deepCopy, obj, mergeObject, srcObject);
        }

        return obj;
    };

    var ClientHealthTracking = function() {
        var clientStartupStage = function(clientType, stage) {
            rpc.remoteCall("ClientHealthTracking.clientStartupStage2", [clientType, stage], function(result) {}, function(error) { console.log('Error calling ClientHealthTracking.clientStartupStage():' + error)});
        };

        var clientLoadProgress = function(clientType, bytesLoaded) {
            rpc.remoteCall("ClientHealthTracking.clientLoadProgress2", [clientType, bytesLoaded], function(result) {}, function(error) {console.log('Error calling ClientHealthTracking.clientLoadProgress():' + error)});
        };

        var flashClientInformation = function(clientType, version, manufacturer, os, screenWidth, screenHeight) {
            rpc.remoteCall("ClientHealthTracking.clientInformation2", [clientType, version, manufacturer, os, screenWidth, screenHeight], function(result) {}, function(error) { console.log('Error calling ClientHealthTracking.flashClientInformation():' + error)});
        };

        var clientException = function(clientType, text) {
            rpc.remoteCall("ClientHealthTracking.clientException2", [clientType, text], function(result) {}, function(error) { console.log('Error calling ClientHealthTracking.clientException():' + error)});
        }

        return {
            clientStartupStage : clientStartupStage,
            clientLoadProgess : clientLoadProgress,
            flashClientInformation : flashClientInformation,
            clientException : clientException
        };
    }();

    return {
        init : init,
        getRpc : getRpc,
        escapeJavascriptString : escapeJavascriptString,
        merge : merge,
        ClientHealthTracking : ClientHealthTracking
    };
}();


/**
 * AdsDecisionsHandler singleton.
 */
var AdsDecisionsHandler = new function()
{
    var mPredefinedCriterias = {};
    var mGameCriterias = {};
    var mPlacements = {};

    var sizeOfObject = function(obj)
    {
        var counter = 0;

        for (var k in obj) {
            counter++;
        }

        return counter;
    };

    var isString = function(obj) {
        return (typeof obj == "string") && ((obj.length > 0));
    };

    var init = function(jsonObj)
    {
        // verify json obj
        if (sizeOfObject(jsonObj) && sizeOfObject(jsonObj.predefinedCriterias) &&
            sizeOfObject(jsonObj.gameCriterias) && sizeOfObject(jsonObj.placements))
        {
            // all good, continue
        }
        else
        {
        	console.log("AdsDecisionsHandler.init() failed with object:", jsonObj);
            return;
        }

        mPredefinedCriterias = jsonObj.predefinedCriterias;
        mGameCriterias = jsonObj.gameCriterias;
        mPlacements = jsonObj.placements;
    };

    var debug = function()
    {
        console.log("AdsDecisionsHandler.debug()", getMembers());
    };

    var getMembers = function()
    {
        return {
            predefinedCriterias: mPredefinedCriterias,
            gameCriterias: mGameCriterias,
            placements: mPlacements
        }
    };

    /**
     * @param placementName String
     * @param gameCriterias Associative-Array {}
     *
     * @return Associative-Array {status:Boolean, errorMessage:String}
     */
    var getWatchAd = function(placementName, gameCriterias)
    {
    	console.log("AdsDecisionsHandler.getWatchAd() called:", placementName, gameCriterias);

        // verify placement name
        if (isString(placementName) && mPlacements[placementName])
        {
            // all good, continue
        }
        else
        {
        	console.log("AdsDecisionsHandler.getWatchAd() placement name does not exist:", placementName);

            return {
                status: false,
                errorMessage: "Placement name '" + placementName + "' does not exist!"
            };
        }

        // verify game criterias
        if (sizeOfObject(gameCriterias))
        {
            for (var c in gameCriterias)
            {
                // the criteria sent in by the game must exist / be defined
                if (mGameCriterias[c])
                {
                    // all good, continue
                }
                else
                {
                	console.log("AdsDecisionsHandler.getWatchAd() game criteria does not exist:", c);

                    return {
                        status: false,
                        errorMessage: "Game criteria '" + c + "' does not exist!"
                    };
                }
            }
        }

        var resultOfDecision = false;
        var placementDecisionCode = mPlacements[placementName];

        //logConsole("Original Code:", placementDecisionCode);

        // compile code
        try
        {
            // search & replace all predefined criterias
            for (var criteriaKey in mPredefinedCriterias)
            {
                var regExp = new RegExp("\\" + criteriaKey, "g");                     // the \\ is used to escape the $ sign which is a group reference
                var criteriaValue = mPredefinedCriterias[criteriaKey];

                placementDecisionCode = placementDecisionCode.replace(regExp, criteriaValue);
            }

            // search & replace all game criterias
            if (sizeOfObject(gameCriterias))
            {
                for (var criteriaKey in gameCriterias)
                {
                    var regExp = new RegExp("\\" + criteriaKey, "g");                     // the \\ is used to escape the $ sign which is a group reference
                    var criteriaValue = gameCriterias[criteriaKey];

                    placementDecisionCode = placementDecisionCode.replace(regExp, criteriaValue);
                }
            }

            //logConsole("Compiled Code:", placementDecisionCode);

            // run code
            resultOfDecision = eval(placementDecisionCode + "\nTestDecision();");
        }
        catch (e)
        {
        	console.log("AdsDecisionsHandler.getWatchAd() exception caught on eval():", e);

            return {
                status: false,
                errorMessage: "Exception caught on eval(): " + e.message
            };
        }

        // return all good
        return {
            status: resultOfDecision,
            errorMessage: null
        }
    };

    return {
        init: init,
        debug: debug,
        getMembers: getMembers,
        getWatchAd: getWatchAd
    }
};