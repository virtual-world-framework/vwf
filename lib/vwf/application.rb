# Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
# Secretary of Defense (Personnel & Readiness).
# 
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
# in compliance with the License. You may obtain a copy of the License at
# 
#   http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.

class VWF::Application < Sinatra::Base

  ## Types supported by the API resources, in order of preference.

  @@api_types = [
    "application/json",
    "text/yaml",
    "text/html"
  ]

  configure do

    # Condition to detect browser requests, as opposed to XHR requests. Browser requests for
    # application resources should bootstrap the client, and singular application resources should
    # redirect to directory resources.

    set :browser do |wants_browser|
      condition do
        is_browser = !! request.accept.include?( "text/html" )  # `accept.include?`, not `accept?`; want explict `text/html`
        wants_browser == is_browser
      end
    end

    set :instance do |requires_instance|
      condition do
        is_instance = !! @instance
        requires_instance == is_instance
      end
    end

    set :revision do |requires_revision|
      condition do
        is_revision = !! @revision
        requires_revision == is_revision
      end
    end

  end

  configure :production do

    enable :logging

  end

  configure :development do

    register Sinatra::Reloader

    require "logger"
    set :logging, ::Logger::DEBUG

  end

  ### Detect and remove `.:format`. ################################################################

  before ".:format" do |format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instances.:format" do |format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instance/:instance_id.:format" do |_, format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instance/:instance_id/revisions.:format" do |_, format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  before "/instance/:instance_id/revision/:revision_id.:format" do |_, _, format|
    if type = Rack::Mime.mime_type( ".#{format}" ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape ".#{format}" }$/, "" )
    end
  end

  ### Validate the application, instance, and revision. ############################################

  before "/?*" do
    if @application = VWF.storage[ request.script_name ]
      @script_name = request.script_name
    else
      halt 404
    end
  end

  before "/instance/:instance_id/?*" do |instance_id, _|
    if @instance = @application.instances[ instance_id ] || @application.instances.create( instance_id, @application.state )  # TODO: remove second clause to stop auto-creating arbitrary instances
      route_as "/instance/#{instance_id}"
    else
      halt 404
    end
  end

  before "/revision/:revision_id/?*", :instance => true do |revision_id, _|
    if @revision = @instance.revisions[ revision_id ] || @instance.revisions.create( revision_id )  # TODO: remove second clause to stop auto-creating arbitrary revisions; verify against existing states/actions
      route_as "/revision/#{revision_id}"
    else
      halt 404
    end
  end

  ### Redirect singular resources to directory resources. ##########################################

  get "", :browser => true do
    pass if @type
    redirect to "#{request.path_info}/"
  end

  # Redirect the application to a new instance. ####################################################

  get "/", :browser => true do
    case mode
      when "application"  # redirect an application to a new instance
        @instance = @application.instances.create( @application.state )
        redirect to "/instance/#{@instance.id}/"
      when "instance"  # bootstrap the client from an instance
        Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
      when "revision"  # redirect a revision to a copy in a new instance
        @instance = @application.instances.create( @revision.state )
        unroute_as
        redirect to "/instance/#{@instance.id}/"
    end
  end

  ### Serve the reflector ##########################################################################

  get "/reflector/?*" do

    route_as "/reflector"

    case mode
      when "application"
        Reflector.new( @application, true ).call env
      when "instance"
        Reflector.new( @instance ).call env
      when "revision"
        Reflector.new( @revision, true ).call env
    end

  end

  ### Serve the client files. ######################################################################

  get "/client/?*" do
    route_as "/client"
    Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
  end

  # Application state. #############################################################################

  get "" do
    case @type || request.preferred_type( @@api_types )
      when "application/json"
        content_type :json
        item_value.to_json
      when "text/yaml"
        content_type :yaml
        item_value.to_yaml
      when "text/html"
        slim item_template
    end
  end

  get %r{^/(instances|revisions)$} do
    case @type || request.preferred_type( @@api_types )
      when "application/json"
        content_type :json
        collection_value.to_json
      when "text/yaml"
        content_type :yaml
        collection_value.to_yaml
      when "text/html"
        slim collection_template
    end
  end

  helpers do

    def route_as migrating_segments
      if request.path_info.start_with? migrating_segments
        request.script_name += migrating_segments
        request.path_info = request.path_info[ migrating_segments.length .. -1 ]
      end
    end

    def unroute_as
      request.script_name = @script_name
    end

    def mode
      if @revision
        "revision"
      elsif @instance
        "instance"
      elsif @application
        "application"
      end
    end

    def item_value
      case mode
        when "application"
          @application.get
        when "instance"
          @instance.state
        when "revision"
          @revision.state
      end
    end

    def collection_value
      case mode
        when "application"  # assumes `/instances`
          @application.instances.each.map do |id, instance|
            to instance_url instance.id
          end
        when "instance"  # assumes `/revisions`
          @instance.revisions.each.map do |id, revision|
            to revision_url @instance.id, revision.id
          end
      end
    end

    def item_template
      case mode
        when "application"
          :application
        when "instance"
          :instance
        when "revision"
          :revision
      end
    end

    def collection_template
      case mode
        when "application"  # assumes `/instances`
          :instances
        when "instance"  # assumes `/revisions`
          :revisions
      end
    end

    def application_url format = nil
      "#{extension format}"
    end

    def instances_url format = nil
      "/instances#{extension format}"
    end

    def instance_url instance_id, format = nil
      "/instance/#{instance_id}#{extension format}"
    end

    def revisions_url instance_id, format = nil
      "/instance/#{instance_id}/revisions#{extension format}"
    end

    def revision_url instance_id, revision_id, format = nil
      "/instance/#{instance_id}/revision/#{revision_id}#{extension format}"
    end

    def extension format = nil
      format ? ".#{format}" : ""
    end

  end













  # Wrap Rack::File to serve "/" as "/index.html".

  class Client

    def initialize root, rootz
      if ENV['RACK_ENV'] == "production" && File.directory?( rootz )
        @file = Rack::File.new rootz
      else
        @file = Rack::File.new root
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
