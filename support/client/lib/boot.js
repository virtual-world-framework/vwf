require.config({
	   
	    paths: {
		"vwf": "../vwf"
	    },
		shims: {
			'vwf/view/xapi/xapiwrapper': {
				deps: ['vwf/view/editorview/sha256', "vwf/view/editorview/_3DRIntegration"],
				exports: 'XAPIWrapper'
			}
		},
	    waitSeconds: 15
	  });		
        require( [
            
            "domReady",
            "vwf/view/editorview/ObjectPools",
			"/socket.io/socket.io.js",
            // This is the common model implementation and an example model that connects the
            // simulation to a WebGL scene manager.
            "vwf/kernel/model",
            "vwf/model/javascript",
            "vwf/model/jiglib",
            "vwf/model/threejs",
            "vwf/model/scenejs",
            "vwf/model/object",
            "vwf/model/stage/log",
            "vwf/kernel/view",
            "vwf/view/document",
	        "vwf/view/EditorView",
            "vwf/view/threejs",
            "vwf/view/googleEarth",
            "vwf/utility",
			"vwf/view/WebRTC",
			"vwf/view/audio",
			"messageCompress",
			"vwf/view/xapi"

        ], function( ready ) {

            require("vwf/view/editorview/ObjectPools").getSingleton();
            ready( function() {

                // With the scripts loaded, we must initialize the framework. vwf.initialize()
                // accepts three parameters: a world specification, model configuration parameters,
                // and view configuration parameters.
				$(document.body).append('<div id="glyphOverlay" style="display:none"/>');
                vwf.initialize(

                    // This is the world specification. The world may be specified using a component
                    // literal as shown here, or the specification may be placed in a network-
                    // visible location and specified here as a URI or as a query parameter to this
                    // index page.
     
                    // As a literal:
                    //     { extends: "http://vwf.example.com/example-type.vwf", properties: { ... }, ... }
     
                    // As a string:
                    //     "http://vwf.example.com/example-type.vwf",
     
                    // These are the model configurations. Each key within the configuration object
                    // is a model name, and each value is an argument or an array of arguments to be
                    // passed to the model's constructor.
     
                    // With an array of arguments for the "example" model:
                    //     { example: [ p1, p2, ... ], // ==> new vwf.modules.example( vwf, p1, p2, ... ) }
     
                    // As a single argument to the "html" view:
                    //     { html: "#vwf-root" // ==> new vwf.modules.html( vwf, "#vwf-root" ) }
     
                    [
                        "vwf/model/javascript",
                        "vwf/model/jiglib",
                        "vwf/model/threejs",
                        "vwf/model/object",
                    ],

                    // These are the view configurations. They use the same format as the model
                    // configurations.

                    [
						
						{ "vwf/view/threejs": "#vwf-root" },
                        "vwf/view/document",
                        //"vwf/view/editor",
						"vwf/view/EditorView",
                    	"vwf/view/googleEarth",
						"vwf/view/WebRTC",
						"vwf/view/audio",
						"vwf/view/xapi"
                    ]

                );

            } );

        } );
