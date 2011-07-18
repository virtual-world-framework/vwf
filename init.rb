require "rubygems"

require "bundler"
Bundler.require

$LOAD_PATH << File.expand_path( File.join( File.dirname(__FILE__), "lib" ) )

require "server"
require "component"
require "reflector"
