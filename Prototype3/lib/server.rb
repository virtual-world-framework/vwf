require "component_templates"

class Server < Sinatra::Base

  require "server/application_pattern"

  configure do

    set :app_file, File.expand_path( File.join( File.dirname(__FILE__), "..", "init.rb" ) )

    set :public, lambda { File.join( settings.root, "public", "client" ) }  # TODO: remove
    set :applications, lambda { File.join( settings.root, "public", "applications" ) }  # TODO: better name

    set :component_template_types, [ :json, :yaml ]

    set :mock_filesystem, nil

    mime_type :json, "application/json"
    mime_type :jsonp, "application/javascript"

  end

  configure :test do

    MOCK_FILESYSTEM =
    {
      "/" =>                    [ "index.yaml", "component.yaml" ],
      "/directory" =>           [ "index.yaml", "component.yaml" ]
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

  get ApplicationPattern.new do |application_path, public_path, application, session, socket|

puts "--- #{env["PATH_INFO"]}"
puts "application_path: #{application_path}"
puts "public_path: #{public_path}"
puts "application: #{application}"
puts "session: #{session}"
puts "socket #{socket}"

    if socket
      Socketsss.new.call env  # TODO: path?
    elsif application_path[-1,1] == "/"
      Rack::File.new( settings.public ).call env.merge( "PATH_INFO" => public_path || "/index.html" )
    else
      redirect to( application_path + "/" )
    end


      
    # if public_path.empty?
    #   [ 200, { "Content-Type" => "text/plain" }, "Application: #{application}" ]
    # else
    #   Rack::File.new( settings.public ).call env.merge( "PATH_INFO" => public_path )
    # end

    # pass unless public_path.empty?

  end

  # get "*/socket" do |application|
  #   Socketsss.new.call env
  # end



# /path/to/application
# /path/to/application/

  # get "/" do
  #   call env.merge( "PATH_INFO" => "/index.html" )
  # end

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



# application_path session file_path

#<root>/<PATH_INFO> exists?
#   pi is file: pi, pi.json, pi.yaml
#   pi is dir: pi/index, pi/index.json, pi/index.yaml
#


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


