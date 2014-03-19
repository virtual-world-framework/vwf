window['SocialChannels'] = function () {
    var sessionKey;
    var userId;
    var facebookAppId;
    var canvasPageUrl;
    var nameSpace;
    var graphObjectUrl;
    var facebookPageId;
    var afterFbInitCallbacks = [];
    var preDialogCallbacks = [];
    var postDialogCallbacks = [];
    var fbIsInitialized = false;
    var urlHandler;
    var useFloating = false;
    var friends = null;

    var init = function (callerArgs) {
        if (typeof (Plataforma) == 'undefined') {
            throw new Error('SocialChannels.facebook requires Plataforma');
        }

        var defaultArgs = {
            sessionKey: '[sessionKey]',
            facebookAppId: '[facebookAppId]',
            canvasPageUrl: '[canvasPageUrl]',
            nameSpace: '[nameSpace]',
            graphObjectUrl: '[graphObjectUrl]',
            facebookPageId: '[facebookPageId]',
            userId: '[userId]',
            useFloating: '[useFloating]'
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);
        if (console) console.log('SocialChannels.facebook.init(). args=', args);

        sessionKey = args.sessionKey;
        userId = args.userId;
        facebookAppId = args.facebookAppId;
        canvasPageUrl = args.canvasPageUrl;
        nameSpace = args.nameSpace;
        graphObjectUrl = args.graphObjectUrl;
        facebookPageId = args.facebookPageId;
        useFloating = args.useFloating == true;

        $('body').prepend('<div id="fb-root"></div>');
        var gameObj = document.getElementById("game");
        window.fbAsyncInit = function () {
            FB.init({
                appId: args.facebookAppId,
                status: true, // check login status
                cookie: true, // enable cookies to allow the server to access the session
                xfbml: true,// parse XFBML
                channelUrl: document.location.protocol + "//" + document.location.host + "/facebook_channel.jsp?_v=1",
                frictionlessRequests: true,
                hideFlashCallback: args.hideFlashCallback
            });

            //FB.Canvas.setAutoResize();
            if (!useFloating) {
                FB.Canvas.setSize({height: 1105, width: 760 });
            }

            fbIsInitialized = true;
            for (var i = 0; i < afterFbInitCallbacks.length; ++i) {
                afterFbInitCallbacks[i]();
            }
        };


        $.getScript(document.location.protocol + '//connect.facebook.net/en_US/all.js', function (data, status) {
        });
        /*
         var e = document.createElement('script'); e.async = true;
         e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
         document.getElementById('fb-root').appendChild(e);
         */

        ProductJsApi.init({
                sessionKey: sessionKey,
                userId: userId
            }
        );
    };

    var registerPreDialogCallback = function (callback) {
        preDialogCallbacks.push(callback);
    };

    var unregisterPreDialogCallback = function (callback) {
        unregisterCallback(preDialogCallbacks, callback);
    };

    var registerPostDialogCallback = function (callback) {
        postDialogCallbacks.push(callback);
    };

    var unregisterPostDialogCallback = function (callback) {
        unregisterCallback(postDialogCallbacks, callback);
    };

    var unregisterCallback = function (callbackArray, callback) {
        for (var p in callbackArray) {
            if (callbackArray[p] === callback) {
                callbackArray.splice(p, 1);
            }
        }
    };

    var performPreDialogCallbacks = function () {
        performCallbacks(preDialogCallbacks);
    };

    var performPostDialogCallbacks = function () {
        performCallbacks(postDialogCallbacks);
    };

    var performCallbacks = function (callbackArray) {
        for (var i = 0; i < callbackArray.length; i += 1) {
            callbackArray[i]();
        }
    };

    var setUrlHandler = function (urlHandler) {
        console.log("setting url handler");
        FB.Canvas.setUrlHandler(function (data) {
            urlHandler(data);
        });
        console.log("setting url handler done");
    };

    var callAfterFbInit = function (callback) {
        if (fbIsInitialized) {
            callback();
        } else {
            afterFbInitCallbacks[afterFbInitCallbacks.length] = callback;
        }
    };

    var getExternalId = function (coreUserId, callback) {
        console.log('getExternalId ' + coreUserId);
        Plataforma.getRpc().remoteCall("FacebookApi.getFacebookIdForUserId", [coreUserId],
            function (result) {
                callback({ status: 'ok', externalId: result });
            },
            function (error) {
                callback({ status: 'error', error: JSON.stringify(error) });
            }
        );
    };


    var sendPost = function (callerArgs, callback) {
        var defaultArgs = {
            title: '[title]',
            body: '[body]',
            linkText: '[linkText]',
            linkParams: {},
            image: '[image]',
            trackingType: '[trackingType]'
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);

        // Construct link with parameters
        var link = Link.stringify(canvasPageUrl, args.linkParams);
        if (args.feedGame) {
            link = graphObjectUrl + "/video?type=video&from=" + encodeURIComponent(userId) + "&redirect=" + encodeURIComponent(link);
        }
        /*        var link = canvasPageUrl;
         var n = 0;
         for (param in args.linkParams) {
         if (n == 0)
         link = link + '?';
         else
         link = link + '&';
         link = link + param + '=' + encodeURIComponent(args.linkParams[param]);
         n++;
         }
         */
        var fbUiArgs = {
            method: 'feed',
            link: link,
            picture: (args.feedGame ? undefined : args.image),
            name: args.linkText,
            caption: args.title,
            description: args.body
        };
        if (args.feedGame) {
            fbUiArgs.ref = "ST_1";
        }

        if (console) console.log('fbUiArgs=', fbUiArgs);

        performCallbacks(preDialogCallbacks);
        FB.ui(fbUiArgs, function (response) {
            performCallbacks(postDialogCallbacks);
            if (console) console.log("fb callback response=", response);
            if (response && response.post_id) {
                Plataforma.getRpc().remoteCall("FacebookEventTracking.trackPostSent", [
                    [],
                    args.trackingType
                ], function (result) {
                }, function (error) {
                });
                callback({ 'status': 'ok' });
            } else {
                callback({ 'status': 'error' });
            }
        });
    };

    var sendPostToUser = function (callerArgs, callback) {
        var defaultArgs = {
            recipient: '[recipient]',
            title: '[title]',
            body: '[body]',
            linkText: '[linkText]',
            linkParams: {},
            image: '[image]',
            trackingType: '{trackingType]'
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);

        // Construct link with parameters
        var link = Link.stringify(canvasPageUrl, args.linkParams);
        /*        var link = canvasPageUrl;
         var n = 0;
         for (param in args.linkParams) {
         if (n == 0)
         link = link + '?';
         else
         link = link + '&';
         link = link + param + '=' + encodeURIComponent(args.linkParams[param]);
         n++;
         }
         */
        var fbUiArgs = {
            to: args.recipient,
            method: 'feed',
            link: link,
            picture: args.image,
            name: args.linkText,
            caption: args.title,
            description: args.body
        };
        console.log('fbUiArgs=', fbUiArgs);
        performCallbacks(preDialogCallbacks);
        FB.ui(fbUiArgs, function (response) {
            performCallbacks(postDialogCallbacks);
            if (console) console.log("fb callback response=", response);
            if (response && response.post_id) {
                Plataforma.getRpc().remoteCall("FacebookEventTracking.trackPostSent", [
                    [args.recipient],
                    args.trackingType
                ], function (result) {
                }, function (error) {
                });
                callback({ 'status': 'ok' });
            } else {
                callback({ 'status': 'error' });
            }
        });
    };

    /**
     * For facebook, callerArgs should be set with following properties.
     * .title: <notification dialog title>
     * .body: <notification message body>
     * .recipients: <who/whom to receive the notification, array if multi recipients>
     * .data: encoded urlMessage
     * .type: not used in fb
     * .image: not used in fb
     * .linkText not used in fb
     */
    var sendNotification = function (callerArgs, callback) {
        var defaultArgs = {
            recipients: undefined,
            type: 'message',
            data: undefined,
            title: '[title]',
            body: '[body]',
            linkText: '[linkText]',
            image: '[image]',
            trackingType: '[trackingType]'
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);

        var recipients = undefined;
        if (args.recipients != undefined) {
            recipients = args.recipients;
        }

        if (args.title.length > 50) {
            args.title = args.title.substring(0, 50);
        }

        var fbUiArgs = {
            method: 'apprequests',
            title: args.title,
            filters: args.filters,
            message: args.body,
            data: args.data,
            to: recipients
        };
        if (console) console.log("fbUiArgs=", JSON.stringify(fbUiArgs));
        performCallbacks(preDialogCallbacks);
        FB.ui(fbUiArgs, function (response) {
            performCallbacks(postDialogCallbacks);
            if (console) console.log("fb callback response=", response);
            if (response && response.to) {
                Plataforma.getRpc().remoteCall("FacebookEventTracking.trackNotificationSent", [response.to, args.trackingType], function (result) {
                }, function (error) {
                });
                callback({ 'status': 'ok', 'recipients': response.to });
            } else {
                console.log('error response=', response);
                callback({ 'status': 'error' });
            }
        });
    };

    var publishStory = function (verb, details) {
        var url = buildStory("/me/" + checkApplyNamespace(verb), details);
        graphPost(url);
    };

    var buildStory = function (url, details) {
        var index = 0;
        for (key in details) {
            if (details.hasOwnProperty(key)) {
                url += (index == 0 ? "?" : "&");
                index++;
                var elem = details[key];
                if (typeof (elem) === "object") {
                    if (jQuery.isArray(elem)) {
                        for (var i = 0; i < elem.length; i++) {
                            url += (i == 0 ? "" : "&") + key + "[]=" + encodeURIComponent(elem[i]);
                        }
                    } else {
                        var object = typeof (elem["_object"]) === "undefined" ? key : elem["_object"];
                        url += key + "=" + encodeURIComponent(buildStory(graphObjectUrl + "/" + checkApplyNamespace(object), elem));
                    }
                }
                else {
                    url += key + "=" + encodeURIComponent(elem);
                }
            }
        }
        return url;
    };

    var checkApplyNamespace = function (name) {
        if (name != 'profile' && name != 'video') {
            name = nameSpace + ':' + name;
        }
        return name;
    };

    var graphPost = function (graphUrl, args) {
        console.log('Posting to graphUrl=' + graphUrl);

        var callback = function (response) {
            if (!response || response.error) {
                if (console) console.log('Error posting to ' + graphUrl + ', response=' + JSON.stringify(response));
            } else {
                if (console) console.log('Sucess posting to ' + graphUrl + ', response=' + JSON.stringify(response));
            }
        };

        if (args != null) {
            FB.api(graphUrl, 'post', args, callback);
        } else {
            FB.api(graphUrl, 'post', callback);
        }
    };

    var hasDepositFunds = function () {
        return false;
    };

    var depositFunds = function (callback) {
        callback(null);
    };

    var hasEarnFunds = function () {
        return false;
    };

    var earnFunds = function (callback) {
        callback(null);
    };

    var hasLike = function () {
        return true;
    };

    var getDoesLike = function (success, error) {
        FB.api('/me/likes/' + facebookPageId, function (resp) {
            if (resp.error) {
                console.log('getDoesLike() error. response=', resp);
                if (error) {
                    error(resp);
                } else {
                    success(false);
                }
            } else {
                if (resp.data.length > 0) {
                    success(true);
                } else {
                    success(false);
                }
            }
        });
    };

    var getGamePageUrl = function () {
        return canvasPageUrl;
    };


    var getAvailableArea = function (callback) {
        callAfterFbInit(function () {
            FB.Canvas.getPageInfo(
                function (info) {
                    callback({"width": info.clientWidth, "height": info.clientHeight});
                }
            );
        });
    };

    var setAreaSize = function (size) {
        FB.Canvas.setSize(size);
    };

    var checkMessages = function (callback) {
        Plataforma.getRpc().remoteCall("FacebookApi.triggerRequestsDownload", [],
            function (result) {
                callback({ status: 'ok', externalId: result });
            },
            function (error) {
                callback({ status: 'error', error: JSON.stringify(error) });
            }
        );
    };

    var reauthenticate = function (callback) {
        console.log("Authenticating against Facebook");
        FB.getLoginStatus(function (result) {
            var auth = result.authResponse;
            Plataforma.getRpc().remoteCall("FacebookApi.authenticate", [auth.signedRequest, auth.accessToken],
                callback,
                function (error) {
                    console.log("Authentication error", error);
                    callback(null);
                });
        }, true);
    };

    var requestFriends = function (appId, callback) {
        if (friends == null) {
            FB.api('/me/friends?fields=id,first_name,name,installed,picture&installed=' + appId, function (response) {
                if (!response || response.error) {
                    console.error("No response when fetching friends list.");
                    callback({status: "error", data: []});
                    return;
                }

                friends = response.data;
                friends.sort(function (a, b) {
                    if (a.name < b.name) {
                        return -1;
                    }

                    if (a.name > b.name) {
                        return 1;
                    }

                    return 0;
                });

                callback({status: "success", data: friends});
            });
        }
        else {
            callback({status: "success", data: friends});
        }
    };

    var setUserId = function (id) {
        userId = id;
    };

    return {
        init: init,
        reauthenticate: reauthenticate,
        registerPreDialogCallback: registerPreDialogCallback,
        unregisterPreDialogCallback: unregisterPreDialogCallback,
        registerPostDialogCallback: registerPostDialogCallback,
        unregisterPostDialogCallback: unregisterPostDialogCallback,
        performPreDialogCallbacks: performPreDialogCallbacks,
        performPostDialogCallbacks: performPostDialogCallbacks,
        addInitCallback: callAfterFbInit,
        setUrlHandler: setUrlHandler,
        getExternalId: getExternalId,
        sendPost: sendPost,
        sendPostToUser: sendPostToUser,
        sendNotification: sendNotification,
        publishStory: publishStory,
        hasDepositFunds: hasDepositFunds,
        depositFunds: depositFunds,
        hasEarnFunds: hasEarnFunds,
        earnFunds: earnFunds,
        hasLike: hasLike,
        getDoesLike: getDoesLike,
        getGamePageUrl: getGamePageUrl,
        getAvailableArea: getAvailableArea,
        setAreaSize: setAreaSize,
        graphPost: graphPost,
        callAfterFbInit: callAfterFbInit,
        checkMessages: checkMessages,
        setUserId: setUserId,
        requestFriends: requestFriends
    };
}();


