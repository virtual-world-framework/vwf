class VWF::Application

  # Wrap Rack::File to serve "/" as "/index.html". Serve client files from the client support
  # directory.

  class Client

    # Root directory for the client files.

    ROOT = File.join VWF.settings.support, "client/lib"

    # Root directory for the minified client. The minified client is used in `production` mode if
    # this directory exists. Otherwise the unminified client is used.

    ROOTZ = File.join VWF.settings.support, "client/libz"

    def initialize
      if ENV['RACK_ENV'] == "production" && File.directory?( ROOTZ )
        @file = Rack::File.new ROOTZ
      else
        @file = Rack::File.new ROOT
      end
    end

    def call env
      if %w[ GET HEAD ].include?( env["REQUEST_METHOD"] ) && env["PATH_INFO"] == "/"
        env["PATH_INFO"] = "/index.html"
      elsif %w[ GET HEAD ].include?( env["REQUEST_METHOD"] ) && env["PATH_INFO"] == "/socket.io.js"
        env["PATH_INFO"] = "/socket.io-0.6.js"
      end
      @file.call env
    end

  end

end
