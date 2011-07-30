class Server < Sinatra::Base

  require "server/application_pattern"

  configure do

    set :app_file, File.expand_path( File.join( File.dirname(__FILE__), "..", "init.rb" ) )
    set :static, false # we serve out of :public, but it's part of the Cascade

    set :client, lambda { File.join( settings.root, "support", "client" ) }

    set :component_template_types, [ :json, :yaml ]  # get from Component?

    set :mock_filesystem, nil

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
      "/directory" =>           [ "index.vwf", "component.vwf" ],
      "/types" =>               [ "abc.vwf" ]
    }

    set :mock_filesystem, MOCK_FILESYSTEM

  end

  get ApplicationPattern.new do |public_path, application, session, private_path|

    logger.debug "Server#get ApplicationPattern #{public_path} - #{application} - #{session} - #{private_path}"

    # Redirect "/path/to/application" to "/path/to/application/", and "/path/to/application/session"
    # to "/path/to/application/session/". But XHR calls to "/path/to/application" get the component
    # data.

    if request.route[-1,1] != "/" && private_path.nil?

      if session.nil? && ! request.accept.include?( mime_type :html )
        Component.new( settings.public ).call env # A component, possibly from a template or as JSONP  # TODO: we already know the template file name with extension, but now Component has to figure it out again
      else
        redirect to request.route + "/"
      end

    # For "/path/to/application/", create a session and redirect to "/path/to/application/session/".

    elsif session.nil? && private_path.nil?

      redirect to request.route + "0000000000000000/"

    # Delegate everything else based on the private_path.

    else

      application_session = session ?
          File.join( public_path, application, session ) :
          File.join( public_path, application )

      if private_path.nil?
      
        delegated_env = env.merge(
          "SCRIPT_NAME" => application_session,
          "PATH_INFO" => "/index.html"
          # TODO: what about REQUEST_PATH, REQUEST_URI, others? any better way to forward env? also SCRIPT_NAME?
        )

        Rack::Cascade.new( [
          Rack::File.new( settings.client ),      # Client files from ^/support/client
        ] ).call delegated_env

      else
      
        delegated_env = env.merge(
          "SCRIPT_NAME" => application_session,
          "PATH_INFO" => "/#{ private_path }",  # TODO: escaped properly for PATH_INFO?
          "vwf.base_path" => public_path,
          "vwf.application" => application
          # TODO: what about REQUEST_PATH, REQUEST_URI, others? any better way to forward env? also SCRIPT_NAME?
        )

        Rack::Cascade.new( [
          Rack::File.new( settings.client ),      # Client files from ^/support/client
          Rack::File.new( File.join settings.public, public_path ), # Public content from ^/public  # TODO: will match public_path/index.html which we don't really want
          Component.new( File.join settings.public, public_path ),  # A component, possibly from a template or as JSONP  # TODO: before public for serving plain json as jsonp?
          Reflector.new                           # The WebSocket reflector  # TODO: not for session==nil
        ] ).call delegated_env

      end

    end
    
  end

  helpers do

    def logger  # TODO: remove after Sinatra 1.3
      request.logger
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


