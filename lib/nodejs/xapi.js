"use strict";

/// xAPI logging utilities. Record user experience events in an xAPI-format log.

var Promise = require( "bluebird" ),
  fs = Promise.promisifyAll( require( "fs" ) ),
  mkdirp = Promise.promisify( require( "mkdirp" ) ),
  _ = require( "lodash" );

/// Record scenario or session creation in the xAPI log.

exports.logCreation = function( state, application, document, user ) {

  var descriptor = {
    state:
      _.get( state, "nodes[1].children.scenarioController.properties", {} ),
    document: {
      uri: application + "/0000000000000000/load/" + document + "/" }
  };

  var statement = JSON.stringify( {
    actor: xapiActor( user ),
    verb: xapiVerbs.imported,
    object: xapiActivity( descriptor ),
    stored: ( new Date ).toISOString(),
  } ) + "\n";

  mkdirp( "log/" ).then( () => fs.appendFileAsync( "log/xapi-statements.json", statement ) );

};

exports.logClient = function( state, application, document, instance, user, joining, only ) {

  var descriptor = {
    state: state &&
      _.get( state, "nodes[1].children.scenarioController.properties", {} ),
    document: document && {
      uri: application + "/0000000000000000/load/" + document + "/" },
    instance: instance &&
      instance.replace( /index.vwf\//, "" ) + "/",
  };

  var statements = "";

  if ( only && joining ) {
    statements += JSON.stringify( {
      actor: xapiActor( user ),
      verb: xapiVerbs.launched,
      object: xapiActivity( descriptor ),
      result: document && instance &&
        { response: descriptor.instance },
      stored: ( new Date ).toISOString(),
    } ) + "\n";
  }

  statements += JSON.stringify( {
    actor: xapiActor( user ),
    verb: joining ? xapiVerbs.attended : xapiVerbs.exited,
    object: xapiActivity( descriptor ),
    stored: ( new Date ).toISOString(),
  } ) + "\n";

  if ( only && ! joining ) {
    statements += JSON.stringify( {
      actor: xapiActor( user ),
      verb: xapiVerbs.terminated,
      object: xapiActivity( descriptor ),
      stored: ( new Date ).toISOString(),
    } ) + "\n";
  }

  mkdirp( "log/" ).then( () => fs.appendFileAsync( "log/xapi-statements.json", statements ) );

};

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
      (string || "").replace( /[^0-9A-Za-z]+/, "-" ).toLowerCase();
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
    id: ( descriptor.document && descriptor.document.uri ) ||
      descriptor.instance,
    definition: {
      name: descriptor.state && { "en-US": title( descriptor ) },
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
