var app = module.exports = require( "express" )();

var bodyParser = require( "body-parser" ),
  cookieParser = require( "cookie-parser" ),
  cookieSession = require( "cookie-session" ),
  crypto = require( "crypto" ),
  config = require( "config" ),
  flash = require( "flash" ),
  express = require( "express" ),
  Promise = require( "bluebird" ),
  fs = Promise.promisifyAll( require( "fs-extra" ) ),
  mkdirp = Promise.promisify( require( "mkdirp" ) ),
  amqp = require( "amqplib" ),
  zipFolder = Promise.promisify( require( "zip-folder" ) ),
  _ = require( "lodash" );  version = require("../../support/client/lib/version");

var authentication = require( "./authentication" ),
  manifest = require( "./manifest" ),
  xapi = require( "./xapi" ),
  helpers = require( "./helpers" );

var indexLocals = require( "../../views/index/locals" );

app.set( "view engine", "jade" );

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false, limit: '50mb' } ) );
app.use( bodyParser.text() );
app.use( cookieParser() );
app.use( cookieSession( { secret: sessionSecret() } ) );
app.use( flash() );
app.use( "/bootstrap", express.static( "node_modules/bootstrap/dist" ) );
app.use( "/jquery", express.static( "node_modules/jquery/dist" ) );
app.use( "/layout.css", express.static( "public/layout.css" ) );
app.use( "/favicon.ico", express.static( "public/favicon.ico" ) ); 
app.use( authentication );

app.use( function( req, res, next ) {
  res.locals.user = req.isAuthenticated() ? req.user : undefined;
  next();
} );

app.get( "/", function( req, res ) {
  manifest().then( function( manifest ) {
    res.render( "index",
      _.merge( {}, indexLocals, { manifest: manifest || {}, title:version.getDerivativeVersion() || "ITDG" } )
    );
  } );
} );

