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

class VWF::Application < Sinatra::Base

  def initialize application, env
    super nil
    @application = application
  end

  configure do

    enable :logging

    # Condition to detect browser requests, as opposed to XHR requests. Browser requests for
    # application resources should bootstrap the client, and singular application resources should
    # redirect to directory resources.

    set( :browser ) do |want_browser|
      condition do
        is_browser = !! request.accept.include?( "text/html" )  # `accept.include?`, not `accept?`; want explict `text/html`
        want_browser == is_browser
      end
    end

  end

  # Redirect singular application resources to directory resources. For example, from:
  # 
  #   /path/to/application => /path/to/application/
  #   /path/to/application.vwf => /path/to/application.vwf/
  # 

  get "", :browser => true do
    redirect to request.path_info + "/"
  end

  # Redirect singular application resources to directory resources. For example, from:
  # 
  #   /path/to/application/0123456789ABCDEF => /path/to/application/0123456789ABCDEF/
  #   /path/to/application.vwf/0123456789ABCDEF => /path/to/application.vwf/0123456789ABCDEF/
  # 

  get %r{^/[0-9A-Za-z]{16}$}, :browser => true do
    redirect to request.path_info + "/"
  end

  # Redirect from the application to an instance.

  get "/", :browser => true do
    redirect to "/" + random_instance_id + "/"
  end

  # Serve the reflector from "/0123456789ABCDEF/websocket"

  get %r{^/([0-9A-Za-z]{16})/(websocket/?.*)$} do |instance, path_info|
    request.script_name += "/" + instance
    request.path_info = "/" + path_info
    result = Reflector.new( @application + "/" + instance, @application, instance ).call env
    pass if result[0] == 404
    result
  end

  # Bootstrap the client from "/0123456789ABCDEF/" and serve the client files.

  get %r{^/([0-9A-Za-z]{16})/(.*)$} do |instance, path_info|
    request.script_name += "/" + instance
    request.path_info = "/" + path_info
    result = Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
    pass if result[0] == 404
    result
  end

  helpers do
  end

  # Generate a random string to be used as an instance id.

  def random_instance_id
    "%08x" % rand( 1 << 32 ) + "%08x" % rand( 1 << 32 ) # rand has 52 bits of randomness; call twice to get 64 bits
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
