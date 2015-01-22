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

  def initialize application
    super nil
    @application_id = application
  end

  configure do

    # Condition to detect browser requests, as opposed to XHR requests. Browser requests for
    # application resources should bootstrap the client, and singular application resources should
    # redirect to directory resources.

    set( :browser ) do |want_browser|
      condition do
        is_browser = !! request.accept.include?( "text/html" )  # `accept.include?`, not `accept?`; want explict `text/html`
        want_browser == is_browser
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
    if type = Rack::Mime.mime_type( "." + format ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape "." + format }$/, "" )
    end
  end

  before "/instances.:format" do |format|
    if type = Rack::Mime.mime_type( "." + format ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape "." + format }$/, "" )
    end
  end

  before "/instance/:instance_id.:format" do |_, format|
    if type = Rack::Mime.mime_type( "." + format ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape "." + format }$/, "" )
    end
  end

  before "/instance/:instance_id/revisions.:format" do |_, format|
    if type = Rack::Mime.mime_type( "." + format ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape "." + format }$/, "" )
    end
  end

  before "/instance/:instance_id/revision/:revision_id.:format" do |_, _, format|
    if type = Rack::Mime.mime_type( "." + format ) and @@api_types.include?( type )
      @type = type
      request.path_info = request.path_info.sub( /#{ Regexp.escape "." + format }$/, "" )
    end
  end

  ### Validate the application, instance, and revision. ############################################

  before "/?*" do
    @application = VWF.storage[ @application_id ] || VWF.storage.create( @application_id, application_state )
    halt 404 unless @application
  end

  before "/instance/:instance_id/?*" do |instance_id, _|
    @instance = @application.instances[ instance_id ] || @application.instances.create( instance_id, instance_state )  # TODO: remove second clause to stop auto-creating arbitrary instances
    halt 404 unless @instance
  end

  before "/instance/:instance_id/revision/:revision_id/?*" do |_, revision_id, _|
    @revision = @instance.revisions[ revision_id ]
    halt 404 unless @revision
  end

  ### Redirect singular resources to directory resources. ##########################################

  get "", :browser => true do
    pass if @type
    redirect to request.path_info + "/"
  end

  get "/instance/:instance_id", :browser => true do
    pass if @type
    redirect to request.path_info + "/"
  end

  get "/instance/:instance_id/revision/:revision_id", :browser => true do
    pass if @type
    redirect to request.path_info + "/"
  end

  # Redirect the application to a new instance. ####################################################

  get "/", :browser => true do
    @instance = @application.instances.create( instance_state )
    redirect to "/instance/" + @instance.id + "/"
  end

  # Bootstrap the client from an instance.

  get "/instance/:instance_id/", :browser => true do |instance_id|
    request.script_name += "/instance/#{instance_id}"
    request.path_info = "/"
    Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
  end

  # Bootstrap the client from a revision.  TODO: duplicate and redirect to a new instance

  get "/instance/:instance_id/revision/:revision_id/", :browser => true do |instance_id, revision_id|
    request.script_name += "/instance/#{instance_id}/revision/#{revision_id}"
    request.path_info = "/"
    Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
  end

  ### Serve the reflector ##########################################################################

  get "/instance/:instance_id/websocket/?*" do |instance_id, _|
    request.script_name += "/instance/#{instance_id}"
    request.path_info = "/websocket"  # TODO: plus rest
    Reflector.new( "#{@application_id}/#{instance_id}", @instance ).call env
  end

  ### Serve the client files. ######################################################################

# "/*" blocks all the api calls below, but these will go to "/client/*"

  get "/instance/:instance_id/revision/:revision_id/*" do |instance_id, revision_id, path_info|
pass if @type
    request.script_name += "/instance/#{instance_id}/revision/#{revision_id}"
    request.path_info = "/#{path_info}"
    Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
  end

  get "/instance/:instance_id/*" do |instance_id, path_info|
pass if @type
pass if path_info.match /^revision/
    request.script_name += "/#{instance_id}"
    request.path_info = "/#{path_info}"
    Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
  end

  get "/*" do |path_info|
pass if @type
pass if path_info.match /^instance/
    Client.new( File.join( VWF.settings.support, "client/lib" ), File.join( VWF.settings.support, "client/libz" ) ).call env
  end

  # Application state. #############################################################################

  get "" do

    case @type || request.preferred_type( @@api_types )
      when "application/json"
        content_type :json
        @application.get.to_json
      when "text/yaml"
        content_type :yaml
        @application.get.to_yaml
      when "text/html"
        # slim :application  # TODO
    end

  end

  get "/instances" do

    case @type || request.preferred_type( @@api_types )
      when "application/json"
        content_type :json
        @application.instances.map { |id, instance| to instance_url instance.id } .to_json
      when "text/yaml"
        content_type :yaml
        @application.instances.map { |id, instance| to instance_url instance.id } .to_yaml
      when "text/html"
        slim :instances
    end

  end

  get "/instance/:instance_id" do

    case @type || request.preferred_type( @@api_types )
      when "application/json"
        content_type :json
        @instance.get.to_json
      when "text/yaml"
        content_type :yaml
        @instance.get.to_yaml
      when "text/html"
        slim :instance
    end

  end

  get "/instance/:instance_id/revisions" do

    case @type || request.preferred_type( @@api_types )
      when "application/json"
        content_type :json
        @instance.revisions.map { |id, revision| to revision_url @instance.id, revision.id } .to_json
      when "text/yaml"
        content_type :yaml
        @instance.revisions.map { |id, revision| to revision_url @instance.id, revision.id } .to_yaml
      when "text/html"
        slim :revisions
    end

  end

  get "/instance/:instance_id/revision/:revision_id" do

    case @type || request.preferred_type( @@api_types )
      when "application/json"
        content_type :json
        @revision.get.to_json
      when "text/yaml"
        content_type :yaml
        @revision.get.to_yaml
      when "text/html"
        slim :revision
    end

  end

  helpers do

    def application_url format = nil
      "" + extension( format )
    end

    def instances_url format = nil
      "/instances" + extension( format )
    end

    def instance_url instance_id, format = nil
      "/instance/" + instance_id + extension( format )
    end

    def revisions_url instance_id, format = nil
      "/instance/" + instance_id + "/revisions" + extension( format )
    end

    def revision_url instance_id, revision_id, format = nil
      "/instance/" + instance_id + "/revision/" + revision_id + extension( format )
    end

    def extension format = nil
      format ? "." + format : ""
    end

  end

  def application_state
    @application_id
  end

  def instance_state

    Hash[
      "kernel" => {
        "time" => 0      # TODO: this time doesn't (shouldn't) matter
      },
      "nodes" => [
        "http://vwf.example.com/clients.vwf",
        @application.get,
      ],
      "annotations" => {
        "1" => "application"
      },
      "queue" => {
        "sequence" => 0,  # TODO: simplify state: remove existing kernel.time, move queue.{sequence.time} to kernel.{...}, move queue.queue[] to queue[]
        "time" => 0
      }
    ]

  end

  def revision_state
    instance_state
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
