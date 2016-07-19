var app = module.exports = require( "express" )();

var bodyParser = require( "body-parser" ),
  cookieParser = require( "cookie-parser" ),
  cookieSession = require( "cookie-session" ),
  crypto = require( "crypto" ),
  config = require( "config" ),
  flash = require( "flash" ),
  express = require( "express" ),
  Promise = require( "bluebird" ),
  fs = Promise.promisifyAll( require( "fs" ) ),
  mkdirp = Promise.promisify( require( "mkdirp" ) ),
  _ = require( "lodash" );

var authentication = require( "./authentication" ),
  manifest = require( "./manifest" ),
  helpers = require( "./helpers" );

var indexLocals = require( "../../views/index/locals" );

app.set( "view engine", "jade" );

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.text() );
app.use( cookieParser() );
app.use( cookieSession( { secret: sessionSecret() } ) );
app.use( flash() );
app.use( "/bootstrap", express.static( "node_modules/bootstrap/dist" ) );
app.use( "/jquery", express.static( "node_modules/jquery/dist" ) );
app.use( authentication );

app.use( function( req, res, next ) {
  res.locals.user = req.isAuthenticated() ? req.user : undefined;
  next();
} );

app.get( "/", function( req, res ) {
  manifest().then( function( manifest ) {
    res.render( "index",
      _.merge( {}, indexLocals, { manifest: manifest || {} } )
    );
  } );
} );

app.post( "/scenarios", function( req, res, next ) {

  var now = new Date();

  var templateFilename =
    "documents/ITDG/" + "scenarioTemplate" + "/saveState.vwf.json";

  var scenarioName =
    req.body.name.replace( /[^0-9A-Za-z]+/g, "-" );
  var scenarioFilename =
    "documents/ITDG/" + scenarioName + "/saveState.vwf.json";
  var scenarioFilename2 =
    "documents/ITDG/" + scenarioName + "/saveState_" + now.valueOf() + ".vwf.json";

  mkdirp( "documents/ITDG/" + scenarioName ).
    then( () => fs.readFileAsync( templateFilename ) ).
    then( json => JSON.parse( json ) ).
    then( state => createScenario( state ) ).
    tap( state => xapiLogCreation( state, scenarioName, req.user ) ).
    then( state => JSON.stringify( state ) ).
    then( json => Promise.all( [ fs.writeFileAsync( scenarioFilename, json ), fs.writeFileAsync( scenarioFilename2, json ) ] ) ).
    then( () => res.status( 201 ).send( { document: { uri: helpers.JoinPath( "/ITDG", helpers.GenerateInstanceID(), "load", scenarioName ) } } ) ).
    catch( error => next( error ) );

  fs.readFileAsync( templateFilename.replace( /vwf.json$/, "vwf.config.json" ) ).
    then( json => Promise.all( [ fs.writeFileAsync( scenarioFilename.replace( /vwf.json$/, "vwf.config.json" ), json ), fs.writeFileAsync( scenarioFilename2.replace( /vwf.json$/, "vwf.config.json" ), json ) ] ) ).
    catch( error => next( error ) );

  /// Create a scenario from the template and request data.

  function createScenario( state ) {

    var patch = _.set( {}, "nodes[1].children.scenarioController.properties", {
      scenarioName: req.body.name,
      scenarioTitle: req.body.title,
    } );

    return _.merge( state, patch );
  }

} );

app.post( "/sessions", function( req, res, next ) {

  var now = new Date();

  var scenarioName =
    req.body.name.replace( /[^0-9A-Za-z]+/g, "-" );
  var scenarioFilename =
    "documents/ITDG/" + scenarioName + "/saveState.vwf.json";

  var sessionName =
    "class_" + scenarioName +
    "_Co" + req.body.company +
    "_Plt" + req.body.platoon +
    "_Unit" + req.body.unit +
    "_" + now.getFullYear();

  var sessionFilename =
    "documents/ITDG/" + sessionName + "/saveState.vwf.json";
  var sessionFilename2 =
    "documents/ITDG/" + sessionName + "/saveState_" + now.valueOf() + ".vwf.json";

  mkdirp( "documents/ITDG/" + sessionName ).
    then( () => fs.readFileAsync( scenarioFilename ) ).
    then( json => JSON.parse( json ) ).
    then( state => createSession( state ) ).
    tap( state => xapiLogCreation( state, sessionName, req.user ) ).
    then( state => JSON.stringify( state ) ).
    then( json => Promise.all( [ fs.writeFileAsync( sessionFilename, json ), fs.writeFileAsync( sessionFilename2, json ) ] ) ).
    then( () => res.status( 201 ).send( { document: { uri: helpers.JoinPath( "/ITDG", helpers.GenerateInstanceID(), "load", sessionName ) } } ) ).
    catch( error => next( error ) );

  fs.readFileAsync( scenarioFilename.replace( /vwf.json$/, "vwf.config.json" ) ).
    then( json => Promise.all( [ fs.writeFileAsync( sessionFilename.replace( /vwf.json$/, "vwf.config.json" ), json ), fs.writeFileAsync( sessionFilename2.replace( /vwf.json$/, "vwf.config.json" ), json ) ] ) ).
    catch( error => next( error ) );

  /// Create a session from a scenario and request data.

  function createSession( state ) {

    var patch = _.set( {}, "nodes[1].children.scenarioController.properties", {
      classroom: {
        company: req.body.company,
        platoon: req.body.platoon,
        unit: req.body.unit,
      },
      dateOfClass:
        now.toISOString(),
    } );

    return _.merge( state, patch );
  }

} );