app.get( "/map-list", function( req, res ) {
  var mapDir = "documents/ITDG/maps";

  // Ensure that the map directory exists, then get the list of files in the map directory
  mkdirp( mapDir )
    .then( made => fs.readdirAsync( mapDir ) )
    .then( files => res.send( { mapFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );

app.get( "/image-list", function( req, res ) {
  var imageDir = "documents/ITDG/image";

  // Ensure that the image directory exists, then get the list of files in the image directory
  mkdirp( imageDir )
    .then( made => fs.readdirAsync( imageDir ) )
    .then( files => res.send( { imageFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );

app.get( "/sound-list", function( req, res ) {
  var soundDir = "documents/ITDG/sound";

  // Ensure that the sound directory exists, then get the list of files in the sound directory
  mkdirp( soundDir )
    .then( made => fs.readdirAsync( soundDir ) )
    .then( files => res.send( { soundFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );

app.get( "/video-list", function( req, res ) {
  var videoDir = "documents/ITDG/video";

  // Ensure that the video directory exists, then get the list of files in the video directory
  mkdirp( videoDir )
    .then( made => fs.readdirAsync( videoDir ) )
    .then( files => res.send( { videoFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );

app.get( "/export-scenarios", function( req, res ) {
  var scenarioName = req.query.scenarioName;
  var appDir = "documents/ITDG";
  var stateBaseDir = appDir + "/" + scenarioName;
  var stateFilePath = stateBaseDir + "/saveState.vwf.json";
  fs.readFileAsync( stateFilePath )
    .then( jsonBuffer => {

      // Get an array of the files needed for this scenario
      var configPath = stateBaseDir + "/saveState.vwf.config.json";
      var filePathRegex = /"stream\/documents\/ITDG\/[^"]*"/g;
      var dependencyFilePaths =
        jsonBuffer
          .toString()
          .match( filePathRegex )
          .map( match => match.slice( 1, -1 ).replace( "stream/", "" ) );
      var inputFilePaths = [ stateFilePath, configPath ].concat( dependencyFilePaths );

      // Get an array of the output files that will be created in the staging area
      var tempDir = appDir + "/export/" + Math.random();
      var stagingDir = tempDir + "/staging";
      var outputFilePaths =
        inputFilePaths.map( inputFilePath =>
          inputFilePath.replace( "documents/ITDG", stagingDir ) );

      // Determine the list of directories that need to be created
      var zipDir = tempDir + "/output";
      var zipFilename = scenarioName + ".zip";
      var outputFileDirs = outputFilePaths.map( outputFilePath =>
        outputFilePath.slice( 0, outputFilePath.lastIndexOf( "/" ) ) );
      var dirsToCreate = [ stagingDir, zipDir ].concat( outputFileDirs );

      // Determine the path for the output zip file
      var zipFilePath = zipDir + "/" + zipFilename;

      // Perform the export
      Promise.all( dirsToCreate.map( dir => fs.mkdirpAsync( dir ) ) )
        .then( () =>
          Promise.all( inputFilePaths.map( ( inputFilePath, index ) =>
            fs.copyAsync( inputFilePath, outputFilePaths[ index ] ) ) ) )
        .then( () => zipFolder( stagingDir, zipFilePath ) )
        .then( () =>
          Promise.promisify( res.download ).call( res, zipFilePath ) )
        .then( () => fs.removeAsync( tempDir ) );
    } )
} );

app.post( "/scenarios", function( req, res, next ) {

  var now = new Date();

  var templateFilename =
    "documents/ITDG/" + "scenarioTemplate" + "/saveState.vwf.json";

  var scenarioName =
    req.body.name.trim().replace( /[^0-9A-Za-z]+/g, "-" );
  var scenarioTitle =
    req.body.title.trim();
  var scenarioFilename =
    "documents/ITDG/" + scenarioName + "/saveState.vwf.json";
  var scenarioFilename2 =
    "documents/ITDG/" + scenarioName + "/saveState_" + now.valueOf() + ".vwf.json";

  mkdirp( "documents/ITDG/" + scenarioName ).
    then( () => fs.readFileAsync( templateFilename ) ).
    then( json => JSON.parse( json ) ).
    then( state => createScenario( state ) ).
    tap( state => xapi.logCreation( state, "/ITDG", scenarioName, req.user ) ).
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
      scenarioName: scenarioName,
      scenarioTitle: scenarioTitle,
    } );

    return _.merge( state, patch );
  }

} );

app.post( "/sessions", function( req, res, next ) {

  var now = new Date();

  var scenarioName =
    req.body.name.trim().replace( /[^0-9A-Za-z]+/g, "-" );
  var scenarioFilename =
    "documents/ITDG/" + scenarioName + "/saveState.vwf.json";

  var sessionCompany =
    req.body.company.trim().replace( /[^0-9A-Za-z]+/g, "-" );
  var sessionPlatoon =
    Number( req.body.platoon ).toString();
  var sessionUnit =
    Number( req.body.unit ).toString();

  var sessionName =
    "class_" + scenarioName +
    "_Co" + sessionCompany +
    "_Plt" + sessionPlatoon +
    "_Unit" + sessionUnit +
    "_" + now.getFullYear();

  var sessionFilename =
    "documents/ITDG/" + sessionName + "/saveState.vwf.json";
  var sessionFilename2 =
    "documents/ITDG/" + sessionName + "/saveState_" + now.valueOf() + ".vwf.json";

  mkdirp( "documents/ITDG/" + sessionName ).
    then( () => fs.readFileAsync( scenarioFilename ) ).
    then( json => JSON.parse( json ) ).
    then( state => createSession( state ) ).
    tap( state => xapi.logCreation( state, "/ITDG", sessionName, req.user ) ).
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
        company: sessionCompany,
        platoon: sessionPlatoon,
        unit: sessionUnit,
      },
      dateOfClass:
        now.toISOString(),
    } );

    return _.merge( state, patch );
  }

} );

app.post( "/sim", function( req, res, next ) {
  amqp.connect( "amqp://" + config.get( "txs.amqp_host" ) ).
    then( connection => connection.createChannel() ).
    tap( channel => channel.assertExchange( config.get( "txs.amqp_exchange" ), "topic", { durable: false } ) ).
    tap( channel => channel.publish( config.get( "txs.amqp_exchange" ), config.get( "txs.amqp_channel" ), new Buffer( req.body.mission ) ) ).
    then( () => res.sendStatus( 200 ) ).
    catch( error => next( error ) );
} );

/// sessionSecret

function sessionSecret() {
  return config.get( "session.secret" ) ||
    crypto.randomBytes( 32 ).toString( "hex" );
}
