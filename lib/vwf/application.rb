# Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
# Secretary of Defense (Personnel & Readiness).
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
# 
#   http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

class VWF::Application

  def initialize resource, env

    @app = Rack::Builder.new do

      map "/" do

        run Rack::Cascade.new [

          Reflector.new( resource, env["vwf.root"] + "/" + env["vwf.application"], env["vwf.instance"] ), # The WebSocket reflector  # TODO: not for instance==nil?  # debugging: Reflector.new( :debug => true, :backend => { :debug => true } ),

          Client.new( File.join( VWF.settings.support, "client/lib" ),          # Client files from ^/support/client/lib
            File.join( VWF.settings.support, "client/libz" ) ),                 #   or ^/support/client/libz (in production mode, if exists)

          Rack::File.new( File.join VWF.settings.public_folder, env["vwf.root"] ),         # Public content from ^/public/path/to/application
          Component.new( File.join VWF.settings.public_folder, env["vwf.root"] ),          # A component descriptor, possibly from a template or as JSONP  # TODO: before public for serving plain json as jsonp?
          Persistence.new( File.join(VWF.settings.public_folder, env["vwf.root"]), env )         # EXPERIMENTAL: Save state to ^/public/path/to/application; DON'T ENABLE ON A PRODUCTION SERVER

        ]

      end

      map "/admin" do
        run Admin
      end

    end

  end
  
  def call env
    @app.call env
  end

  def self.call env
    new.call env
  end

  # Wrap Rack::File to serve "/" as "/index.html".

  class Client

    def initialize root, rootz
      if ENV['RACK_ENV'] == "production" && File.directory?( rootz )
        @file = Rack::File.new rootz
      else
        @file = Rack::File.new root
      end
    end

    def call env
      if %w[ GET HEAD ].include?( env["REQUEST_METHOD"] ) && env["PATH_INFO"] == "/"
        env["PATH_INFO"] = "/index.html"
      elsif %w[ GET HEAD ].include?( env["REQUEST_METHOD"] ) && env["PATH_INFO"] == "/socket.io.js"
        env["PATH_INFO"] = "/socket.io-0.6.js"
      end
      @file.call env
    end

  end

end
