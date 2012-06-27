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

  def initialize root

    @app = Rack::Builder.new do

      map "/" do
        run Rack::Cascade.new [
          Reflector.new,                                                        # The WebSocket reflector  # TODO: not for instance==nil?  # Reflector.new( :debug => true, :backend => { :debug => true } ),
          Rack::File.new( File.join VWF.settings.support, "client/lib" ),       # Client files from ^/support/client/lib
          Rack::File.new( File.join VWF.settings.public_folder, root ),         # Public content from ^/public  # TODO: will match public_path/index.html which we don't really want
          Component.new( File.join VWF.settings.public_folder, root )           # A component, possibly from a template or as JSONP  # TODO: before public for serving plain json as jsonp?
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

end
