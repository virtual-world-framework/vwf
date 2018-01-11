"use strict";

const webpack = require( "webpack" ),
  uglify = require( "uglifyjs-webpack-plugin" ),
  merge = require( "webpack-merge" );

const base = require( "./.webpack.base.js" );

module.exports = merge( base, {
  output: {
    filename: "[name].bundle.min.js",
  },
  plugins: [
    new webpack.DefinePlugin( { "process.env.NODE_ENV": JSON.stringify( "production" ) } ),
    new uglify( { sourceMap: true } ),
  ],
} );
