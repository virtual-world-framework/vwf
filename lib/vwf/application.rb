class VWF::Application

  def initialize root

    @app = Rack::Builder.new do

      map "/admin" do
        run Admin
      end

      map "/" do
        run Rack::Cascade.new [
          Reflector.new,                                          # The WebSocket reflector  # TODO: not for session==nil?  # Reflector.new( :debug => true, :backend => { :debug => true } ),
          Rack::File.new( VWF.settings.client ),                  # Client files from ^/support/client
          Rack::File.new( File.join VWF.settings.public, root ),  # Public content from ^/public  # TODO: will match public_path/index.html which we don't really want
          Component.new( File.join VWF.settings.public, root )    # A component, possibly from a template or as JSONP  # TODO: before public for serving plain json as jsonp?
        ]
      end

    end

  end
  
  def call env
    @app.call env
  end

  def self.call env
    new.call env
  end

end
