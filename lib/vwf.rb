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

class VWF < Sinatra::Base

  require "vwf/pattern"

  configure do

    set :root, File.expand_path( File.join( File.dirname(__FILE__), ".." ) )
    set :static, false # we serve out of :public_folder, but only relative to vwf applications

    set :support, lambda { File.join( settings.root, "support" ) }

set :component_template_types, [ :json, :yaml ]  # get from Component?

  end

  configure :production do

    enable :logging

	  set :protection, :except => :frame_options # allow embedding into an iframe

  end

  configure :development do

    register Sinatra::Reloader

    require "logger"
    set :logging, ::Logger::DEBUG

    set :protection, :except => :frame_options # allow embedding into an iframe

  end

  # Delegate application GETs to the application. Pass requests not handled by the application to
  # other routes here.

  get Pattern.new do |script_name, path_info, application|

    logger.debug "VWF#get #{script_name} - #{path_info} - #{application}"

    delegate_to_application( script_name, path_info, application ).tap do |result|
      pass if result[0] == 404
    end

  end

  # Delegate application POSTs to the application.

  post Pattern.new do |script_name, path_info, application|

    logger.debug "VWF#post #{script_name} - #{path_info} - #{application}"

    delegate_to_application( script_name, path_info, application )

  end

  # Delegate application DELETEs to the application.

  delete Pattern.new do |script_name, path_info, application|

    logger.debug "VWF#delete #{script_name} - #{path_info} - #{application}"

    delegate_to_application( script_name, path_info, application )

  end

  # Delegate application PUTs to the application.

  put Pattern.new do |script_name, path_info, application|

    logger.debug "VWF#put #{script_name} - #{path_info} - #{application}"

    delegate_to_application( script_name, path_info, application )

  end

  # Serve files at "/proxy/<host>" from ^/support/proxy/<host>. We're pretending these come from
  # another host.

  get "/proxy/:host/*" do |host, path|

    delegated_env = env.merge(
      "SCRIPT_NAME" => "/proxy/" + host,
      "PATH_INFO" => "/" + path
    )

    cascade = Rack::Cascade.new [
      Rack::File.new( File.join VWF.settings.support, "proxy", host ),          # Proxied content from ^/support/proxy  # TODO: will match public_path/index.html which we don't really want
      Application::Component.new( File.join VWF.settings.support, "proxy", host ) # A component, possibly from a template or as JSONP  # TODO: before public for serving plain json as jsonp?
    ]

    cascade.call delegated_env

  end

  # Serve files not in any application as static content.

  get "/*" do |path|

    if path == ""
      path = "index.html"
    end

    delegated_env = env.merge(
      "PATH_INFO" => "/" + path
    )

    cascade = Rack::Cascade.new [
      Rack::File.new( VWF.settings.public_folder ),
      Application::Component.new( settings.public_folder )
    ]

    response = cascade.call delegated_env

    # index.html is normally rendered from a template during the build. As a special case for
    # development mode, when index.html is missing, render from the template with null content.

    if response[0] == 404

      if path == "index.html" && VWF.development?
        begin
          response = erb path.to_sym, { :views => VWF.settings.public_folder }, { :applications => [] }
        rescue Errno::ENOENT
          pass
        end
      else
        pass
      end

    end
  
    response

  end

  helpers do

    def delegate_to_application script_name, path_info, application

      delegated_env = env.merge(
        "SCRIPT_NAME" => script_name,
        "PATH_INFO" => path_info
      )

      Application.new( application, delegated_env ).call delegated_env

    end

  end
  
	not_found do
		if request.url.include?('/web') or not request.url.match(/[v][w][f].\w*\z/)
			[ 404, {'Content-Type' => 'text/html'}, File.read(File.join(File.dirname(__FILE__), '../public', '404.html')) ]
		end
	end
end


# Filesystem

# .../client/index.html                                         HTML for VWF client
# .../client/index.css                                          CSS for VWF client
# .../client/vwf.js                                             Script for VWF client

# .../public/path/to/component/                                 Directory containing component and dependent files
# .../public/path/to/component/index.vwf                        VWF component, native?
# .../public/path/to/component/index.vwf.json                   or, VWF component, JSON-encoded
# .../public/path/to/component/index.vwf.yaml                   or, VWF component, YAML-encoded
# .../public/path/to/component/model.dae                        Model referenced by index.vwf as: model.dae
# .../public/path/to/component/texture.png                      Texture referenced by model.dae as: texture.png

# .../public/path/to/component.vwf                              VWF component, native?
# .../public/path/to/component.vwf.json                         or, VWF component, JSON-encoded
# .../public/path/to/component.vwf.yaml                         or, VWF component, YAML-encoded
# .../public/path/to/model.dae                                  Model referenced by index.vwf as: model.dae
# .../public/path/to/texture.png                                Texture referenced by model.dae as: texture.png



# Locations

# From static files:

# http://vwf.example.com/path/to/component/                     Serves index.html to browser, index.vwf to VWF client

# http://vwf.example.com/path/to/component/index.html           Served from ^/.../public/path/to/component/index.html if client copied into component directory
# http://vwf.example.com/path/to/component/index.css            Served from ^/.../public/path/to/component/index.css if client copied into component directory
# http://vwf.example.com/path/to/component/vwf.js               Served from ^/.../public/path/to/component/vwf.js if client copied into component directory

# http://vwf.example.com/path/to/component/index.vwf            Served from ^/.../public/path/to/component/index.vwf as JSON only (not JSONP)
# http://vwf.example.com/path/to/component/model.dae            Served from ^/.../public/path/to/component/model.dae
# http://vwf.example.com/path/to/component/texture.png          Served from ^/.../public/path/to/component/texture.png


