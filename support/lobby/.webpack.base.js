"use strict";

const path = require( "path" ),
  ExtractText = require( "extract-text-webpack-plugin" );

module.exports = {
  context:
    path.resolve( __dirname ),
  entry: {
    index: [ "./index.js", "./index.css" ],
    login: [ "./login.js", "./login.css" ],
  },
  output: {
    path: path.resolve( __dirname ),
    filename: "[name].bundle.js",
  },
  devtool:
    "source-map",
  module: {
    rules: [ {
      test:
        /\.js$/,
      exclude:
        /node_modules/,
      loader:
        "babel-loader",
      options: {
        presets: [ "env", "react", "stage-2" ],
      },
    }, {
      test:
        /\.css$/,
      use:
        ExtractText.extract( { fallback: "style-loader", use: "css-loader" } ),
    } ]
  },
  plugins: [
    new ExtractText( { filename: "[name].bundle.css" } ),
  ]
};
