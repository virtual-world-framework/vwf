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

  configure :test do

    # For testing, assume that the filesystem consists of these directories containing these files.

    MOCK_FILESYSTEM =
    {
      "/" =>                    [ "index", "component" ],
      "/directory" =>           [ "index", "component" ]
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

  get ApplicationPattern.new do |application_path, application, session, socket, public_path|

    # Redirect "/path/to/application" to "/path/to/application/", and "/path/to/application/session"
    # to "/path/to/application/session/".

    if application.nil?
      redirect to( ApplicationPattern.assemble application_path, "dummy", session, socket, public_path )

    # For "/path/to/application/", create a session and redirect to "/path/to/application/session/".

    elsif session.nil?
      redirect to( ApplicationPattern.assemble application_path, application, "0000000000000000", socket, public_path )  # TODO: create session

    # Delegate session socket connections to the reflector.

    elsif socket
      Socketsss.new.call env  # TODO: path?

    # Delegate everything else to the static file server on the client files directory.

    else
      Rack::File.new( settings.client ).call env.merge( "PATH_INFO" => "/#{ public_path || "index.html" }" )

    end

  end

  helpers do

    def json template, options = {}, locals = {}
      render :json, template, options.merge( component_options ), locals
    end

    def yaml template, options = {}, locals = {}
      render :yaml, template, options.merge( component_options ), locals
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