/// sessionSecret

function sessionSecret() {
  return config.get( "session.secret" ) ||
    crypto.randomBytes( 32 ).toString( "hex" );
}

/// Record scenario or session creation in the xAPI log.

function xapiLogCreation( state, document, user ) {

  var descriptor = {
    state:
      _.get( state, "nodes[1].children.scenarioController.properties", {} ),
    document: {
      uri: "/0000000000000000/load/" + document + "/",
    }
  };

  var statement = JSON.stringify( {
    actor: xapiActor( user ),
    verb: xapiVerbs.imported,
    object: xapiActivity( descriptor ),
    stored: ( new Date ).toISOString(),
  } ) + "\n";

  mkdirp( "log/" ).then( () => fs.appendFileAsync( "log/xapi-statements.json", statement ) );

}

/// Return an xAPI [Actor] (https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#actor)
/// description of the user.
/// 
/// @param {Object} user
/// 
/// @returns {Object} xAPI Actor

function xapiActor( user ) {

  var name = n( user.first_name ) + n( user.middle_initial, "." ) +
    n( user.last_name );

  var account = a( user.first_name ) + a( user.middle_initial ) +
    a( user.last_name );

  name = name.slice( 0, -1 ) || "Unknown"
  account = account.slice( 0, -1 ) || "unknown"

  return {
    name:
      name,
    account: {
      homePage: "http://itdg.example.com",
      name: account
    }
  };

  function n( string, terminator ) {
    if ( string ) {
      return string + ( terminator || "" ) + " ";
    } else {
      return "";
    }
  }

  function a( string ) {
    var slug =
      string.replace( /[^0-9A-Za-z]+/, "-" ).toLowerCase();
    if ( slug ) {
      return slug + ".";
    } else {
      return "";
    }
  }

}

/// A selection of xAPI [Verbs] (https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#verb) from
/// the [ADL Controlled Vocabulary] (http://xapi.vocab.pub/datasets/adl/).

var xapiVerbs = {

  attended: {
    id: "http://adlnet.gov/expapi/verbs/attended",
    display: { "en-US": "attended" },
  },
  completed: {
    id: "http://adlnet.gov/expapi/verbs/completed",
    display: { "en-US": "completed" },
  },
  exited: {
    id: "http://adlnet.gov/expapi/verbs/exited",
    display: { "en-US": "exited" },
  },
  imported: {
    id: "http://adlnet.gov/expapi/verbs/imported",
    display: { "en-US": "imported" },
  },
  initialized: {
    id: "http://adlnet.gov/expapi/verbs/initialized",
    display: { "en-US": "initialized" },
  },
  interacted: {
    id: "http://adlnet.gov/expapi/verbs/interacted",
    display: { "en-US": "interacted" },
  },
  launched: {
    id: "http://adlnet.gov/expapi/verbs/launched",
    display: { "en-US": "launched" },
  },
  "logged-in": {
    id: "https://w3id.org/xapi/adl/verbs/logged-in",
    display: { "en-US": "logged-in" },
  },
  "logged-out": {
    id: "https://w3id.org/xapi/adl/verbs/logged-out",
    display: { "en-US": "logged-out" },
  },
  terminated: {
    id: "http://adlnet.gov/expapi/verbs/terminated",
    display: { "en-US": "terminated" },
  },

};

/// Return an xAPI [Activity Object] (https://github.com/adlnet/xAPI-Spec/blob/master/xAPI.md#object)
/// for the a scenario or session document or instance.
/// 
/// @param {Object} descriptor
///   `manifest.js`-style scenario or session descriptor containing the `state` and `document`
///   and/or `instance` fields.
/// 
/// @returns {Object} xAPI Activity Object

function xapiActivity( descriptor ) {

  return {
    id: descriptor.instance ||
      ( descriptor.document && descriptor.document.uri ),
    definition: {
      name: { "en-US": title( descriptor ) },
      type: "http://adlnet.gov/expapi/activities/simulation",
    }
  };

  function title( descriptor ) {

    var state = descriptor.state || {},
      classroom = state.classroom || {};

    if ( classroom.company || classroom.platoon || classroom.unit ) {
      return ( state.scenarioTitle || "Untitled Session" ) + ", " +
        "Company " + ( classroom.company || "-" ) + " " +
        "Platoon " + ( classroom.platoon || "-" ) + " " +
        "Unit " + ( classroom.unit || "-" );
    } else {
      return state.scenarioTitle || "Untitled Session";
    }

  }

}
