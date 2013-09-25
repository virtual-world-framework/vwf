/*global define*/
define([
        './defaultValue',
        './defined',
        '../ThirdParty/when'
    ], function(
        defaultValue,
        defined,
        when) {
    "use strict";

    var maximumRequestsPerServer = 6;
    var activeRequests = {};
    var anchor;

    function getServer(url) {
        if (!defined(anchor)) {
            anchor = document.createElement('a');
        }
        anchor.href = url;
        return anchor.hostname + '%' + anchor.port;
    }

    /**
     * Because browsers throttle the number of parallel requests allowed to each server,
     * this function tracks the number of active requests that have been made, and
     * returns undefined immediately if the request would exceed the maximum, allowing
     * the caller to retry later.
     *
     * @exports throttleRequestByServer
     *
     * @param {String} url The URL to request.
     * @param {Function} requestFunction The actual function that makes the request.
     * This function is expected to return a Promise for the requested data.
     *
     * @returns {Promise} Either undefined, meaning the request would exceed the maximum
     * number of parallel requests, or a Promise that returns the requested data.
     *
     * @see <a href='http://wiki.commonjs.org/wiki/Promises/A'>CommonJS Promises/A</a>
     *
     * @example
     * // throttle requests for an image
     * var promise = throttleRequestsByServer(
     *     'http://madeupserver.agi.com/myImage.png',
     *     function(url) {
     *        return loadImage(url);
     *     });
     * if (!defined(promise)) {
     *     // too many active requests, try again later.
     * } else {
     *     when(promise, function(image) {
     *         // handle loaded image
     *     });
     * }
     */
    function throttleRequestByServer(url, requestFunction) {
        var server = getServer(url);

        var activeRequestsForServer = defaultValue(activeRequests[server], 0);
        if (activeRequestsForServer > maximumRequestsPerServer) {
            return undefined;
        }

        activeRequests[server] = activeRequestsForServer + 1;

        return when(requestFunction(url), function(result) {
            activeRequests[server]--;
            return result;
        }, function(error) {
            activeRequests[server]--;
            return when.reject(error);
        });
    }

    return throttleRequestByServer;
});