window['ProductJsApi'] = function () {

    var sessionKey;
    var userId;

    var init = function (callerArgs) {

        var defaultArgs = {
            sessionKey: '[sessionKey]',
            userId: '[userId]'
        };

        var args = Plataforma.merge(defaultArgs, callerArgs, true);
        if (console) {
            console.log('ProductApi.facebook.init(). args=', args);
        }

        sessionKey = args.sessionKey;
        userId = args.userId;
    };


    var purchase = function (receiverCoreUserId, productPackageTypeId, quantity, currency, placement, mobilePricePointId, onSuccess, onError) {
        onSuccess = onSuccess || function () {
        };
        onError = onError || function () {
        };

            var placeOrderThroughFacebook = function (productPackageTypeId, placement, receiverCoreUserId, quantity, mobilePricePointId) {
                console.log('PurchaseApi.initializePurchase', productPackageTypeId);

                Plataforma.getRpc().remoteCall('PurchaseApi.initializePurchase', [productPackageTypeId, placement, receiverCoreUserId, quantity],

                    function (response) {
                        if (response != null) {
                            showFacebookPaymentsUI(response.productURL, response.requestId, quantity, mobilePricePointId);

                        } else {
                            var message = 'No data in PurchaseApi.initializePurchase response';
                            onError({status: 'error', error: message});
                        }
                    },

                    function (error) {
                        onError({ status: 'error', error: error});
                    });
            };

            var handleFBUIPurchaseCancel = function (requestId, callbackData) {
                var errorCode = callbackData['error_code'];
                var errorMessage = callbackData['error_message'];

                console.log('Payment failed', requestId, errorCode, errorMessage);

                Plataforma.getRpc().remoteCall('PurchaseApi.cancelPurchase', [requestId]);

                if (callbackData['error_code'] == 1383010 || callbackData['error_code'] == 1383015) {
                    onError({ status: 'error', error: 'User canceled purchase'});
                } else {
                    onError({ status: 'error', error: errorMessage });
                }

            };

            var handleFBUIPurchaseSuccess = function (requestId, callbackData) {
                console.log('FB.ui purchaseitem callback', callbackData);

                var signedRequest = callbackData['signed_request'];

                Plataforma.getRpc().remoteCall('PurchaseApi.commitPurchase',
                    [signedRequest],
                    function (result) {
                        if (result['status'] != 'error') {
                            onSuccess({ status: result['status'] });
                        } else {
                            console.log('PurchaseApi.commitPurchase failed', result['error']);
                            onError({ status: 'error', error: result['error'] });
                        }
                    });

            };


            var showFacebookPaymentsUI = function (productOpenGraphUrl, requestId, quantity, mobilePricePointId) {
                var buyParameters ={
                    method: 'pay',
                    action: 'purchaseitem',
                    product: productOpenGraphUrl,
                    quantity: quantity,
                    request_id: requestId
                };

                if (mobilePricePointId && mobilePricePointId.length > 0) {
                    buyParameters["pricepoint_id"] = mobilePricePointId;
                }


                FB.ui(buyParameters,
                    function (callbackData) {
                        if (callbackData == null || callbackData['payment_id'] == null || callbackData['payment_id'] == undefined) {
                            handleFBUIPurchaseCancel(requestId, callbackData);
                        } else {
                            handleFBUIPurchaseSuccess(requestId, callbackData);
                        }
                    }
                );

            };

            SocialChannels.performPreDialogCallbacks();
            placeOrderThroughFacebook(productPackageTypeId, placement, receiverCoreUserId, quantity, mobilePricePointId);
            SocialChannels.performPostDialogCallbacks();

    };


    var buy = function (productOrder, onSuccess, onError) {

        if (console) {
            console.log("buy() productOrder=", productOrder);
        }

        var orderItem = productOrder.orderItems[0];
        purchase(orderItem.receiverCoreUserId, orderItem.productPackageType, 1, productOrder.currency, productOrder.placement, null, onSuccess, onError);
    };

    var buyWithQuantity = function (quantifiedProductOrder, onSuccess, onError) {

    	if (console) {
            console.log("buyWithQuantity() quantifiedProductOrder=", quantifiedProductOrder);
        }
        purchase(quantifiedProductOrder.receiverCoreUserId, quantifiedProductOrder.productPackageType,
            quantifiedProductOrder.quantity, quantifiedProductOrder.currency, quantifiedProductOrder.placement, quantifiedProductOrder.mobilePricePointId,  onSuccess, onError);
    };


    var setUserId = function (id) {
        userId = id;
    };


    var getPurchaseOutcomesToAnimate = function (onSuccess, onError) {
        console.log('PurchaseApi.getPendingAnimations');
        Plataforma.getRpc().remoteCall('PurchaseApi.getPendingAnimations', [],
        		function (response) {
        			var list = [];
			
        			for (var i = 0; i < response.length; i++) {
        				var outcomeToAnimate = response[i];
        				list[i]={
    					    transactionId: outcomeToAnimate.requestId,
        					productPackageType: outcomeToAnimate.productPackageTypeId,
        					quantity: outcomeToAnimate.quantity,
        					outcomeSuccessful: outcomeToAnimate.outcomeSuccessful
        				};
        			}
	
        			onSuccess(list);
        		},
        		function (error) {
        			onError("Error when calling server");
        		}
        );
    };

    var confirmAnimatedForUser = function (purchaseOutcomes, onSuccess, onError) {
    	var list = [];
        for (var i = 0; i < purchaseOutcomes.length; i++) {
            list.push(purchaseOutcomes[i].transactionId);
        }
    	
        console.log('PurchaseApi.confirmAnimatedForUser');
        Plataforma.getRpc().remoteCall('PurchaseApi.confirmAnimatedForUser', [list],
        		function (response) {
        			// Dummy return data due to PLAT-155
            		onSuccess("Dummy success message");
        		},
        		function (error) {
        			onError("Error when calling server");
        		}
        );
    };

    var buy2 = function (onSuccess, onError) {
        onError("Not supported");
    };

    var buyWithQuantity2 = function (onSuccess, onError) {
        onError("Not supported");
    };

    var getMobilePricePoints = function (onSuccess, onError) {
        FB.api('/me/?fields=payment_mobile_pricepoints', function (data) {
            if (!data || data.error) {
                // handle errors
                if (console) { console.log("Failed to get payment_mobile_pricepoints from facebook", data); }
                onError("Error getting user mobile price points");
            } else {
                var fbMobilePricePoints = data.payment_mobile_pricepoints;
                var fbPricePoints = fbMobilePricePoints.pricepoints || [];

                var roundPriceInCents = function (price) {
                    return Math.floor(parseFloat(price) * 100);
                };

                var pricePoints = [];
                for (var i = 0, length = fbPricePoints.length; i < length; i++) {
                    var fbPricePoint = fbPricePoints[i];

                    var payoutAmountInCents = roundPriceInCents(fbPricePoint.payout_base_amount);
                    var payerPriceInCents = roundPriceInCents(fbPricePoint.payer_amount);

                    pricePoints[i] = {
                        id: fbPricePoint.pricepoint_id,
                        payoutAmountInCents: payoutAmountInCents,
                        payerPriceInCents: payerPriceInCents,
                        currency: fbPricePoint.currency,
                        countryCode: fbPricePoint.country
                    };
                }
                var mobilePricePoints = {
                    phoneNumber: fbMobilePricePoints.phone_number_last4,
                    mobileCountry: fbMobilePricePoints.mobile_country,
                    pricePoints: pricePoints
                };
                onSuccess(mobilePricePoints);
            }
        });
    };

    return {
        init: init,
        setUserId: setUserId,
        buy: buy,
        buy2: buy2,
        buyWithQuantity: buyWithQuantity,
        buyWithQuantity2: buyWithQuantity2,
        getMobilePricePoints: getMobilePricePoints,
        getPurchaseOutcomesToAnimate: getPurchaseOutcomesToAnimate,
        confirmAnimatedForUser: confirmAnimatedForUser
    };
}();
