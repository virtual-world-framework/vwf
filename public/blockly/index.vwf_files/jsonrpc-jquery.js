/**
 * @constructor
 * @param {string} url
 */
function JsonRpcEndpoint(url) {
    this.url = url;
    this.sequenceNumber = 0;
    this.methodCalls = [];
    this.inBufferingMode = 0;
    this.inFlightCalls = [];
    this.timeout = 60000;
}

JsonRpcEndpoint.prototype.begin = function() {
    this.inBufferingMode = 1;
    this.methodCalls = [];
    this.inFlightCalls = [];
}

JsonRpcEndpoint.prototype.end = function() {
    this.inBufferingMode=0;
    var localInFlightCalls = this.inFlightCalls;
    var localMethodCalls = this.methodCalls;
    var callbackFunction = function(data) {
        var retVal = eval ( "(" + data + ")" );
        if (retVal.constructor.toString().indexOf("Array") != -1) {
            for (var i in retVal) {
                var response = retVal[i];
                if (response.error != undefined) {
                    errorCallback = localInFlightCalls[response.id].errorCallback;
                	if (errorCallback != undefined) {
                        errorCallback(response.error);
                	}
                } else {
                    callback = localInFlightCalls[response.id].callback;
                	if (callback != undefined) {
                        callback(response.result);
                	}
                }
            }
        }
    };
    var errorFunction =  function(jqXHR, textStatus, errorThrown) {
        for (var i in localMethodCalls) {
            var request = localMethodCalls[i];
                errorCallback = localInFlightCalls[request.id].errorCallback;
                errorCallback({jsonrpc:"2.0", id:request.id, code:-1, message:textStatus});
        }
    };
    $.ajax({
	type: 'POST',
	url: this.url,
	data: JSON.stringify(this.methodCalls),
	success: callbackFunction,
	dataType: "text",
	contentType: "application/json-rpc",
	timeout:this.timeout,
	error: errorFunction
    });
    this.inBufferingMode = 0;
    this.methodCalls = [];
    this.inFlightCalls = [];
}

JsonRpcEndpoint.prototype.remoteCall = function (method, params, callback, errorCallback) {
    this.methodCalls[this.methodCalls.length]={"method":method, "params":params, "id":this.sequenceNumber};
    this.inFlightCalls[this.sequenceNumber] = {"callback":callback, "errorCallback":errorCallback};
    this.sequenceNumber++;
    if (this.inBufferingMode == 0) {
	this.end();
    }
}

JsonRpcEndpoint.prototype.setUrl = function(url) {
	king.debug("RPC URL: " + url);
	this.url = url;
}

// Usage example:

// Make the endpoint:
//var soa = new JsonRpcEndpoint("/rpc/JsonRpcTest");

// Define interface :
//soa.nextInt = function (maxVal, callback, errorCallback) {
 //   soa.remoteCall("rnd.nextInt", [maxVal], callback,errorCallback);
//}

//showResult = function(retval) {alert("return value:"+JSON.stringify(retval));};
//showError = function(errorObject) {alert(errorObject.message);}

// Sample usage here:

//soa.begin();
//soa.nextInt(17, showResult, showError);
//soa.nextInt(1700, showResult, showError);
//soa.end();

//soa.nextInt(170000, showResult, showError);


//export symbol(s) to enable compression
window['JsonRpcEndpoint'] = JsonRpcEndpoint;
