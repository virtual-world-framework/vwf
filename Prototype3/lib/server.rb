require "component_templates"

class Server < Sinatra::Base

  require "server/application_pattern"

  configure do

    set :app_file, File.expand_path( File.join( File.dirname(__FILE__), "..", "init.rb" ) )

    set :client, lambda { File.join( settings.root, "public", "client" ) }
    set :applications, lambda { File.join( settings.root, "public", "applications" ) }  # TODO: better name

    set :component_template_types, [ :json, :yaml ]

    set :mock_filesystem, nil

    mime_type :json, "application/json"
    mime_type :jsonp, "application/javascript"

  end

  configure :production do
    use Rack::Logger, ::Logger::WARN  # TODO: remove after Sinatra 1.3
    enable :logging
  end

  configure :development do
    use Rack::Logger, ::Logger::INFO  # TODO: remove after Sinatra 1.3
    set :logging, ::Logger::INFO
  end

  configure :test do

    use Rack::NullLogger  # TODO: remove after Sinatra 1.3

    # For testing, assume that the filesystem consists of these directories containing these files.

    MOCK_FILESYSTEM =
    {
      "/" =>                    [ "index.vwf", "component.vwf" ],
      "/directory" =>           [ "index.vwf", "component.vwf" ]
    }

    set :mock_filesystem, MOCK_FILESYSTEM

  end

  get "/test/test" do
    TestServer.new.call env.merge( "PATH_INFO" => "/" )
  end
  
  get "/test/test/*" do |path|
    TestServer.new.call env.merge( "PATH_INFO" => "/#{path}" )
  end
  
  get %r{/types/(.*)} do |path|  # TODO: "/types"?
    begin
      json path.to_sym
    rescue Errno::ENOENT  # TODO: there must be a better way to do this
      yaml path.to_sym
    end
  end

# websocket[/sessionid]


  get ApplicationPattern.new do |public_path, application, session, private_path|

# redirect file to directory for wants-html, not for wants-javascript
#~ remove application_path, replace with public_path
#* change public_path to private_path
#* remove socket, show in private_path
#* allow application to be not nil when file (not directory); test path here

# request.route
# @route ||= Rack::Utils.unescape(path_info)


    logger.debug "Server#get ApplicationPattern #{public_path} #{application} #{session} #{private_path}"

    # if application.nil?
    #   redirect to( ApplicationPattern.assemble application_path, "dummy", session, socket, public_path )

    # Redirect "/path/to/application" to "/path/to/application/", and "/path/to/application/session"
    # to "/path/to/application/session/".

    if private_path.nil? && request.route[-1,1] != "/"
      redirect to request.route + "/"

    # For "/path/to/application/", create a session and redirect to "/path/to/application/session/".

    # elsif session.nil?
    #   redirect to( ApplicationPattern.assemble application_path, public_path, application, "0000000000000000", private_path )  # TODO: create session

    elsif private_path.nil? && session.nil?
      redirect to request.route + "0000000000000000/"

    # Delegate session socket connections to the reflector.

    elsif private_path =~ %r{^(socket|websocket)(/|$)}
      Socketsss.new.call env.merge( "vwf.application" => application )  # TODO: path?

    # Delegate everything else to the static file server on the client files directory.

    else
s=  Rack::File.new( settings.applications ).call env.merge( "PATH_INFO" => "#{ public_path }/#{ private_path || "index.html" }" )
puts "#{settings.applications} #{public_path} #{private_path} #{s[0]}"

if s[0] != 200
s=      Rack::File.new( settings.client ).call env.merge( "PATH_INFO" => "/#{ private_path || "index.html" }" )
end
s

    end

  end

  helpers do

    def json template, options = {}, locals = {}
      render :json, template, options.merge( component_options ), locals
    end

    def yaml template, options = {}, locals = {}
      render :yaml, template, options.merge( component_options ), locals
    end

    def logger  # TODO: remove after Sinatra 1.3
      request.logger
    end

  private

    def component_options
      if callback = params["callback"]
        { :layout => false, :views => "./types", :default_content_type => :jsonp, :callback => callback }
      else
        { :layout => false, :views => "./types", :default_content_type => :json }
      end
    end

  end

end


# Filesystem

# .../client/index.html                                       HTML for VWF client
# .../client/index.css                                        CSS for VWF client
# .../client/vwf.js                                           Script for VWF client

# .../public/path/to/component/                               Directory containing component and dependent files
# .../public/path/to/component/index.vwf                      VWF component, native?
# .../public/path/to/component/index.vwf.json                 or, VWF component, JSON-encoded
# .../public/path/to/component/index.vwf.yaml                 or, VWF component, YAML-encoded
# .../public/path/to/component/model.dae                      Model referenced by index.vwf as: model.dae
# .../public/path/to/component/texture.png                    Texture referenced by model.dae as: texture.png

# .../public/path/to/component.vwf                            VWF component, native?
# .../public/path/to/component.vwf.json                       or, VWF component, JSON-encoded
# .../public/path/to/component.vwf.yaml                       or, VWF component, YAML-encoded
# .../public/path/to/model.dae                                Model referenced by index.vwf as: model.dae
# .../public/path/to/texture.png                              Texture referenced by model.dae as: texture.png



# Locations

# From static files:

# http://vwf.example.com/path/to/component/                   Serves index.html to browser, index.vwf to VWF client

# http://vwf.example.com/path/to/component/index.html         Served from ^/.../public/path/to/component/index.html if client copied into component directory
# http://vwf.example.com/path/to/component/index.css          Served from ^/.../public/path/to/component/index.css if client copied into component directory
# http://vwf.example.com/path/to/component/vwf.js             Served from ^/.../public/path/to/component/vwf.js if client copied into component directory

