if (typeof (ExternalInterfaceRpc) === "undefined")
{
    window.ExternalInterfaceRpc = {};
}

var ExternalInterfaceRpc = function ()
{
    var flashObject = 'undefined';

    var init = function(aflashObject)
    {
        flashObject = aflashObject;
        console.log("initialized");
    };

    var receive = function (object)
    {
        if (object.method != undefined)
        {
            if (object.id != undefined)
            {
                lookup(object.method).apply(this, object.params.concat(
                    function (result)
                    {
                        reply({id: object.id, result: result});
                    }).concat(function (error)
                    {
                        reply({id: object.id, error: error});
                    }
                ));
            }
            else
            {
                lookup(object.method).apply(this, object.params);
            }
        }
        else
        {
            throw new Error("method not specified");
        }
    };

    var reply = function (response)
    {
        try
        {
            console.log("flashObject=", flashObject)
            flashObject.externalInterfaceRpcReceive(response);
        }
        catch (e)
        {
            console.log("failed to respond:", e);
        }
    };

    var lookup = function (name)
    {
        var temp = name.split(".");
        var target = window;
        for (index = 0; index < temp.length; index++)
        {
            target = target[temp[index]];
        }
        return target;
    };

    return {
        init: init,
        receive: receive
    };
}();

// export symbol(s) to enable compression
window['ExternalInterfaceRpc'] = ExternalInterfaceRpc;
