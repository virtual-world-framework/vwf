"use strict";

const webpack = require( "webpack" ),
  merge = require( "webpack-merge" );

const base = require( "./.webpack.base.js" );

module.exports = merge( base, {} );
