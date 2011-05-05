cb( {

    extends: "http://localhost/glge.js",

    source: "vwf-view-glge/collada/level.xml",
    type: "model/x-glge",

    children:
    {
        maincamera: {
            extends: "http://localhost/camera.js",
            properties: { angle: 0, },
        },
        
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
                "prop": {
                    extends: "http://localhost/node3.js",
                
                },
            },

        },

    }

} )



/*

      children:
      {
            bone1:
            {
               extends: "http://localhost/node3.js",
               properties:
               {
                  enabled: true,
               },
               children:
               {
                  untitled:
                  {
                     extends: "http://localhost/node3.js",
                     properties:
                     {
                        enabled: true,
                     },
                     children:
                     {
                        LOD3sp:
                        {
                           extends: "http://localhost/node3.js",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                              undefined:
                              {
                                 extends: 'http://localhost/node3.js'
                                 properties:
                                 {
                                    angle: 0,
                                 },
                              },
                           },
                        },
                        camera1:
                        {
                           extends: "http://localhost/node3.js",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                           },
                        },
                        directionalLight1:
                        {
                           extends: "http://localhost/node3.js",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                           },
                        },
                     },
                  },
               },
            },
      }
      children:
      {
            bone1:
            {
               extends: "http://localhost/node3.js",
               properties:
               {
                  enabled: true,
               },
               children:
               {
                  untitled:
                  {
                     extends: "http://localhost/node3.js",
                     properties:
                     {
                        enabled: true,
                     },
                     children:
                     {
                        plane:
                        {
                           extends: "http://localhost/node3.js",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                              undefined:
                              {
                                 extends: 'http://localhost/node3.js'
                                 properties:
                                 {
                                    angle: 0,
                                 },
                              },
                              prop:
                              {
                                 extends: "http://localhost/node3.js",
                                 properties:
                                 {
                                    enabled: true,
                                 },
                                 children:
                                 {
                                    undefined:
                                    {
                                       extends: 'http://localhost/node3.js'
                                       properties:
                                       {
                                          angle: 0,
                                       },
                                    },
                                 },
                              },
                           },
                        },
                        directionalLight1:
                        {
                           extends: "http://localhost/node3.js",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                           },
                        },
                        camera1:
                        {
                           extends: "http://localhost/node3.js",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                           },
                        },
                     },
                  },
               },
            },
      }

*/