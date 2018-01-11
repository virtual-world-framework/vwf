"use strict";

const path = require( "path" );

module.exports = {
  context:
    path.resolve( __dirname ),
  entry: {
    index: "./index.js",
  },
  output: {
    path: path.resolve( __dirname ),
    filename: "[name].bundle.js",
  },
  devtool:
    "source-map",
};