# http://vwf.example.com/path/to/component/index.vwf          Served from ^/.../public/path/to/component/index.vwf as JSON only (not JSONP)
# http://vwf.example.com/path/to/component/model.dae          Served from ^/.../public/path/to/component/model.dae
# http://vwf.example.com/path/to/component/texture.png        Served from ^/.../public/path/to/component/texture.png


# A: component/index.vwf

# If serving JSON, YAML from templates or for JSONP:

# http://vwf.example.com/path/to/component/index.html         Served from ^/.../client
# http://vwf.example.com/path/to/component/index.css          Served from ^/.../client
# http://vwf.example.com/path/to/component/vwf.js             Served from ^/.../client

# http://vwf.example.com/path/to/component/index.vwf          Served from ^/.../public/path/to/component/index.vwf.json or .../index.vwf.yaml via template as JSON or JSONP
# http://vwf.example.com/path/to/component/model.dae          Served from ^/.../public/path/to/component/model.dae as static file
# http://vwf.example.com/path/to/component/texture.png        Served from ^/.../public/path/to/component/texture.png as static file

# If running collaboration service:

# http://vwf.example.com/path/to/component/socket             Socket to reflector for applications rooted at this component


# With session:

# http://vwf.example.com/path/to/component/session/

# http://vwf.example.com/path/to/component/session/index.html Served from ^/.../client
# http://vwf.example.com/path/to/component/session/index.css  Served from ^/.../client
# http://vwf.example.com/path/to/component/session/vwf.js     Served from ^/.../client

# http://vwf.example.com/path/to/component/session/index.vwf  Served from ^/.../public/path/to/component/index.vwf.json or .../index.vwf.yaml via template as JSON or JSONP
# http://vwf.example.com/path/to/component/session/model.dae  Served from ^/.../public/path/to/component/model.dae as static file
# http://vwf.example.com/path/to/component/session/texture.png Served from ^/.../public/path/to/component/texture.png as static file

# http://vwf.example.com/path/to/component/session/socket     Socket to reflector for applications rooted at this component



# B: component.vwf

# http://vwf.example.com/path/to/component.vwf/               Serves index.html to browser, component.vwf to VWF client

# http://vwf.example.com/path/to/component.vwf/               Served from ^/.../public/path/to/component.vwf or .../component.vwf.json or .../component.vwf.yaml
# http://vwf.example.com/path/to/component.vwf/model.dae      Served from ^/.../public/path/to/model.dae as static file
# http://vwf.example.com/path/to/component.vwf/texture.png    Served from ^/.../public/path/to/texture.png as static file

# http://vwf.example.com/path/to/component.vwf/index.html     Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/index.css      Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/vwf.js         Served from ^/.../client

# http://vwf.example.com/path/to/component.vwf/socket         Socket to reflector for applications rooted at this component

# With session:

# http://vwf.example.com/path/to/component.vwf/session/       Serves index.html to browser, component.vwf to VWF client

# http://vwf.example.com/path/to/component.vwf/session/index.html Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/session/index.css Served from ^/.../client
# http://vwf.example.com/path/to/component.vwf/session/vwf.js Served from ^/.../client

# http://vwf.example.com/path/to/component.vwf/session/       Served from ^/.../public/path/to/component.vwf or .../component.vwf.json or .../component.vwf.yaml
# http://vwf.example.com/path/to/component.vwf/session/model.dae Served from ^/.../public/path/to/model.dae as static file
# http://vwf.example.com/path/to/component.vwf/session/texture.png Served from ^/.../public/path/to/texture.png as static file

# http://vwf.example.com/path/to/component.vwf/session/socket Socket to reflector for applications rooted at this component







# For location:

# http://vwf.example.com/path/to/application

# if any exist:

# http://vwf.example.com/path/to/application                    Content: http://vwf.example.com/types/some-application
# http://vwf.example.com/path/to/application.json               Content: { "extends": "http://vwf.example.com/types/some-application", "properties": ... }
# http://vwf.example.com/path/to/application.yaml               Content: --- // extends: http://vwf.example.com/types/some-application // properties: // .. ....

# http://vwf.example.com/path/to/application/                   Content: http://vwf.example.com/types/some-application

# http://vwf.example.com/path/to/application/index              Content: http://vwf.example.com/types/some-application
# http://vwf.example.com/path/to/application/index.json         Content: { "extends": "http://vwf.example.com/types/some-application", "properties": ... }
# http://vwf.example.com/path/to/application/index.yaml         Content: --- // extends: http://vwf.example.com/types/some-application // properties: // .. ....

# then:

# http://vwf.example.com/path/to/application/index.html         Served from ^/.../client
# http://vwf.example.com/path/to/application/index.css          Served from ^/.../client
# http://vwf.example.com/path/to/application/vwf.js             Served from ^/.../client
# etc.

# Creates session and redirects to:

# http://vwf.example.com/path/to/application/session

# http://vwf.example.com/path/to/application/session/index.html Served from ^/.../client
# http://vwf.example.com/path/to/application/session/index.css  Served from ^/.../client
# http://vwf.example.com/path/to/application/session/vwf.js     Served from ^/.../client
# etc.

# http://vwf.example.com/path/to/application/session/socket     On connect, sends: createObject <application>


# ----- old -----


# look in "root/" + REQUEST_PATH
# if path is to template, create room and redirect
# tell client "createObject <contents of file>"

# http://vwf.example.com/<index>
# http://vwf.example.com/<index>/session

# http://vwf.example.com/application
# http://vwf.example.com/application/session

# http://vwf.example.com/path/to/<index>
# http://vwf.example.com/path/to/<index>/session

# http://vwf.example.com/path/to/application
# http://vwf.example.com/path/to/application/session


