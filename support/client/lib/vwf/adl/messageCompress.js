var disableCompress = false;
var messageCompress = {
    pack: function(message) {
        if (disableCompress) return message;

        if (message.constructor != String)
            return message;
        if (!this.initialized)
            this.initialize();

        var packed = message + '';
        for (var i = 0; i < this.enc_mappings.length; i++)
            packed = packed.replace(this.enc_mappings[i][0], this.enc_mappings[i][1]);


        //testing	
        //	var unpacked = this.unpack(packed);
        //	if(unpacked != message)
        //		debugger;
        //	console.log('saved: ' + (message.length - packed.length));	
        return packed;

    },
    unpack: function(message) {
        if (disableCompress) return message;

        if (message.constructor != String)
            return message;

        if (!this.initialized)
            this.initialize();

        var unpacked = message + '';
        for (var i = 0; i < this.dnc_mappings.length; i++)
            unpacked = unpacked.replace(this.dnc_mappings[i][0], this.dnc_mappings[i][1]);

        return unpacked;

    },
    initialized: false,
    initialize: function() {

        this.addMapping('"tick"');
        this.addMapping('"eventData"');
        this.addMapping('"eventNodeData"');
        this.addMapping('"eventMessageData"');
        this.addMapping('"node"');
        this.addMapping('"time"');
        this.addMapping('"action"');
        this.addMapping('"member"');
        this.addMapping('"parameters"');
        this.addMapping('"button"');
        this.addMapping('"buttons"');
        this.addMapping('"clicks"');
        this.addMapping('"left"');
        this.addMapping('"right"');
        this.addMapping('"middle"');
        this.addMapping('"modifiers"');
        this.addMapping('"globalNormal"');
        this.addMapping('"globalSource"');
        this.addMapping('"globalPosition"');
        this.addMapping('"screenPosition"');
        this.addMapping('"pointerEnter"');
        this.addMapping('"pointerOut"');
        this.addMapping('"pointerIn"');
        this.addMapping('"pointerMove"');
        this.addMapping('"pointerOver"');
        this.addMapping('"pointerDown"');
        this.addMapping('"pointerUp"');
        this.addMapping('"pointerLeave"');
        this.addMapping('"pointerHover"');
        this.addMapping('"pointerWheel"');
        this.addMapping('"dispatchEvent"');
        this.addMapping('"keyDown"');
        this.addMapping('"keyUp"');
        this.addMapping('"shift"');
        this.addMapping('"ctrl"');
        this.addMapping('"meta"');
        this.addMapping('"alt"');
        this.addMapping('"distance"');
        this.addMapping('"transform"');
        this.addMapping('"false"');
        this.addMapping('"true"');
        this.addMapping('false');
        this.addMapping('true');
        this.addMapping('"position"');
        this.addMapping('"index-vwf"');
        this.addMapping('"getProperty"');
        this.addMapping('"setProperty"');
        this.addMapping('"key"');
        this.addMapping('"code"');
        this.addMapping('"char"');
        this.addMapping('"keysUp"');
        this.addMapping('"keysDown"');
        this.addMapping('"mods"');
        this.addMapping('"space"');
        this.addMapping('null');
        this.addMapping('"deltaY"');
        this.addMapping('"client"');

        this.initialized = true;
    },
    enc_mappings: [],
    dnc_mappings: [],
    addMapping: function(from) {
        var fromex = new RegExp(from, 'g');
        var to = String.fromCharCode(7) + String.fromCharCode(this.enc_mappings.length + 255);
        var toex = new RegExp(to, 'g');
        this.enc_mappings.push([fromex, to]);
        this.dnc_mappings.push([toex, from]);
    }
};



try {
    define(messageCompress);
} catch (e) {}
try {
    exports.messageCompress = messageCompress;
} catch (e) {}