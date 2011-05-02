cb( {
    children:
    {
        scene:
        {
            name: "scene",
                        
            children:
            {
                earth:
                {
                    name: "earth",
                                
                    extends: "http://localhost/node3.js",

                    properties:
                    {
                        transform: [ 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 2, 3 ],
                        enabled: true,
                        angle: 0,
                    },
                },

                mars:
                {
                    name: "mars",
                                
                    extends: "http://localhost/node3.js",

                    properties:
                    {
                        transform: [ 1, 0, 0, 0, 1, 0, 0, 0, 1, 4, 5, 6 ],
                        enabled: true,
                        angle: 0,
                    },

                    scripts:
                    [
                        {
                            text:
                                "this.properties.angle.setter = function( value ) {" + " " +
                                    "this.parent.earth.angle = value + 1;" + " " +
                                "}",
                            type: "application/javascript"
                        },
                    ],
                },

                venus:
                {
                    name: "venus",

                    extends: "http://localhost/node3.js",
                    source: "http://assets.vwf.example.com/venus.js",
                    type: "x-model/scenejs",
                },
            },
        },
    },
} )
