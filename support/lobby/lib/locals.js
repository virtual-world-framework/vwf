export let version = {
  title: ( version => version[ 5 ] ? version[ 5 ][0] + " " + version[ 5 ].slice( 1, 4 ).join( "." ) : "" )
    ( [ 0, 8, 0, "", "", [ "ITDG", 2, 6, 7 ] ] ) || "ITDG"
};

export let session = {
  "vwf": {
    "client": {
      "properties": {
        "last_name": "Last",
        "first_name": "First",
        "middle_initial": "MI",
        "instructor": true
      }
    }
  },
  "passport": {
    "user": {
      "last_name": "Last",
      "first_name": "First",
      "middle_initial": "MI",
      "instructor": "instructor"
    }
  }
};

export let manifest = {
  "/index.vwf":
    {},
  "/test/component.vwf":
    {},
  "/test/index.vwf":
    {},
  "/test/json.vwf":
    {},
  "/test/yaml.vwf":
    {},
  "/ITDG/index.vwf": {
    "One": {
      "application":
        "/ITDG/index.vwf",
      "scenario": {
        "state": {
          "scenarioName": "One",
          "scenarioTitle": "One"
        },
        "completion": {
          "document": {
            "instructors": 0,
            "students": 0
          }
        },
        "document": {
          "uri": "/ITDG/B6eoGxgzNSHOCMgm/load/One/",
          "timestamp": "2017-12-06T18:17:46.000Z"
        }
      },
      "sessions": [
        {
          "state": {
            "scenarioName":
              "One",
            "scenarioTitle":
              "One",
            "classroom": {
              "company": "Co",
              "platoon": "1",
              "unit": "1"
            },
            "dateOfClass":
              "2017-12-06T18:17:56.606Z"
          },
          "completion": {
            "document": {
              "instructors": 0,
              "students": 0
            }
          },
          "document": {
            "uri": "/ITDG/1PTAXVPPpmIz7FQK/load/class_One_CoCo_Plt1_Unit1_2017/",
            "timestamp": "2017-12-06T18:17:56.000Z"
          }
        }
      ]
    }
  }
};
