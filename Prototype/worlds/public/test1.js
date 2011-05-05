cb( {

    extends: "http://localhost/glge.js",

    source: "vwf-view-glge/collada/level.xml",
    type: "model/x-glge",

    children:
    {
        wallobject: {
            extends: "http://localhost/node3.js",
            properties: { angle: 0, },
        },

        "http://localhost:8080/vwf-view-glge/collada/duck.dae": {
            extends: "http://localhost/node3.js",

            properties: { angle: 0, },

            children: {
                "bone1": {
                    extends: "http://localhost/node3.js",

                    children: {
                        "untitled": {
                            extends: "http://localhost/node3.js",
                        },
                    },
                },
            },

            scripts: [ {
                text: "this.properties.angle.setter = function( value ) {" + " " +
                    "this.parent['http://localhost:8080/vwf-view-glge/collada/seymourplane_triangulate.dae'].angle = value + 1;" + " " + "}",
                type: "application/javascript"
            }, ],

        },

        "http://localhost:8080/vwf-view-glge/collada/seymourplane_triangulate.dae": {
            extends: "http://localhost/node3.js",

            properties: { angle: 0, },

            children: {
                "bone1": {
                    extends: "http://localhost/node3.js",
                    
                    children: {
                        "untitled": {
                            extends: "http://localhost/node3.js",
                        },
                    },
                },
            },

        },

    }

} )
