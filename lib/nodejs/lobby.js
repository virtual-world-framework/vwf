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
  admZip = require( "adm-zip" ),
  upload = require( "multer" )( { dest: "documents/ITDG/imports/" } ),
  path = require( "path" ),
  _ = require( "lodash" );

var authentication = require( "./authentication" ),
  manifest = require( "./manifest" ),
  xapi = require( "./xapi" ),
  helpers = require( "./helpers" ),
  version = require("../../support/client/lib/version"),
  kmlHandler = require( "./kml-handler" );

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false, limit: '50mb' } ) );
app.use( bodyParser.text() );
app.use( cookieParser() );
app.use( cookieSession( { secret: sessionSecret() } ) );
app.use( flash() );
app.use( "/favicon.ico", express.static( "public/favicon.ico" ) );
app.use( "/ONR_Logo.jpg", express.static( "public/ONR_Logo.jpg" ) ); 
app.get( "/*.bundle.*", express.static( "support/lobby" ) );
app.use( "/node_modules/bootstrap/dist", express.static( "support/lobby/node_modules/bootstrap/dist" ) );

app.get( "/version", function( req, res ) {
  res.json( { version, title: version.getDerivativeVersion() || "ITDG" } );
} );

app.use( authentication );

app.use( function( req, res, next ) {
  res.locals.user = req.isAuthenticated() ? req.user : undefined;
  next();
} );

app.get( "/", function( req, res ) {
  res.sendFile( path.join( __dirname, "../../support/lobby", "index.html" ) );
} );

app.get( "/manifest", function( req, res ) {
  manifest().then( function( manifest ) {
    res.json( manifest );
  } );
} );

app.get( "/user", function( req, res ) {
  res.json( req.user );
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

  // Ensure that the video directory exists, then get the list of files in it
  mkdirp( videoDir )
    .then( made => fs.readdirAsync( videoDir ) )
    .then( files => res.send( { videoFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );

app.get( "/tracking-list", function( req, res ) {
  var trackingDir = "documents/ITDG/tracking";

  // Ensure that the tracking directory exists, then get the list of files in it
  mkdirp( trackingDir )
    .then( made => fs.readdirAsync( trackingDir ) )
    .then( files => res.send( { trackingFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );

app.get( "/affiliation-list", function( req, res ) {
  var affiliationDir = "documents/ITDG/affiliation";

  // Ensure that the affiliation directory exists, then get the list of files in it
  mkdirp( affiliationDir )
    .then( made => fs.readdirAsync( affiliationDir ) )
    .then( files => res.send( { affiliationFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );

app.get( "/metrics-list", function( req, res ) {
  var metricsDir = "documents/ITDG/metrics";

  // Ensure that the metrics directory exists, then get the list of files in it
  mkdirp( metricsDir )
    .then( made => fs.readdirAsync( metricsDir ) )
    .then( files => res.send( { metricsFilenames: files || [] } ) )
    .catch( err => next( err ) );
} );


app.get( "/export-scenarios", function( req, res ) {
  const scenarioName = req.query.scenarioName;
  const appDir = "documents/ITDG";
  const stateBaseDir = appDir + "/" + scenarioName;
  let inputFilePaths = [];
  Promise.all( [

    // Get the state files
    fs.readdirAsync( stateBaseDir ).then( paths => 
      inputFilePaths = inputFilePaths.concat( paths.map( path => stateBaseDir + "/" + path ) ) ),

    // Get the list of files referenced in the scenario
    fs.readFileAsync( stateBaseDir + "/saveState.vwf.json" )
      .then( jsonBuffer => {
        const filePathRegex = /"stream\/documents\/ITDG\/[^"]*"/g;
        const dependencyFilePaths =
          ( jsonBuffer.toString().match( filePathRegex ) || [] )
            .map( match => match.slice( 1, -1 ).replace( "stream/", "" ) );
        const fileExtensionRegex = /\.[^\.]*$/;
        const tifDependencyFilePaths =
          dependencyFilePaths
            .map( filePath => filePath.replace( fileExtensionRegex, ".tif" ) )
            .filter( tifPath => fs.existsSync( tifPath ) );
        const tmsDependencyFilePaths =
          dependencyFilePaths
            .map( filePath => filePath.replace( fileExtensionRegex, ".tms" ) )
            .filter( tmsPath => fs.existsSync( tmsPath ) );
        const jpgDependencyFilePaths =
          dependencyFilePaths
            .map( filePath => filePath.replace( fileExtensionRegex, ".jpg" ) )
            .filter( jpgPath => fs.existsSync( jpgPath ) );
        const gifDependencyFilePaths =
          dependencyFilePaths
            .map( filePath => filePath.replace( fileExtensionRegex, ".gif" ) )
            .filter( gifPath => fs.existsSync( gifPath ) );
        const pngDependencyFilePaths =
          dependencyFilePaths
            .map( filePath => filePath.replace( fileExtensionRegex, ".png" ) )
            .filter( pngPath => fs.existsSync( pngPath ) );
        inputFilePaths = _.union(
          inputFilePaths,
          dependencyFilePaths,
          tifDependencyFilePaths,
          tmsDependencyFilePaths,
          jpgDependencyFilePaths,
          gifDependencyFilePaths,
          pngDependencyFilePaths );
      } )
  ] ).then( () => {
    
    // Get an array of the output files that will be created in the staging area
    const tempDir = appDir + "/export/" + Math.random();
    const stagingDir = tempDir + "/staging";
    const outputFilePaths =
      inputFilePaths.map( inputFilePath =>
        inputFilePath.replace( "documents/ITDG", stagingDir ) );

    // Determine the list of directories that need to be created
    const zipDir = tempDir + "/output";
    const zipFilename = scenarioName + ".zip";
    const outputFileDirs = outputFilePaths.map( outputFilePath =>
      outputFilePath.slice( 0, outputFilePath.lastIndexOf( "/" ) ) );
    const dirsToCreate = [ stagingDir, zipDir ].concat( outputFileDirs );

    // Determine the path for the output zip file
    const zipFilePath = zipDir + "/" + zipFilename;

    // Perform the export
    Promise.all( dirsToCreate.map( dir => fs.mkdirpAsync( dir ) ) )
      .then( () =>
        Promise.all( inputFilePaths.map( ( inputFilePath, index ) =>
          fs.copyAsync( inputFilePath, outputFilePaths[ index ] ) ) ) )
      .then( () => zipFolder( stagingDir, zipFilePath ) )
      .then( () =>
        Promise.promisify( res.download ).call( res, zipFilePath ) )
      .then( () => fs.removeAsync( tempDir ) );
  } );
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

app.post( "/import-scenarios", upload.single( "file" ), function( req, res ) {
  var file = req.file;
  if ( file.mimetype === "application/x-zip-compressed" ) {
    var zip = new admZip( file.path );
    zip.extractAllTo( "documents/ITDG", true );
    res.end();
    fs.removeAsync( file.path );
  } else {
    res.status( 500 ).send( "File is not a .zip file: " + file.originalname );
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

app.post( "/sendKML", function( req, res, next ) {
  kmlHandler.sendKML( req, res, next );
} );

/// sessionSecret

function sessionSecret() {
  return config.get( "session.secret" ) ||
    crypto.randomBytes( 32 ).toString( "hex" );
}
