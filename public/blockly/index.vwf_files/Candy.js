window['CandyJsApi'] = function () {

    var APPID = "17";

    var settings = {};
    var friends = [];
    var cachedLikesGamesFriends = null;
    var authResponseCallbacks = [];
    var authResponseChanged = false;
    var openGraphNppUrl = "";
    var hasFetchedFriends = false;
    var requestFriendsCallbacks = null;
 
    var fetchFriends = function (appId) {   // Prefetch all friends
        SocialChannels.addInitCallback(function () {
            addAuthResponseCallback(function () {
                SocialChannels.requestFriends(appId, function(response) {
                    if (response.status == "success") {
                        friends = response.data;
                    }
                });
            });
        });
    };

    var init = function (args) {
        var defaultArgs = {
            sessionKey:'[sessionKey]'
        };
        settings = Plataforma.merge(defaultArgs, args, true);
        console.log('Candycrush.init() settings=', settings);

        SocialChannels.addInitCallback(function () {
            fetchFriends(APPID);
        });

        SocialChannels.addInitCallback(function () {
            if (window.FB) {
                FB.Event.subscribe('auth.authResponseChange', function (response) {
                    authResponseChanged = true;
                    runAuthResponseCallbacks();
                });
            }
        });
    };

    var getRpc = function () {
        return Plataforma.getRpc();
    };

    var setOpenGraphNppUrl = function (url) {
        openGraphNppUrl = url;
    }

    var giveBoosterToUsers = function(title, message, toExtUserIds, image, booster, episode, level, callback) {
        var args = {
            title: title,
            message: message,
            toExtUserId: toExtUserIds,
            episode: episode,
            level: level
        };

        console.log('Candycrush.giveBoosterToUser() args=', JSON.stringify(args));

        getRpc().remoteCall("CandyCrushAPI.getBoosterGiftUrlMessage", [booster, episode, level],
            function(urlMessage) {
                console.log("callback from CandyCrushAPI.getBoosterGiftUrlMessage: result=", urlMessage);
                Saga.openRequestDialog("giveBoosterToUsers_" + booster, title, message, image, 'gift', urlMessage, toExtUserIds, function(response) {
                    console.log('response = ', JSON.stringify(response));
                    // Pass response back to flash
                    // response =  {"status":"ok","recipients":["734277962"]}
                    // response =  {"status":"error"}                 });
                    // giveBoosterToUserCallback(response);
                    callback(response);
                });
            },
            function(error) {
                console.log(error);
                // giveBoosterToUserCallback({status:"error"});
                callback(response);
            }
        );
    };

    var getCandyProperties = function(callback) {
        getRpc().remoteCall("CandyCrushAPI.getCandyProperties", [],
            function(json) {
                callback(json.candyProperties);
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var setCandyProperty = function(name, value, callback) {
        getRpc().remoteCall("CandyCrushAPI.setCandyProperty", [name, value],
            function() {
                callback();
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var deliverInitialHardCurrencyGiftForIntroPop = function(callback) {
        getRpc().remoteCall("CandyCrushAPI.deliverInitialHardCurrencyGiftForIntroPop", [],
            function() {
                callback();
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var deliverInitialHardCurrencyGiftForBankTutorial = function(callback) {
        getRpc().remoteCall("CandyCrushAPI.deliverInitialHardCurrencyGiftForBankTutorial", [],
            function() {
                callback();
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var addAuthResponseCallback = function (callback) {
        if (authResponseChanged) {
            callback();
        } else {
            authResponseCallbacks.push(callback);
        }
    };

    var runAuthResponseCallbacks = function () {
        for (var i = 0; i < authResponseCallbacks.length; i++) {
            authResponseCallbacks[i]();
        }
        authResponseCallbacks = [];
    };

    var getNonAppFriends = function (callback) { // All friends not playing candycrush
        getFriends(function(allFriends) {
            var nonAppFriends = [];
            for (var i = 0; i < allFriends.length; i++) {
                if (!allFriends[i].installed) {
                    nonAppFriends.push(allFriends[i]);
                }
            }
            callback(nonAppFriends);
        });
    };

    var getAppFriends = function (callback) {  // All friends playing candycrush
        getFriends(function(allFriends) {
            var appFriends = [];
            for (var i = 0; i < allFriends.length; i++) {
                if (allFriends[i].installed) {
                    appFriends.push(allFriends[i]);
                }
            }
            console.log("Has " + appFriends.length + " friends who does play candy!");
            callback(appFriends);
        });
    };

    var getNonAppFriendsLikesGames = function (callback) {  // All friends that plays any other of our apps (but not ours)
        if (cachedLikesGamesFriends != null) {
            callback(cachedLikesGamesFriends);
            return;
        }

        requestFriends(function(response) {
            var allFriends = {};
            var allFriendIds = [];
            for(var i=0; i<response.data.length; i++)
            {
                var friend = response.data[i];
                allFriendIds.push(friend.id);
                allFriends[friend.id] = friend;
            }

            cachedLikesGamesFriends = [];

            getRpc().remoteCall("SocialFriendsApi.getFriendsForOtherGames", [], function (data) {
                console.log("Has " + data.length + " friends who likes games!");
                for (var i = 0; i < data.length; i++) {
                    var friend = allFriends[data[i]];
                    if(friend) cachedLikesGamesFriends.push(friend);
                }

                callback(cachedLikesGamesFriends);

            }, function (error) {
                console.log(error);
                cachedLikesGamesFriends = [];

                callback(cachedLikesGamesFriends);
            });
        });
    };

    var getFriends = function (callback) {  // All friends
        requestFriends(function(response) { callback(response.data) });
    };

    var requestFriends = function(callback)
    {
        if (hasFetchedFriends) {
            callback({"status": "success", "data":friends});
            return;
        }
        if (requestFriendsCallbacks != null) {
            requestFriendsCallbacks.push(callback);
            return;
        }
        requestFriendsCallbacks = [];
        requestFriendsCallbacks.push(callback);
        SocialChannels.requestFriends(settings.appId, function(response) {
            if (response.status == "success") {
                friends = response.data;
                hasFetchedFriends = true;
            }
            for (var i = 0; i < requestFriendsCallbacks.length; i++) {
                requestFriendsCallbacks[i](response);
            }
            requestFriendsCallbacks = null;
        });
    };

    var getRpc = function () {
        return Plataforma.getRpc();
    };

    var openInviteFriendsDialog = function(title, message, ids, callback) {
        if (ids != null && ids.length > 0) {
            var trackingType = "invite";
            getRpc().remoteCall("SagaApi.getInviteUrlMessage", [trackingType],
                    function (urlMessage) {
                        console.log("callback from SagaApi.getInviteUrlMessage: result=", urlMessage);
                        Saga.openRequestDialog(trackingType, title, message, undefined, "invite", urlMessage, ids, function(response) {
                            callback(response)
                        });
                    },
                    function (error) {
                        console.log(error);
                        callback({status:"error"})
                    }
                );
        }
        else {
            callback({status:"error"})
        }
    };
    

    var notifyProductGiftToUser = function (title, message, productId, externalUserId, image, callback) {
        var trackingType = "gift_" + productId;
        getRpc().remoteCall("SagaApi.getProductGiftUrlMessage", [0, productId, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getProductGiftUrlMessage: result=", urlMessage);
                Saga.openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [externalUserId], function(response) {
                    callback(response);
                });
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var getLevelRating = function(episodeId, levelId, callback) {
        console.log("Candy.js=getLevelRating");
        var val = LevelRating[episodeId + "_" + levelId];
        console.log("return=" + val);
        if (val == undefined) {
            callback(0);
        }
        callback(val);
    }

    var isNppEligible = function(externalUserId) {
        var obj;
        if (window.FB) {
            FB.api('/'+externalUserId+'?fields=is_eligible_promo', function(response) {
                console.log(response);
                if(response.is_eligible_promo == 1)
                {
                    obj = {
                        message: 'Npp is available for user',
                        status: 'ok'
                    };
                } else {
                    obj = {
                        message: 'Npp is not available for user',
                        status: 'error'
                    };
                }
                Saga.getGame().isNppEligibleCallback(obj);
            });
        }
        else {
            obj = {
                message: 'Npp is not available for user',
                status: 'error'
            };
            Saga.getGame().isNppEligibleCallback(obj);
        }
    }

    var openNppDialog = function() {
        if (window.FB){
            console.log("NPP: " + openGraphNppUrl);
            var obj = {
                method: 'fbpromotion',
                display: 'popup',
                package_name: 'zero_promo',
                product: openGraphNppUrl
            };

            FB.ui(obj, npp_callback);
        }
    }

    var npp_callback = function(response) {
        obj = {
            message: 'Npp is registered for this user',
            status: 'ok'
        };

        location.reload(); // BI decision to do this reload. Not possible to unlock a level without refresh of page at the moment
        //Saga.getGame().openNppDialogCallback(obj);
    }


     var requestBoosterWheelFromMany = function (title, message, externalUserIds, image) {
        var trackingType = "requestBoosterWheel";
        getRpc().remoteCall("CandyCrushAPI.getRequestBoosterWheelUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from CandyCrushAPI.getRequestBoosterWheelUrlMessage: result=", urlMessage);
                Saga.openRequestDialog(trackingType, title, message, image, 'invite', urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
     };


     var acceptBoosterWheelHelp = function (title, message, toExternalUserId, image) {
         var trackingType = "acceptBoosterWheelHelp";
        getRpc().remoteCall("CandyCrushAPI.getGiveBoosterWheelHelpUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from CandyCrushAPI.getGiveBoosterWheelHelpUrlMessage: result=", urlMessage);
                Saga.openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [toExternalUserId]);
            },
            function (error) {
                console.log(error);
            }
         );
     };


    return {
        init : init,
        setOpenGraphNppUrl : setOpenGraphNppUrl,
        giveBoosterToUsers : giveBoosterToUsers,
        getCandyProperties : getCandyProperties,
        setCandyProperty : setCandyProperty,
        getFriends : getFriends,
        getAppFriends : getAppFriends,
        getNonAppFriends : getNonAppFriends,
        getNonAppFriendsLikesGames : getNonAppFriendsLikesGames,
        getLevelRating:getLevelRating,
        openInviteFriendsDialog : openInviteFriendsDialog,
        notifyProductGiftToUser : notifyProductGiftToUser,
        isNppEligible : isNppEligible,
        openNppDialog : openNppDialog,
        npp_callback : npp_callback,
        requestBoosterWheelFromMany : requestBoosterWheelFromMany,
        acceptBoosterWheelHelp : acceptBoosterWheelHelp
    };
    
}();
