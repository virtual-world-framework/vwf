require "component_templates"

class Component < Sinatra::Base

  def initialize root
    super nil
    @root = root
  end

  configure do
    mime_type :json, "application/json"  # TODO: already in Rack::Mime.MIME_TYPES?
    mime_type :jsonp, "application/javascript"
  end

  get %r{/([^/]*\.vwf)$} do |path|
    begin
      json path.to_sym
    rescue Errno::ENOENT  # TODO: there must be a better way to do this
      yaml path.to_sym
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
        { :layout => false, :views => @root, :default_content_type => :jsonp, :callback => callback }
      else
        { :layout => false, :views => @root, :default_content_type => :json }
      end
    end

  end

end
