cb( {

    extends: "http://vwf.example.com/types/glge",

    source: "vwf-view-glge/collada/level.xml",
    type: "model/x-glge",

    children:
    {
        "maincamera": {
            extends: "http://vwf.example.com/types/camera",
        },
        
        "wallobject": {
            extends: "http://vwf.example.com/types/node3",
        },

        "duck.dae": {
            extends: "http://vwf.example.com/types/node3",

            properties: { angle: 0, playing: false },

            scripts: [ {
                text: "this.properties.angle.setter = function( value ) {" + " " +
                    "this.parent['http://localhost:8080/vwf-view-glge/collada/seymourplane_triangulate.dae'].angle = value + 1;" + " " + "}",
                type: "application/javascript"
            }, {
                text: "this.pointerClick = function() { this.playing = !this.playing }",
                type: "application/javascript"
            }, ],

        },

        "seymourplane_triangulate.dae": {
            extends: "http://vwf.example.com/types/node3",

            properties: { angle: 0, },

            children: {
                "bone1": {
                    extends: "http://vwf.example.com/types/node3",
                    
                    children: {
                        "untitled": {
                            extends: "http://vwf.example.com/types/node3",
                        },
                    },
                },
                "prop": {
                    extends: "http://vwf.example.com/types/node3",
                
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
               extends: "http://vwf.example.com/types/node3",
               properties:
               {
                  enabled: true,
               },
               children:
               {
                  untitled:
                  {
                     extends: "http://vwf.example.com/types/node3",
                     properties:
                     {
                        enabled: true,
                     },
                     children:
                     {
                        LOD3sp:
                        {
                           extends: "http://vwf.example.com/types/node3",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                              undefined:
                              {
                                 extends: 'http://vwf.example.com/types/node3'
                                 properties:
                                 {
                                    angle: 0,
                                 },
                              },
                           },
                        },
                        camera1:
                        {
                           extends: "http://vwf.example.com/types/node3",
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
                           extends: "http://vwf.example.com/types/node3",
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
               extends: "http://vwf.example.com/types/node3",
               properties:
               {
                  enabled: true,
               },
               children:
               {
                  untitled:
                  {
                     extends: "http://vwf.example.com/types/node3",
                     properties:
                     {
                        enabled: true,
                     },
                     children:
                     {
                        plane:
                        {
                           extends: "http://vwf.example.com/types/node3",
                           properties:
                           {
                              enabled: true,
                           },
                           children:
                           {
                              undefined:
                              {
                                 extends: 'http://vwf.example.com/types/node3'
                                 properties:
                                 {
                                    angle: 0,
                                 },
                              },
                              prop:
                              {
                                 extends: "http://vwf.example.com/types/node3",
                                 properties:
                                 {
                                    enabled: true,
                                 },
                                 children:
                                 {
                                    undefined:
                                    {
                                       extends: 'http://vwf.example.com/types/node3'
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
                           extends: "http://vwf.example.com/types/node3",
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
                           extends: "http://vwf.example.com/types/node3",
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