# A: component/index.vwf

# If serving JSON, YAML from templates or for JSONP:

# http://vwf.example.com/path/to/component/index.html           Served from ^/.../client
# http://vwf.example.com/path/to/component/index.css            Served from ^/.../client
# http://vwf.example.com/path/to/component/vwf.js               Served from ^/.../client

# http://vwf.example.com/path/to/component/index.vwf            Served from ^/.../public/path/to/component/index.vwf.json or .../index.vwf.yaml via template as JSON or JSONP
# http://vwf.example.com/path/to/component/model.dae            Served from ^/.../public/path/to/component/model.dae as static file
# http://vwf.example.com/path/to/component/texture.png          Served from ^/.../public/path/to/component/texture.png as static file

# If running collaboration service:

# http://vwf.example.com/path/to/component/socket               Socket to reflector for applications rooted at this component


# With instance:

# http://vwf.example.com/path/to/component/instance/

# http://vwf.example.com/path/to/component/instance/index.html  Served from ^/.../client
# http://vwf.example.com/path/to/component/instance/index.css   Served from ^/.../client
# http://vwf.example.com/path/to/component/instance/vwf.js      Served from ^/.../client

# http://vwf.example.com/path/to/component/instance/index.vwf   Served from ^/.../public/path/to/component/index.vwf.json or .../index.vwf.yaml via template as JSON or JSONP
# http://vwf.example.com/path/to/component/instance/model.dae   Served from ^/.../public/path/to/component/model.dae as static file
# http://vwf.example.com/path/to/component/instance/texture.png Served from ^/.../public/path/to/component/texture.png as static file

# http://vwf.example.com/path/to/component/instance/socket      Socket to reflector for applications rooted at this component



# B: component.vwf

# http://vwf.example.com/path/to/component.vwf/                 Serves index.html to browser, component.vwf to VWF client

# http://vwf.example.com/path/to/component.vwf/                 Served from ^/.../public/path/to/component.vwf or .../component.vwf.json or .../component.vwf.yaml
# http://vwf.example.com/path/to/component.vwf/model.dae        Served from ^/.../public/path/to/model.dae as static file
# http://vwf.example.com/path/to/component.vwf/texture.png      Served from ^/.../public/path/to/texture.png as static file

# http://vwf.example.com/path/to/component.vwf/index.html       Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/index.css        Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/vwf.js           Served from ^/.../client

# http://vwf.example.com/path/to/component.vwf/socket           Socket to reflector for applications rooted at this component

# With instance:

# http://vwf.example.com/path/to/component.vwf/instance/        Serves index.html to browser, component.vwf to VWF client

# http://vwf.example.com/path/to/component.vwf/instance/index.html Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/instance/index.css Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/instance/vwf.js  Served from ^/.../client

# http://vwf.example.com/path/to/component.vwf/instance/        Served from ^/.../public/path/to/component.vwf or .../component.vwf.json or .../component.vwf.yaml
# http://vwf.example.com/path/to/component.vwf/instance/model.dae Served from ^/.../public/path/to/model.dae as static file
# http://vwf.example.com/path/to/component.vwf/instance/texture.png Served from ^/.../public/path/to/texture.png as static file

# http://vwf.example.com/path/to/component.vwf/instance/socket  Socket to reflector for applications rooted at this component







# For location:

# http://vwf.example.com/path/to/application

# if any exist:

# http://vwf.example.com/path/to/application                    Content: http://vwf.example.com/some-application.vwf
# http://vwf.example.com/path/to/application.json               Content: { "extends": "http://vwf.example.com/some-application.vwf", "properties": ... }
# http://vwf.example.com/path/to/application.yaml               Content: --- // extends: http://vwf.example.com/some-application.vwf // properties: // .. ....

# http://vwf.example.com/path/to/application/                   Content: http://vwf.example.com/some-application.vwf

# http://vwf.example.com/path/to/application/index              Content: http://vwf.example.com/some-application.vwf
# http://vwf.example.com/path/to/application/index.json         Content: { "extends": "http://vwf.example.com/some-application.vwf", "properties": ... }
# http://vwf.example.com/path/to/application/index.yaml         Content: --- // extends: http://vwf.example.com/some-application.vwf // properties: // .. ....

# then:

# http://vwf.example.com/path/to/application/index.html         Served from ^/.../client
# http://vwf.example.com/path/to/application/index.css          Served from ^/.../client
# http://vwf.example.com/path/to/application/vwf.js             Served from ^/.../client
# etc.

# Creates instance and redirects to:

# http://vwf.example.com/path/to/application/instance

# http://vwf.example.com/path/to/application/instance/index.html Served from ^/.../client
# http://vwf.example.com/path/to/application/instance/index.css Served from ^/.../client
# http://vwf.example.com/path/to/application/instance/vwf.js    Served from ^/.../client
# etc.

# http://vwf.example.com/path/to/application/instance/socket    On connect, sends: createObject <application>


# ----- old -----


# look in "root/" + REQUEST_PATH
# if path is to template, create room and redirect
# tell client "createObject <contents of file>"

# http://vwf.example.com/<index>
# http://vwf.example.com/<index>/instance

# http://vwf.example.com/application
# http://vwf.example.com/application/instance

# http://vwf.example.com/path/to/<index>
# http://vwf.example.com/path/to/<index>/instance

# http://vwf.example.com/path/to/application
# http://vwf.example.com/path/to/application/instance


