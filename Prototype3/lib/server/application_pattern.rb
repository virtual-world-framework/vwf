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

  # incoming path                                       application_path        public_path             application     session         private_path            

  # /path/to/component                                  "/path/to/component"    "/path/to/component"    "index.vwf"     nil             nil                     
  # /path/to/component/                                 "/path/to/component"    "/path/to/component"    "index.vwf"     nil             nil                     
  # /path/to/component/path/to/client/file              "/path/to/component"    "/path/to/component"    "index.vwf"     nil             "path/to/client/file"   
  # /path/to/component/path/to/component/file           "/path/to/component"    "/path/to/component"    "index.vwf"     nil             "path/to/component/file"
  # /path/to/component/socket/path                      "/path/to/component"    "/path/to/component"    "index.vwf"     nil             "socket/path"           

  # /path/to/component.vwf                              "/path/to/component.vwf" "/path/to"             "component.vwf" nil             nil                     
  # /path/to/component.vwf/                             "/path/to/component.vwf" "/path/to"             "component.vwf" nil             nil                     
  # /path/to/component.vwf/path/to/client/file          "/path/to/component.vwf" "/path/to"             "component.vwf" nil             "path/to/client/file"   
  # /path/to/component.vwf/path/to/component/file       "/path/to/component.vwf" "/path/to"             "component.vwf" nil             "path/to/component/file"
  # /path/to/component.vwf/socket/path                  "/path/to/component.vwf" "/path/to"             "component.vwf" nil             "socket/path"           

  # /path/to/component/session                          "/path/to/component"    "/path/to/component"    "index.vwf"     "session"       nil                     
  # /path/to/component/session/                         "/path/to/component"    "/path/to/component"    "index.vwf"     "session"       nil                     
  # /path/to/component/session/path/to/client/file      "/path/to/component"    "/path/to/component"    "index.vwf"     "session"       "path/to/client/file"   
  # /path/to/component/session/path/to/component/file   "/path/to/component"    "/path/to/component"    "index.vwf"     "session"       "path/to/component/file"
  # /path/to/component/session/socket/path              "/path/to/component"    "/path/to/component"    "index.vwf"     "session"       "socket/path"           

  # /path/to/component.vwf/session                      "/path/to/component.vwf" "/path/to"             "component.vwf" "session"       nil                     
  # /path/to/component.vwf/session/                     "/path/to/component.vwf" "/path/to"             "component.vwf" "session"       nil                     
  # /path/to/component.vwf/session/path/to/client/file  "/path/to/component.vwf" "/path/to"             "component.vwf" "session"       "path/to/client/file"   
  # /path/to/component.vwf/session/path/to/component/file "/path/to/component.vwf" "/path/to"           "component.vwf" "session"       "path/to/component/file"
  # /path/to/component.vwf/session/socket/path          "/path/to/component.vwf" "/path/to"             "component.vwf" "session"       "socket/path"           

  def match path

    public_path = "/"

    segments = path.split "/"
    segments.shift # the first segment is empty since path has a leading slash

    while segment = segments.first and directory? File.join( public_path, segment )
      public_path = File.join public_path, segments.shift
    end

    if segment = segments.first and extension = component?( File.join( public_path, segment ) )
      application = segment + extension
      segments.shift
    elsif extension = component?( File.join( public_path, "index.vwf" ) )  # TODO: configuration parameter for default application name
      application = "index.vwf" + extension  # TODO: configuration parameter for default application name
    end

# puts "#{path} * #{public_path} * #{application} * #{extension} * #{segments}"

    if extension

      session = segments.shift if session?( segments.first )
      # application = nil if segments.empty? && file_url
      # socket = File.join( segments.shift segments.length ) if socket?( segments.first )
      private_path = File.join( segments.shift segments.length ) unless segments.empty?

      # Match.new [ application_path, application, session, socket, private_path ]
      Match.new [ public_path, application, session, private_path ]

    end

    # TODO: which parts are URL paths and which are filesystem paths? don't use File.join on URL paths

  end

  # Assemble the pieces back into a path.

#   def self.assemble application_path, public_path, application, session, private_path
# puts "assemble: #{application_path} * #{public_path} * #{application} * #{session} * #{private_path}: #{ application_path == "/" ? "" : application_path }#{ session && "/" + session }#{ application && "/" }#{ public_path }"
#     "#{ application_path == "/" ? "" : application_path }#{ session && "/" + session }#{ application && "/" }#{ private_path }"
#   end

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
    path =~ /\.vwf$/ && @template_extensions.any? do |template_extension|
      if file? path + template_extension
        break template_extension
      end
    end
  end

  def session? segment
    segment =~ /^[0-9A-Za-z]{16}$/
  end

  # def socket? segment
  #   segment == "socket" || segment == "websocket"
  # end

end
