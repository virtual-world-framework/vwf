class VWF < Sinatra::Base

  require "vwf/pattern"

  configure do

    set :app_file, File.expand_path( File.join( File.dirname(__FILE__), "..", "init.rb" ) )
    set :static, false # we serve out of :public_folder, but only relative to vwf applications

    set :support, lambda { File.join( settings.root, "support" ) }

set :component_template_types, [ :json, :yaml ]  # get from Component?
set :mock_filesystem, nil

  end

  configure :production do
    enable :logging
  end

  configure :development do
    require "logger"
    set :logging, ::Logger::DEBUG
  end

  configure :test do

    # For testing, assume that the filesystem consists of these directories containing these files.

    MOCK_FILESYSTEM =
    {
      "/" =>                    [ "index.vwf", "component.vwf" ],
      "/directory" =>           [ "index.vwf", "component.vwf" ],
      "/types" =>               [ "abc.vwf" ]
    }

    set :mock_filesystem, MOCK_FILESYSTEM

  end

  get Pattern.new do |public_path, application, session, private_path|

    logger.debug "VWF#get #{public_path} - #{application} - #{session} - #{private_path}"

    # Redirect "/path/to/application" to "/path/to/application/", and "/path/to/application/session"
    # to "/path/to/application/session/". But XHR calls to "/path/to/application" get the component
    # data.

    if request.path_info[-1,1] != "/" && private_path.nil?

      if session.nil? && ! request.accept.include?( mime_type :html )  # TODO: pass component request through to normal delegation below?
        Application::Component.new( settings.public_folder ).call env # A component, possibly from a template or as JSONP  # TODO: we already know the template file name with extension, but now Component has to figure it out again
      else
        redirect to request.path_info + "/"
      end

    # For "/path/to/application/", create a session and redirect to "/path/to/application/session/".

    elsif session.nil? && private_path.nil?

      redirect to request.path_info + random_session_id + "/"

    # Delegate everything else to the application.

    else

      delegate_to_application public_path, application, session, private_path

    end

  end

  # Delegate all posts to the application.

  post Pattern.new do |public_path, application, session, private_path|

    logger.debug "VWF#post #{public_path} - #{application} - #{session} - #{private_path}"

    delegate_to_application public_path, application, session, private_path

  end

  helpers do

    def delegate_to_application public_path, application, session, private_path

      application_session = session ?
          File.join( public_path, application, session ) :
          File.join( public_path, application )

      delegated_env = env.merge(
        "SCRIPT_NAME" => application_session,
        "PATH_INFO" => "/" + ( private_path || "index.html" ),  # TODO: do index.* default elsewhere  # TODO: escaped properly for PATH_INFO?
        "vwf.root" => public_path,
        "vwf.application" => application,
        "vwf.session" => session
      )

      Application.new( delegated_env["vwf.root"] ).call delegated_env

    end

    # Generate a random string to be used as a session id.

    def random_session_id  # TODO: don't count on this for security; migrate to a proper session id, in a cookie, at least twice as long, and with verified randomness
      "%08x" % rand( 1 << 32 ) + "%08x" % rand( 1 << 32 ) # rand has 52 bits of randomness; call twice to get 64 bits
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


