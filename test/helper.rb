ENV["RACK_ENV"] = "test"

require File.join( File.dirname(__FILE__), "..", "init" )

require "test/unit"
require "rack/test"
