if (typeof (Plataforma) == 'undefined') {
    throw new Error('Saga requires Plataforma');
}
if (typeof (SocialChannels) == 'undefined') {
    throw new Error('Saga requires SocialChannels');
}
if (typeof (jQuery) == 'undefined') {
    throw new Error('Saga requires jQuery');
}
if (typeof (Saga) == 'undefined') {
    window.Saga = {};
}

var Saga = function () {

    var settings = {};

    var init = function (callerArgs) {
        var defaultArgs = {
            sessionKey:'[sessionKey]',
            userId:'[userId]',
            imagesMap:'[imageMap]',
            staticImageBasePath:'/images',
            gameContainer:'gameContainer',
            fanContainer:'fanContainer',
            privacyContainer:'privacyContainer',
            game:'game',
            hasPublishActions:false,
            hasFeedGame:false,
            unconditionalHideShowGame:false,
            directMode:false
        };
        settings = Plataforma.merge(defaultArgs, callerArgs, true);
        if (!settings.directMode) {
            console.log("not direct mode, registering dialog callbacks");
            SocialChannels.registerPreDialogCallback(hideGame);
            SocialChannels.registerPostDialogCallback(showGame);
        }
        console.log('Saga.init() settings=', settings);
    };

    var setFlashUrlHandler = function (name) {
        SocialChannels.setUrlHandler(function (data) {
            getGame()[name]();
        });
    };

    var setUrlHandler = function (closure) {
        SocialChannels.setUrlHandler(closure);
    };

    var getRpc = function () {
        return Plataforma.getRpc();
    };

    var _productCategory = {
        gold:1,
        life:2,
        levelUnlock:4,
        ingame:5,
        recipeTopup:7
    };

    var getImageURL = function (image) {
        return settings.imagesMap[settings.staticImageBasePath + '/' + image];
    };

    var sendPost = function (trackingType, title, linkText, body, image, urlMessage, feedGame, callback) {
        console.log("Saga.sendPost");
        jQuery("#links").css('display', 'none');
        if (settings.directMode) hideGame();
        var args = {
            title:title,
            body:body,
            linkText:linkText,
            linkParams:{ urlMessage:urlMessage },
            image:getImageURL(image),
            trackingType:trackingType
        };
        if (feedGame) {
            args.feedGame = true;
        }
        console.log("args=", JSON.stringify(args));
        SocialChannels.sendPost(args, function (response) {
            console.log('callback, response=', response);
            jQuery("#links").css('display', 'block');
            if (settings.directMode) showGame();
            if (callback != undefined) callback(response);
        });
    };

    var sendPostGraph = function (trackingType, name, caption, description, message, link, image, actionName, actionLink) {
        var args = {
            caption:caption,
            name:name,
            description:description,
            message:message,
            link:link,
            actions:{ name:actionName, link:actionLink },
            picture:getImageURL(image),
            trackingType:trackingType
        };

        console.log("sendPostGraph(), args=", args);

        SocialChannels.graphPost("/me/feed", args);
    };

    var sendPostToUser = function (trackingType, title, linkText, body, image, urlMessage, externalUserId, callback) {
        console.log("Saga.sendPostToUser");
        jQuery("#links").css('display', 'none');
        if (settings.directMode) hideGame();
        var args = {
            recipient:externalUserId,
            title:title,
            body:body,
            linkText:linkText,
            linkParams:{ urlMessage:urlMessage },
            image:getImageURL(image),
            trackingType:trackingType
        };
        console.log("args=", JSON.stringify(args));
        SocialChannels.sendPostToUser(args, function (response) {
            console.log('callback, response=', response);
            jQuery("#links").css('display', 'block');
            if (settings.directMode) showGame();
            if (callback != undefined) callback(response);
        });
    };

    var inviteFriends = function (title, message, image) {
        console.log("Saga.inviteFriends(" + title + ", " + message + ")");

        if (typeof (SocialUI) != 'undefined' && !($.browser.msie && parseInt($.browser.version) == 7)) {
            SocialUI.openInviteFriendsDialog(title, message, image);
        }
        else {
            var trackingType = "invite";
            getRpc().remoteCall("SagaApi.getGiveGoldUrlMessage", [trackingType],
                function (urlMessage) {
                    console.log("callback from SagaApi.getGiveGoldUrlMessage: result=", urlMessage);
                    Saga.openRequestDialog(trackingType, title, message, image, "invite", urlMessage, undefined, function (response) {
                        Saga.getGame().invitePopupClosed();
                    });
                },
                function (error) {
                    console.log(error);
                }
            );
        }
    };

    var inviteFriendsWithoutGivingGold = function (title, message, image) {
        console.log("Saga.inviteFriendsWithoutGivingGold(" + title + ", " + message + ")");

        if (typeof (SocialUI) != 'undefined' && !($.browser.msie && parseInt($.browser.version) == 7)) {
            SocialUI.openInviteFriendsDialog(title, message, image);
        }
        else {
            var trackingType = "invite";
            getRpc().remoteCall("SagaApi.getInviteUrlMessage", [trackingType],
                function (urlMessage) {
                    console.log("callback from SagaApi.getInviteUrlMessage: result=", urlMessage);
                    Saga.openRequestDialog(trackingType, title, message, image, "invite", urlMessage, undefined, function (response) {
                        Saga.getGame().invitePopupClosed();
                    });
                },
                function (error) {
                    console.log(error);
                }
            );
        }
    };
    
    var openRequestDialog = function (trackingType, title, message, image, type, data, recipients, callback, filters) {
        console.log("Saga.openRequestDialog: ", title, message);
        jQuery("#links").css('display', 'none');
        if (settings.directMode) hideGame();
        var args = {
            recipients:recipients,
            type:type,
            data:data,
            title:title,
            body:message,
            linkText:'Go to game',
            image:(image != undefined ? getImageURL(image) : undefined),
            trackingType:trackingType,
            filters:(filters != undefined ? filters : "")
        };
        console.log("args=", JSON.stringify(args));
        SocialChannels.sendNotification(args, function (response) {
            console.log('callback, response=', response);
            jQuery("#links").css('display', 'block');
            if (settings.directMode) showGame();
            if (callback != undefined) callback(response);
        });
    };

    var notificationToMany = function (title, description, externalUserIds) {
        var trackingType = "notificationToMany";
        openRequestDialog(trackingType, title, description, "", trackingType, "", externalUserIds);
    };

    var sendMapFriendPassedToMany = function (title, description, externalUserIds) {
        var trackingType = "mapFriendPassedToMany";
        getRpc().remoteCall("SagaApi.getMapFriendPassedUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getMapFriendPassedUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, description, "", trackingType, urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var sendToplistFriendBeatenToMany = function (title, description, externalUserIds, episodeId, levelId, score) {
        var trackingType = "tlFBMany";
        getRpc().remoteCall("SagaApi.getToplistFriendBeatenUrlMessage", [episodeId, levelId, score, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getToplistFriendBeatenUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, description, "", trackingType, urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var shareGold = function (title, body, prompt, image, amount) {
        var trackingType = "shareGold";
        getRpc().remoteCall("SagaApi.getShareGoldUrlMessage", [amount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getShareGoldUrlMessage: result=", urlMessage);
                sendPost(trackingType, title, prompt, body, image, urlMessage, settings.hasFeedGame);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var shareGoldToUser = function (title, body, prompt, image, amount, toExternalUserId, callback) {
        var trackingType = "shareGoldToUser";
        getRpc().remoteCall("SagaApi.getShareGoldUrlMessage", [amount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getShareGoldUrlMessage: result=", urlMessage);
                sendPostToUser(trackingType, title, prompt, body, image, urlMessage, toExternalUserId, function (response) {
                    if (response.status == 'ok' && settings.hasPublishActions) {
                        /*                        publishStory("give", {
                         item:{ _type:"coin", amount:amount },
                         amount:amount,
                         receiver:{ _object:"user", _type:"profile", instance:toExternalUserId }
                         }); */
                    }
                });
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var giveGoldToUser = function (title, message, externalUserId, image) {
        var trackingType = "giveGoldToUser";
        getRpc().remoteCall("SagaApi.getGiveGoldUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getGiveGoldUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [externalUserId]);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var giveGoldToMany = function (title, message, externalUserIds, image) {
        var trackingType = "giveGoldToUser";
        getRpc().remoteCall("SagaApi.getGiveGoldUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getGiveGoldUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var shareItem = function (title, body, prompt, image, itemAmount, callback) {
        var trackingType = "shareItem_" + itemAmount.type + "_" + itemAmount.amount;
        getRpc().remoteCall("SagaApi.getShareItemUrlMessage", [itemAmount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getShareItemUrlMessage: result=", urlMessage);
                sendPost(trackingType, title, prompt, body, image, urlMessage, false, callback);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var shareItemGraph = function (title, body, linkText, image, itemAmount, actionName) {
        var trackingType = "shareItem_" + itemAmount.type + "_" + itemAmount.amount;
        getRpc().remoteCall("SagaApi.getShareItemUrlMessage", [itemAmount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getShareItemUrlMessage: result=", urlMessage);
                var link = SocialChannels.getGamePageUrl() + "?urlMessage=" + urlMessage;
                sendPostGraph(trackingType, linkText, title, body, "", link, image, actionName, link);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var shareItemToUser = function (title, body, prompt, image, itemAmount, toExternalUserId, callback) {
        var trackingType = "shareItemToUser_" + itemAmount.type + "_" + itemAmount.amount;
        getRpc().remoteCall("SagaApi.getShareItemUrlMessage", [itemAmount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getShareItemUrlMessage: result=", urlMessage);
                sendPostToUser(trackingType, title, prompt, body, image, urlMessage, toExternalUserId, callback);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var requestItem = function (title, message, itemAmount, image) {
        var trackingType = "requestItem_" + itemAmount.type + "_" + itemAmount.amount;
        getRpc().remoteCall("SagaApi.getRequestItemUrlMessage", [itemAmount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getRequestItemUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'message', urlMessage);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var requestItemFromUser = function (title, message, itemAmount, externalUserId, image) {
        var trackingType = "requestItemFromUser_" + itemAmount.type + "_" + itemAmount.amount;
        getRpc().remoteCall("SagaApi.getRequestItemUrlMessage", [itemAmount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getRequestItemUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'message', urlMessage, [externalUserId]);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var giveItemToUser = function (title, message, itemAmount, externalUserId, image, callback) {
        var trackingType = "giveItemToUser_" + itemAmount.type + "_" + itemAmount.amount;
        getRpc().remoteCall("SagaApi.getGiveItemUrlMessage", [itemAmount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getGiveItemUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [externalUserId], callback);
            },
            function (error) {
                console.log(error);
                callback({error:error});
            }
        );
    };

    var giveItemToMany = function (title, message, itemAmount, externalUserIds, image) {
        var trackingType = "giveItemToUser_" + itemAmount.type + "_" + itemAmount.amount;
        getRpc().remoteCall("SagaApi.getGiveItemUrlMessage", [itemAmount, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getGiveItemUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var notifyProductGiftToUser = function (title, message, categoryId, productId, externalUserId, image) {
        var trackingType = "gift_" + categoryId + "_" + productId;
        getRpc().remoteCall("SagaApi.getProductGiftUrlMessage", [categoryId, productId, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getProductGiftUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [externalUserId]);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var requestLife = function (title, message, image) {
        var trackingType = "requestLife";
        getRpc().remoteCall("SagaApi.getRequestLifeUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getRequestLifeUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'message', urlMessage);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var requestLifeFromUser = function (title, message, externalUserId, image) {
        var trackingType = "requestLifeFromUser";
        getRpc().remoteCall("SagaApi.getRequestLifeUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getRequestLifeUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'message', urlMessage, [externalUserId]);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var requestLifeFromMany = function (title, message, externalUserIds, image) {
        var trackingType = "requestLifeFromMany";
        getRpc().remoteCall("SagaApi.getRequestLifeUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getRequestLifeUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'message', urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var giveLifeToUserWithoutPublishing = function (title, message, externalUserId, image) {
        giveLifeToUser(title,message,externalUserId,image,function() {});
    };

    /**
     *
     * @param title
     * @param message
     * @param externalUserId
     * @param image
     * @param publisher optional, override default behaviour of give life success.
     */
    var giveLifeToUser = function (title, message, externalUserId, image, publisher) {
        var trackingType = "giveLifeTo";
        giveLifeToUserWithTracking(title, message, externalUserId, image, trackingType, publisher)
    };

    /**
     *
     * @param title
     * @param message
     * @param externalUserId
     * @param image
     * @param publisher optional, override default behaviour of give life success.
     * @param trackingType
     */
    var giveLifeToUserWithTracking = function (title, message, externalUserId, image, trackingType, publisher) {

        getRpc().remoteCall("SagaApi.getGiveLifeUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getGiveLifeUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [externalUserId], function (response) {
                    console.log('response = ', JSON.stringify(response));
                    if (response.status == 'ok' && settings.hasPublishActions) {
                        if (publisher != undefined && publisher != "") {
                            publisher();
                        } else {
                            publishStory("give", {
                                item: {type: "life"},
                                receiver: externalUserId
                            });
                        }
                    }
                });

            },
            function (error) {
                console.log(error);
            }
        );
    };

    var giveLifeToMany = function (title, message, externalIds, image) {
        var trackingType = "giveLifeToMany";
        giveLifeToManyWithTracking(title, message, externalIds, trackingType, image);
    };


     var giveLifeToManyWithTracking = function (title, message, externalIds, trackingType, image) {
        console.log("Saga.giveLifeToMany(" + title + ", " + message + ", " + externalIds + ")");

        getRpc().remoteCall("SagaApi.getGiveLifeUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getGiveLifeUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, externalIds, function (response) {
                    console.log("openRequestDialog response = ", JSON.stringify(response));

                    if (response.status == 'ok' && settings.hasPublishActions) {
//                            SocialChannels.shareLifeGift({objectId:1, receiverId:externalIds});
                    }
                });
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var requestLevelUnlock = function (title, message, episodeId, levelId, image) {
        var trackingType = "requestLevelUnlock";
        getRpc().remoteCall("SagaApi.getRequestUnlockUrlMessage", [episodeId, levelId, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getRequestUnlockUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'invite', urlMessage);
            },
            function (error) {
                console.log(error);
            }
        );
    };


    var requestLevelUnlockFromMany = function (title, message, episodeId, levelId, externalUserIds, image) {
        var trackingType = "requestLevelUnlock";
        getRpc().remoteCall("SagaApi.getRequestUnlockUrlMessage", [episodeId, levelId, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getRequestUnlockUrlMessage: result=", urlMessage);
                openRequestDialog(trackingType, title, message, image, 'invite', urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var acceptLevelUnlock = function (title, message, toExternalUserId, episodeId, levelId, image) {
        var trackingType = "giveLevelUnlock";
        getRpc().remoteCall("SagaApi.getGiveLevelUnlockUrlMessage", [episodeId, levelId, trackingType],
            function (urlMessage) {
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [toExternalUserId], function (response) {
                    console.log("openRequestDialog response = ", JSON.stringify(response));
                    publishStory("help", {
                        profile:toExternalUserId,
                        episode:{ number:episodeId }
                    });
                });
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var acceptLevelUnlockToMany = function (title, message, externalUserIds, episodeId, levelId, image) {
      var trackingType = "giveLevelUnlock";
        getRpc().remoteCall("SagaApi.getGiveLevelUnlockUrlMessage", [episodeId, levelId, trackingType],
            function (urlMessage) {
                openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, externalUserIds, function (response) {
                    console.log("openRequestDialog response = ", JSON.stringify(response));
                });
            },
            function (error) {
                console.log(error);
            }
        );
    };

    var publishStory = function (verb, details) {
        SocialChannels.publishStory(verb, details);
    };

    var hasDepositFunds = function () {
        return SocialChannels.hasDepositFunds();
    };

    var depositFunds = function () {
        console.log("Saga.depositFunds");
        jQuery("#links").css('display', 'none');
        SocialChannels.depositFunds(function (response) {
            jQuery("#links").css('display', 'block');
            getGame().depositFundsCallback(response.status);
        });
    };

    var hasEarnFunds = function () {
        return SocialChannels.hasEarnFunds();
    };

    var earnFunds = function () {
        console.log("Saga.earnFunds");
        jQuery("#links").css('display', 'none');
        SocialChannels.earnFunds(function (response) {
            jQuery("#links").css('display', 'block');
            if (settings.directMode) showGame();
            getGame().earnFundsCallback(response.status);
        });
    };

    var hasLike = function () {
        return SocialChannels.hasLike();
    };

    var getDoesLike = function () {
        SocialChannels.getDoesLike(function (resp) {
            getGame().setVar("fan", resp);
        });
    };

    var buyAnyProduct = function (categoryId, productId) {
        console.log("Saga.buyAnyProduct");
        jQuery("#links").css('display', 'none');
        SocialChannels.buy({ categoryId:categoryId, productId:productId }, buyAnyProductCallback);
    };

    var buyAnyProductTo = function (categoryId, productId, receiverCoreUserId) {
        console.log("Saga.buyAnyProductTo");
        jQuery("#links").css('display', 'none');
        SocialChannels.gift({ categoryId:categoryId, productId:productId, receiverCoreUserId:receiverCoreUserId }, buyAnyProductToCallback);
    };

    var shareCharmGift = function (charm_name, toExternalUserId) {
        if (settings.hasPublishActions) {
            SocialChannels.publishStory("give", {
                item:{ type:"charm", instance:charm_name },
                receiver:toExternalUserId
            });
        }
    };

    var shareLevelComplete = function (level, score, stars) {
        if (settings.hasPublishActions) {
            SocialChannels.publishStory("complete", {
                level:{ levelid:level },
                score:score,
                stars:stars
            });
        }
    };

    var buyLevelUnlockProduct = function (productId, episodeId, levelId) {
        console.log("Saga.buyLevelUnlockProduct");
        jQuery("#links").css('display', 'none');
        SocialChannels.buy({ categoryId:_productCategory.levelUnlock, productId:productId }, buyLevelUnlockProductCallback);
    };

    var buyGoldProduct = function (productId) {
        console.log("Saga.buyGoldProduct");
        jQuery("#links").css('display', 'none');
        SocialChannels.buy({ categoryId:_productCategory.gold, productId:productId }, buyGoldProductCallback);
    };

    var buyLifeProduct = function (productId) {
        console.log("Saga.buyLifeProduct");
        jQuery("#links").css('display', 'none');
        SocialChannels.buy({ categoryId:_productCategory.life, productId:productId }, buyLifeProductCallback);
    };

    var buyIngameProduct = function (productId) {
        console.log("Saga.buyIngameProduct");
        jQuery("#links").css('display', 'none');
        SocialChannels.buy({ categoryId:_productCategory.ingame, productId:productId }, buyIngameProductCallback);
    };


    var buyRecipeTopupProductCallback = function (result) {
        console.log("Saga.recipeTopupProductPurchaseDone");
        jQuery("#links").css('display', 'block');
        getGame().buyRecipeTopupProductCallback(result);
    };

    var buyRecipeTopupProduct = function (itemAmounts, recipe) {
        console.log("Saga.buyRecipeTopupProduct");
        jQuery("#links").css('display', 'none');
        SocialChannels.buyRecipeTopup({ categoryId:_productCategory.recipeTopup, itemAmounts:itemAmounts, recipe:recipe }, buyRecipeTopupProductCallback);
    };

    // Buy product callbacks
    var buyLevelUnlockProductCallback = function (result) {
        console.log("Saga.levelUnlockPurchaseDone");
        jQuery("#links").css('display', 'block');
        getGame().buyLevelUnlockProductCallback(result);
    };

    var buyGoldProductCallback = function (result) {
        console.log("Saga.goldProductPurchaseDone");
        jQuery("#links").css('display', 'block');
        getGame().buyGoldProductCallback(result);
    };

    var buyLifeProductCallback = function (result) {
        console.log("Saga.lifeProductPurchaseDone");
        jQuery("#links").css('display', 'block');
        getGame().buyLifeProductCallback(result);
    };

    var buyIngameProductCallback = function (result) {
        console.log("Saga.ingameProductPurchaseDone");
        jQuery("#links").css('display', 'block');
        getGame().buyIngameProductCallback(result);
    };

    var buyAnyProductCallback = function (result) {
        console.log("Saga.buyAnyProductCallback");
        jQuery("#links").css('display', 'block');
        getGame().buyAnyProductCallback(result);
    };

    var buyAnyProductToCallback = function (result) {
        console.log("Saga.buyAnyProductToCallback");
        jQuery("#links").css('display', 'block');
        getGame().buyAnyProductToCallback(result);
    };

    var setDoneLoading = function (productId) {
//        FB.Canvas.setDoneLoading(function foo(result) {
//            //result.time_delta_ms;
//        });
    };

    var getGame = function () {
        return window['game'] || document['game'];
    };

    var reload = function (/*ref, message*/) {
        top.location.href = SocialChannels.getGamePageUrl();
    };

    var openFanDialog = function () {
        console.log("Saga.openFanDialog");
        settings._closeFanDialogCallback = getDoesLike;
        $("#" + settings.fanContainer).load('/fan.jsp?_session=' + settings.sessionKey);
        jQuery("#links").css('display', 'none');
        if (settings.directMode) hideGame();
        $("#" + settings.fanContainer).css('display', 'block');
    };

    // Hack: Jonas M
    var openFanDialog2 = function () {
        console.log("Saga.openFanDialog2");
        settings._closeFanDialogCallback = notifyGameOnCloseFanDialog2;
        $("#" + settings.fanContainer).load('/fan.jsp');
        jQuery("#links").css('display', 'none');
        if (settings.directMode) hideGame();
        $("#" + settings.fanContainer).css('display', 'block');
    };

    var closeFanDialog = function () {
        console.log("Saga.closeFanDialog");
        jQuery("#links").css('display', 'block');
        if (settings.directMode) showGame();
        $("#" + settings.fanContainer).css('display', 'none');
        settings._closeFanDialogCallback();
    };

    var notifyGameOnCloseFanDialog2 = function () {
        getGame().onCloseFanDialog2();
    };

    var openPrivacyDialog = function () {
        jQuery("#" + settings.gameContainer).css('height', '1').css('width', '1');
        jQuery("#" + settings.game).css('height', '1').css('width', '1');
        jQuery("#links").css('display', 'none');
        if (settings.directMode) hideGame();
        jQuery("#bottomBanner").css('display', 'none');
        $("#" + settings.privacyContainer).css('display', 'block');
    };

    var closePrivacyDialog = function () {
        jQuery("#" + settings.gameContainer).css('height', '650').css('width', '755');
        jQuery("#" + settings.game).css('height', '650').css('width', '755');
        jQuery("#links").css('display', 'block');
        if (settings.directMode) showGame();
        jQuery("#bottomBanner").css('display', 'block');
        $("#" + settings.privacyContainer).css('display', 'none');
    };

    var reportBrowserPlatform = function (flashVersion, availableWidth, availableHeight, hasCanvas, hasWebGL, hasAppCache) {
        getRpc().remoteCall("SagaApi.reportBrowserPlatform", [flashVersion, availableWidth, availableHeight, hasCanvas, hasWebGL, hasAppCache], function () {
        }, function () {
        });
    };

    var showGame = function () {
        if (settings.unconditionalHideShowGame || $("#game_pause").length > 0) {
            if (!settings.unconditionalHideShowGame) {
                $("#game").css("top", 0);
            }
            Saga.getGame().enable();
        }
    };

    var hideGame = function () {
        if (settings.unconditionalHideShowGame || $("#game_pause").length > 0) {
            if (!settings.unconditionalHideShowGame) {
                $("#game").css("top", -10000);
            }
            Saga.getGame().disableAndSetPauseImage();
        }
    };

    return {
        init:init,
        setFlashUrlHandler:setFlashUrlHandler,
        setUrlHandler:setUrlHandler,
        getRpc:getRpc,
        getImageURL:getImageURL,
        sendPost:sendPost,
        sendPostToUser:sendPostToUser,
        shareItemGraph:shareItemGraph,
        sendPostGraph:sendPostGraph,
        inviteFriends:inviteFriends,
        inviteFriendsWithoutGivingGold:inviteFriendsWithoutGivingGold, 
        openRequestDialog:openRequestDialog,
        shareGold:shareGold,
        shareGoldToUser:shareGoldToUser,
        giveGoldToUser:giveGoldToUser,
        giveGoldToMany:giveGoldToMany,
        requestLife:requestLife,
        requestLifeFromUser:requestLifeFromUser,
        requestLifeFromMany:requestLifeFromMany,
        giveLifeToUserWithoutPublishing:giveLifeToUserWithoutPublishing,
        giveLifeToUser:giveLifeToUser,
        giveLifeToUserWithTracking: giveLifeToUserWithTracking,
        giveLifeToMany:giveLifeToMany,
        giveLifeToManyWithTracking: giveLifeToManyWithTracking,
        requestLevelUnlock:requestLevelUnlock,
        requestLevelUnlockFromMany:requestLevelUnlockFromMany,
        acceptLevelUnlock:acceptLevelUnlock,
        acceptLevelUnlockToMany:acceptLevelUnlockToMany,
        openFanDialog:openFanDialog,
        openFanDialog2:openFanDialog2, // Hack: Jonas M
        closeFanDialog:closeFanDialog,
        hasDepositFunds:hasDepositFunds,
        depositFunds:depositFunds,
        hasEarnFunds:hasEarnFunds,
        earnFunds:earnFunds,
        hasLike:hasLike,
        getDoesLike:getDoesLike,
        buyAnyProduct:buyAnyProduct,
        buyAnyProductTo:buyAnyProductTo,
        notifyProductGiftToUser:notifyProductGiftToUser,
        buyLevelUnlockProduct:buyLevelUnlockProduct,
        buyGoldProduct:buyGoldProduct,
        buyLifeProduct:buyLifeProduct,
        buyIngameProduct:buyIngameProduct,
        buyRecipeTopupProduct:buyRecipeTopupProduct,
        openPrivacyDialog:openPrivacyDialog,
        closePrivacyDialog:closePrivacyDialog,
        setDoneLoading:setDoneLoading,
        getGame:getGame,
        reload:reload,
        shareItem:shareItem,
        shareItemToUser:shareItemToUser,
        requestItem:requestItem,
        requestItemFromUser:requestItemFromUser,
        giveItemToUser:giveItemToUser,
        giveItemToMany:giveItemToMany,
        shareCharmGift:shareCharmGift,
        shareLevelComplete:shareLevelComplete,
        reportBrowserPlatform:reportBrowserPlatform,
        showGame:showGame,
        hideGame:hideGame,
        publishStory:publishStory,
        notificationToMany:notificationToMany,
        sendMapFriendPassedToMany:sendMapFriendPassedToMany,
        sendToplistFriendBeatenToMany:sendToplistFriendBeatenToMany
    };
}();

