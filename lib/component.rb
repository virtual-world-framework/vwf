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

  get /\.vwf$/ do
    begin
      json request.path_info.to_sym  # TODO: path_info is escaped; used route instead?
    rescue Errno::ENOENT  # TODO: there must be a better way to do this
      begin
        yaml request.path_info.to_sym  # TODO: path_info is escaped; used route instead?
      rescue Errno::ENOENT  # TODO: there must be a better way to do this
        404
      end
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
