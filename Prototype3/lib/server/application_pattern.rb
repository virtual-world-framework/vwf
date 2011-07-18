class Server::ApplicationPattern

  Match = Struct.new :captures

  attr_writer :mock_filesystem

  def initialize

    @applications = Server.settings.applications

    @template_extensions = Server.settings.component_template_types.map do |template_type|
      "." + template_type.to_s
    end .unshift ""

    @captures = Match.new []

    @mock_filesystem = Server.settings.mock_filesystem

  end

  # incoming path                                       application_path        application     session         socket          public_path             

  # /path/to/application                                "/path/to/application"  nil             nil             nil             nil                     
  # /path/to/application/                               "/path/to/application"  "index"         nil             nil             nil                     

  # /path/to/application/socket/path                    "/path/to/application"  "index"         nil             "socket/path"   nil                     
  # /path/to/application/path/to/client/file            "/path/to/application"  "index"         nil             nil             "path/to/client/file"  

  # /path/to/application/session                        "/path/to/application"  nil             "session"       nil             nil                     
  # /path/to/application/session/                       "/path/to/application"  "index"         "session"       nil             nil                     

  # /path/to/application/session/socket/path            "/path/to/application"  "index"         "session"       "socket/path"   nil                     
  # /path/to/application/session/path/to/client/file    "/path/to/application"  "index"         "session"       nil             "path/to/client/file"  

  def match path

    application_path = "/"

    segments = path.split "/"
    segments.shift # the first segment is empty since path has a leading slash

    file_url = path[-1,1] != "/"

    while segment = segments.first and directory? File.join( application_path, segment )
      application_path = File.join application_path, segments.shift
    end

    if segment = segments.first and extension = component?( File.join( application_path, segment ) )
      application_path = File.join application_path, segments.shift
      application = segment + extension
    elsif extension = component?( File.join( application_path, "index" ) )  # TODO: configuration parameter for default application name
      application = "index" + extension  # TODO: configuration parameter for default application name
    end

    if extension

      session = segments.shift if session?( segments.first )
      application = nil if segments.empty? && file_url
      socket = File.join( segments.shift segments.length ) if socket?( segments.first )
      public_path = File.join( segments.shift segments.length ) unless segments.empty?

      Match.new [ application_path, application, session, socket, public_path ]

    end

    # TODO: which parts are URL paths and which are filesystem paths? don't use File.join on URL paths

  end

  # Assemble the pieces back into a path.

  def self.assemble application_path, application, session, socket, public_path
    "#{ application_path == "/" ? "" : application_path }#{ session && "/" + session }#{ application && "/" }#{ socket }#{ public_path }"
  end

private

  def directory? path
    if @mock_filesystem
      @mock_filesystem.any? do |directory, files|
        path == directory
      end
    else
      File.directory? File.join( @applications, path )
    end
  end

  def file? path
    if @mock_filesystem
      @mock_filesystem.any? do |directory, files|
        files.any? do |file|
          path == File.join( directory, file )
        end
      end
    else
      File.file? File.join( @applications, path )
    end
  end

  def component? path
    @template_extensions.any? do |template_extension|
      if file? path + template_extension
        break template_extension
      end
    end
  end

  def session? segment
    segment =~ /^[0-9A-Za-z]{16}$/
  end

  def socket? segment
    segment == "socket" || segment == "websocket"
  end

end
