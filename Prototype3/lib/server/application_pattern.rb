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

  def match path

    application_path = "/"

    segments = path.split "/"
    segments.shift # the first segment is empty since path has a leading slash

    trailing_slash = path[-1,1] == "/"

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
      application_path = File.join( application_path, "" ) if !segments.empty? || trailing_slash
      session = segments.shift if segments.first && session?( segments.first )
      socket = segments.shift if session && segments.first && socket?( segments.first )
      public_path = !segments.empty? ? File.join( segments.unshift( "" ) ) : nil
      Match.new [ application_path, public_path, application, session, socket ]
    end

    # TODO: which parts are URL paths and which are filesystem paths? don't use File.join on URL paths

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
    segment == "socket"
  end

end
